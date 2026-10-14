#!/usr/bin/env node
// Ghi giá trị một field của Project cho nhiều issue — bước riêng của agent, skill chấm SWP không ghi.
// --from: JSON dạng { "<số issue>": giá trị } hoặc [{ "number": n, "<value-key>": v }]
// --value-key: tên khoá chứa giá trị khi --from là mảng, mặc định value (vd finalSWP, hours)
//   NUMBER → số · SINGLE_SELECT → tên option · ITERATION → tên sprint · null → xoá giá trị
// --delay: mili-giây nghỉ sau mỗi lần ghi, mặc định 300; hạn mức / lỗi mạng thì chờ rồi thử lại (lib/github-mutation.mjs)
// Dùng: node scripts/set-field.mjs --field "Story Point" --from data/swp-scores.final.json --value-key finalSWP [--delay 300] [--dry-run]
import { readJson, parseArgs } from './lib/gh-graphql.mjs';
import { createMutator } from './lib/github-mutation.mjs';
import { fetchSnapshot, FIELD_KEYS } from './snapshot-project.mjs';

const args = parseArgs();
const dry = Boolean(args['dry-run']);
const delayMs = Number(args.delay ?? 300);
if (!(delayMs >= 0)) throw new Error('--delay phải là số mili-giây ≥ 0');
const mutate = createMutator({ delayMs });
const fieldName = args.field;
if (!fieldName || !args.from) {
  console.error('cần --field <tên field> --from <file json>');
  process.exit(1);
}

const ids = readJson('data/project-ids.json');
const field = ids.fields[fieldName];
if (!field) throw new Error(`Project không có field "${fieldName}"`);

const raw = readJson(args.from);
const valueKey = args['value-key'] || 'value';
const entries = Array.isArray(raw) ? raw.map((r) => [String(r.number), r[valueKey]]) : Object.entries(raw);

const snapshot = fetchSnapshot();
const itemByNumber = new Map(snapshot.items.map((i) => [String(i.number), i]));

function toValue(v) {
  if (field.dataType === 'NUMBER') {
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`"${fieldName}" cần số, nhận ${JSON.stringify(v)}`);
    return { number: v };
  }
  if (field.dataType === 'SINGLE_SELECT') {
    const id = field.options[v];
    if (!id) throw new Error(`"${fieldName}" không có option "${v}"`);
    return { singleSelectOptionId: id };
  }
  if (field.dataType === 'ITERATION') {
    const it = field.iterations[v];
    if (!it) throw new Error(`"${fieldName}" không có iteration "${v}"`);
    return { iterationId: it.id };
  }
  throw new Error(`chưa hỗ trợ kiểu ${field.dataType}`);
}

// Ghi (hoặc xoá khi value = null) giá trị field của một item trên Project
async function writeValue(item, value) {
  if (value === null) {
    await mutate(`mutation($p:ID!,$i:ID!,$f:ID!){ clearProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,fieldId:$f}){ clientMutationId } }`,
      { p: ids.projectId, i: item.itemId, f: field.id });
    return;
  }
  await mutate(`mutation($p:ID!,$i:ID!,$f:ID!,$v:ProjectV2FieldValue!){ updateProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,fieldId:$f,value:$v}){ clientMutationId } }`,
    { p: ids.projectId, i: item.itemId, f: field.id, v: toValue(value) });
}

const snapshotKey = FIELD_KEYS[fieldName];
// Kiểm hết trước khi ghi: issue có trên Project, không lặp số, giá trị hợp lệ → không có lần chạy ghi dở dang
const seen = new Set();
const planned = entries.map(([number, value]) => {
  if (seen.has(number)) throw new Error(`#${number} xuất hiện hai lần trong ${args.from}`);
  seen.add(number);
  const item = itemByNumber.get(number);
  if (!item) throw new Error(`issue #${number} không có trên Project`);
  if (value === undefined) throw new Error(`#${number}: thiếu giá trị (input cần { "<số>": v } hoặc [{ number, ${valueKey} }])`);
  if (value !== null) toValue(value);
  return { number, item, value };
});
let changed = 0;
let same = 0;
for (const { number, item, value } of planned) {
  if (snapshotKey && item[snapshotKey] === value) { same++; continue; }
  if (dry) console.log(`[dry] #${number} ${fieldName}: ${item[snapshotKey] ?? '∅'} → ${value ?? '∅'}`);
  else await writeValue(item, value);
  changed++;
}
console.log(`${dry ? '[dry] ' : ''}${fieldName}: ${changed} đổi, ${same} giữ nguyên`);
