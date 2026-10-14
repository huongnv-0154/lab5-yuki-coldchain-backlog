#!/usr/bin/env node
// Quy SWP ra giờ theo quy ước một hệ số: giờ lá = SWP × k (làm tròn 0,5h), giờ container = Σ giờ con.
// Đầu vào: data/swp-scores.final.json (extract-swp.mjs) + data/hours-calibration.json ({ k, ... } — DR-06).
// Ra: data/hours.final.json [{ number, container, swp, hours }]. Lá vượt --max-hours (mặc định 16) → in ra, exit 1,
// KHÔNG ghi file (issue đó phải tách lại, không nới k).
// --check: tính lại giờ rồi so với data/hours.final.json và Estimated time trong data/project-snapshot.json; không ghi.
// Dùng: node scripts/derive-hours.mjs [--max-hours 16] [--check]
import { readJson, writeJson, parseArgs } from './lib/gh-graphql.mjs';

const OUT = 'data/hours.final.json';
const args = parseArgs();
const maxHours = Number(args['max-hours'] ?? 16);
const errors = [];

const { k } = readJson('data/hours-calibration.json');
if (!(k > 0)) throw new Error('data/hours-calibration.json: k phải là số > 0');
const scores = readJson('data/swp-scores.final.json');
const byNumber = new Map(scores.map((s) => [s.number, s]));
const halfHour = (h) => Math.round(h * 2) / 2;

// Nhớ giờ đã tính theo số issue để container không tính lại con
const hoursCache = new Map();
function hoursOf(score) {
  if (hoursCache.has(score.number)) return hoursCache.get(score.number);
  const hours = score.container
    ? score.children.reduce((total, n) => total + hoursOf(byNumber.get(n)), 0)
    : halfHour(score.finalSWP * k);
  hoursCache.set(score.number, hours);
  return hours;
}

const rows = scores.map((s) => ({ number: s.number, container: s.container, swp: s.finalSWP, hours: hoursOf(s) }));
for (const r of rows) if (!r.container && r.hours > maxHours) errors.push(`#${r.number} ${r.swp} SWP → ${r.hours}h > ${maxHours}h — cần tách`);

if (args.check) {
  const file = new Map(readJson(OUT).map((r) => [r.number, r.hours]));
  const snap = readJson('data/project-snapshot.json').items;
  if (file.size !== rows.length) errors.push(`${OUT} có ${file.size} item, tính lại ra ${rows.length}`);
  if (snap.length !== rows.length) errors.push(`Project có ${snap.length} item, tính lại ra ${rows.length}`);
  const want = new Map(rows.map((r) => [r.number, r.hours]));
  for (const r of rows) if (file.get(r.number) !== r.hours) errors.push(`#${r.number} ${OUT} ghi ${file.get(r.number) ?? '∅'}, tính lại ${r.hours}`);
  for (const it of snap) {
    if (!want.has(it.number)) errors.push(`#${it.number} có trên Project nhưng không có trong data/swp-scores.final.json`);
    else if (it.estimatedTime !== want.get(it.number)) errors.push(`#${it.number} Estimated time ${it.estimatedTime ?? '∅'} ≠ tính lại ${want.get(it.number)}`);
  }
  for (const e of errors) console.log(`✗ ${e}`);
  console.log(errors.length ? `FAIL: ${errors.length} lỗi` : `PASS: ${snap.length} item, Estimated time và ${OUT} khớp SWP × ${k}`);
  process.exit(errors.length ? 1 : 0);
}

for (const e of errors) console.log(`✗ ${e}`);
if (errors.length) process.exit(1);
writeJson(OUT, rows);
const leafTotal = rows.filter((r) => !r.container).reduce((t, r) => t + r.hours, 0);
console.log(`${OUT}: k = ${k}h/SWP, ${rows.length} item, tổng giờ lá ${leafTotal}h (${leafTotal / 8} MD)`);
