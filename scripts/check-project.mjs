#!/usr/bin/env node
// Kiểm cấu hình + dữ liệu Project từ data/project-ids.json và data/project-snapshot.json.
// Không gọi mạng: chạy snapshot-project.mjs trước. Lỗi nào cũng in ra, exit 1 nếu có lỗi.
// Dùng: node scripts/check-project.mjs [--require-points] [--require-hours] [--max-hours 16]
import { existsSync } from 'node:fs';
import { readJson, parseArgs } from './lib/gh-graphql.mjs';

const args = parseArgs();
const maxHours = Number(args['max-hours'] ?? 16);
const ids = readJson('data/project-ids.json');
const snap = readJson('data/project-snapshot.json');
const errors = [];
const notes = [];
const fail = (msg) => errors.push(msg);

// 1. Cấu hình field
const expect = {
  Status: { dataType: 'SINGLE_SELECT', options: ['Todo', 'In Progress', 'Blocked', 'Done'] },
  Sprint: { dataType: 'ITERATION', iterations: ['Sprint 1', 'Sprint 2', 'Sprint 3'] },
  'Story Point': { dataType: 'NUMBER' },
  'Estimated time': { dataType: 'NUMBER' },
  Owner: { dataType: 'SINGLE_SELECT', options: ['PM', 'BrSE', 'BE-1', 'BE-2', 'FE-1', 'FE-2', 'QA-1', 'QA-Auto', 'Infra', 'Design'] },
  'Item type': { dataType: 'SINGLE_SELECT', options: ['Epic', 'User Story', 'Task'] },
};
for (const [name, spec] of Object.entries(expect)) {
  const f = ids.fields[name];
  if (!f) { fail(`thiếu field ${name}`); continue; }
  if (f.dataType !== spec.dataType) fail(`field ${name} là ${f.dataType}, cần ${spec.dataType}`);
  for (const o of spec.options || []) if (!f.options?.[o]) fail(`field ${name} thiếu option ${o}`);
  for (const it of spec.iterations || []) if (!f.iterations?.[it]) fail(`field ${name} thiếu iteration ${it}`);
}

// 2. Số item khớp backlog (khi đã có backlog)
const items = snap.items;
const byNumber = new Map(items.map((i) => [i.number, i]));
// Tổng một trường số (storyPoint / estimatedTime) trên các con trực tiếp; con thiếu giá trị tính 0
const sumChildren = (item, key) => item.subIssueNumbers.reduce((total, n) => total + (byNumber.get(n)?.[key] ?? 0), 0);
if (existsSync('data/backlog.json')) {
  const backlog = readJson('data/backlog.json');
  const list = Array.isArray(backlog) ? backlog : backlog.items;
  if (list.length !== items.length) fail(`backlog có ${list.length} item, Project có ${items.length}`);
}
if (items.some((i) => i.contentType !== 'Issue')) fail('Project có item không phải issue (draft/PR)');

// 3. Cây epic → issue → sub-issue
const ALLOWED_PARENT = { Epic: [], 'User Story': ['Epic'], Task: ['Epic', 'User Story'] };
for (const i of items) {
  const tag = `#${i.number}`;
  if (!i.itemType) fail(`${tag} chưa có Item type`);
  if (!i.owner) fail(`${tag} chưa có Owner`);
  if (i.parentNumber && !byNumber.has(i.parentNumber)) fail(`${tag} có cha #${i.parentNumber} không nằm trên Project`);
  for (const c of i.subIssueNumbers) if (!byNumber.has(c)) fail(`${tag} có con #${c} không nằm trên Project`);
  if (!i.itemType) continue; // đã báo ở trên, không báo trùng
  // Cấp hợp lệ: Epic (gốc) → User Story (cha Epic, có con) hoặc Task (cha Epic/User Story, là lá)
  const parentType = byNumber.get(i.parentNumber)?.itemType;
  if (i.itemType === 'Epic') {
    if (i.parentNumber) fail(`${tag} là Epic nhưng có cha #${i.parentNumber}`);
  } else if (!(ALLOWED_PARENT[i.itemType] || []).includes(parentType)) {
    fail(`${tag} (${i.itemType}) có cha ${i.parentNumber ? `#${i.parentNumber} (${parentType ?? '?'})` : 'trống'} — cần ${(ALLOWED_PARENT[i.itemType] || []).join(' hoặc ')}`);
  }
  if (i.itemType === 'Task' && i.subIssueNumbers.length) fail(`${tag} là Task nhưng có con — đổi thành User Story hoặc tách`);
  if (i.itemType !== 'Task' && i.subIssueNumbers.length === 0) fail(`${tag} (${i.itemType}) là container rỗng`);
}

// 4. Story Point: cha = Σ con; bắt buộc khi --require-points
const anyPoints = items.some((i) => i.storyPoint != null);
for (const i of items) {
  if (args['require-points'] && i.storyPoint == null) fail(`#${i.number} chưa có Story Point`);
  if (anyPoints && i.subIssueNumbers.length) {
    const childSum = sumChildren(i, 'storyPoint');
    if (i.storyPoint !== childSum) fail(`#${i.number} Story Point ${i.storyPoint} ≠ Σ con ${childSum}`);
  }
}

// 5. Giờ ước lượng: lá ≤ max-hours; cha = Σ con
const anyHours = items.some((i) => i.estimatedTime != null);
for (const i of items) {
  if (args['require-hours'] && i.estimatedTime == null) fail(`#${i.number} chưa có Estimated time`);
  if (!anyHours) continue;
  if (!i.subIssueNumbers.length && i.estimatedTime > maxHours) fail(`#${i.number} ${i.estimatedTime}h > ${maxHours}h`);
  if (i.subIssueNumbers.length) {
    const childSum = sumChildren(i, 'estimatedTime');
    if (Math.abs((i.estimatedTime ?? 0) - childSum) > 0.01) fail(`#${i.number} Estimated time ${i.estimatedTime} ≠ Σ con ${childSum}`);
  }
}

if (!items.length) notes.push('Project chưa có item — chỉ kiểm cấu hình field');
for (const n of notes) console.log(`· ${n}`);
for (const e of errors) console.log(`✗ ${e}`);
console.log(errors.length ? `FAIL: ${errors.length} lỗi / ${items.length} item` : `PASS: ${items.length} item, ${Object.keys(expect).length} field`);
process.exit(errors.length ? 1 : 0);
