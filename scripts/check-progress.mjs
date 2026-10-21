#!/usr/bin/env node
// Cổng G4 cho progress-report.md, chỉ đọc file (chạy snapshot-project.mjs trước):
//   1. Project = kết quả giả lập: Sprint của mọi issue đã xếp, Status cuối của issue Sprint 1, issue Done đã đóng và ngược lại;
//   2. bảng §1 trùng bản render lại từ snapshot;
//   3. burndown ngày cuối = Σ SWP issue Sprint 1 chưa Done trên snapshot;
//   4. bảng rủi ro §3 có 1–6 dòng, 5 cột; mỗi dòng có issue #số có thật thuộc Sprint 1 hoặc Sprint 2, mốc nằm trong lịch LAB-1
//      (data/sprint-config.json milestones), có hành động, cột cuối có ngày và mỗi mệnh đề (ngăn bằng ;) mở đầu bằng một vai (Owner);
//      số "x,y MD" và ngày ở cột Rủi ro / Ảnh hưởng phải có trong data/milestone-projection.json (số gõ tay không lệch dự báo);
//   5. 6 dòng đầu file có tên Iteration và khoảng thời gian; ảnh burndown §2 tồn tại.
// Dùng: node scripts/check-progress.mjs   (exit 1 nếu có lỗi)
import { existsSync, readFileSync } from 'node:fs';
import { readJson } from './lib/gh-graphql.mjs';
import { progressRenderers } from './lib/progress-renderers.mjs';

const FILE = 'progress-report.md';
const text = readFileSync(FILE, 'utf8');
const snapshot = readJson('data/project-snapshot.json');
const byNumber = new Map(snapshot.items.map((i) => [i.number, i]));
const { final } = readJson('data/sprint-1-log.json');
const sprintMap = readJson('data/sprint-1-field-sprint.json');
const burndown = readJson('data/sprint-1-burndown.json');
const { milestones } = readJson('data/sprint-config.json');
const ROLE = /\b(PM|BrSE|BE-\d|FE-\d|QA-1|QA-Auto|Infra|Design)\b/;
const errors = [];

// 1. Project khớp kết quả giả lập
for (const [n, sprint] of Object.entries(sprintMap)) {
  const projectSprint = byNumber.get(Number(n))?.sprint;
  if (projectSprint !== sprint) errors.push(`#${n} Sprint ${projectSprint ?? '∅'} ≠ ${sprint}`);
}
for (const [n, f] of Object.entries(final)) {
  const it = byNumber.get(Number(n));
  if (it.status !== f.status) errors.push(`#${n} Status ${it.status} ≠ giả lập ${f.status}`);
  if ((it.state === 'CLOSED') !== (f.status === 'Done')) errors.push(`#${n} state ${it.state} nhưng Status giả lập ${f.status}`);
}

// 2. Bảng §1 = render lại từ snapshot
const block = text.match(/<!-- GENERATED:status-summary sprint=Sprint_1 -->\n([\s\S]*?)\n<!-- \/GENERATED -->/)?.[1];
const fresh = progressRenderers['status-summary']({ snapshot, options: { sprint: 'Sprint 1' } });
if (block !== fresh) errors.push('bảng §1 lệch snapshot — chạy render-tables.mjs');

// 3. Burndown ngày cuối = SWP Sprint 1 chưa Done
const open = snapshot.items.filter((i) => i.sprint === 'Sprint 1' && !i.subIssueNumbers.length && i.status !== 'Done');
const openSWP = open.reduce((t, i) => t + (i.storyPoint ?? 0), 0);
if (burndown.at(-1).actual !== openSWP) errors.push(`burndown ngày cuối ${burndown.at(-1).actual} ≠ SWP Sprint 1 chưa Done trên Project ${openSWP}`);

// 4. Bảng rủi ro §3
// §3 tới mục ## kế tiếp hoặc hết file
const section = (text.split(/^## 3\. /m)[1] ?? '').split(/^## /m)[0];
const rows = section.split('\n').filter((l) => l.startsWith('|') && !/^\|\s*(Rủi ro|---)/.test(l));
if (!rows.length || rows.length > 6) errors.push(`bảng rủi ro có ${rows.length} dòng, cần 1–6`);
// Mọi số (|x| một chữ số thập phân, dấu phẩy) và ngày trong dự báo M-03
const projected = new Set();
(function collect(v) {
  if (typeof v === 'number') projected.add(Math.abs(v).toFixed(1).replace('.', ','));
  else if (typeof v === 'string') for (const [d] of v.matchAll(/\d{4}-\d{2}-\d{2}/g)) projected.add(d); // gồm 'sau <ngày>'
  else if (v && typeof v === 'object') Object.values(v).forEach(collect);
})(readJson('data/milestone-projection.json').runs); // chỉ kết quả dự báo — không lấy ngày lễ / khung thời gian
for (const [k, row] of rows.entries()) {
  const cells = row.split('|').slice(1, -1).map((c) => c.trim());
  for (const c of [cells[0], cells[2]]) {
    for (const [, md] of (c ?? '').matchAll(/(\d+,\d) MD/g)) if (!projected.has(md)) errors.push(`rủi ro ${k + 1}: ${md} MD không có trong dự báo M-03`);
    for (const [d] of (c ?? '').matchAll(/\d{4}-\d{2}-\d{2}/g)) if (!projected.has(d)) errors.push(`rủi ro ${k + 1}: ngày ${d} không có trong dự báo M-03`);
  }
  const numbers = [...(cells[1] ?? '').matchAll(/#(\d+)/g)].map((m) => Number(m[1]));
  if (cells.length !== 5) errors.push(`rủi ro ${k + 1}: ${cells.length} cột, cần 5`);
  if (!numbers.length) errors.push(`rủi ro ${k + 1}: cột Issue không có #số`);
  for (const n of numbers) {
    const sprint = byNumber.get(n)?.sprint;
    if (!byNumber.has(n)) errors.push(`rủi ro ${k + 1}: #${n} không có trên Project`);
    else if (!['Sprint 1', 'Sprint 2'].includes(sprint)) errors.push(`rủi ro ${k + 1}: #${n} không thuộc Sprint 1/2 (${sprint ?? 'chưa xếp'})`);
  }
  const marks = (cells[2] ?? '').match(/M-\d{2}/g) ?? [];
  if (!marks.length) errors.push(`rủi ro ${k + 1}: không nêu mốc M-xx`);
  for (const m of marks) if (!milestones[m]) errors.push(`rủi ro ${k + 1}: mốc ${m} không có trong lịch LAB-1`);
  if (!cells[3]) errors.push(`rủi ro ${k + 1}: thiếu hành động`);
  if (!/\d{4}-\d{2}-\d{2}/.test(cells[4] ?? '')) errors.push(`rủi ro ${k + 1}: cột Ai làm, khi nào thiếu ngày`);
  // Mỗi mệnh đề (ngăn bằng ;) phải mở đầu bằng vai — chứng minh ai làm việc nào, không chỉ có nhắc tên vai
  const clauses = (cells[4] ?? '').split(';').map((c) => c.trim()).filter(Boolean);
  if (!clauses.length || !clauses.every((c) => new RegExp(`^${ROLE.source}`).test(c))) errors.push(`rủi ro ${k + 1}: cột Ai làm, khi nào có mệnh đề không mở đầu bằng vai`);
}

// 5. Đầu file + ảnh
const head = text.split('\n').slice(0, 6).join('\n');
if (!/Iteration: \*\*Sprint 1\*\*/.test(head) || !/2026-11-30 → 2026-12-11/.test(head)) errors.push('đầu file thiếu tên Iteration hoặc khoảng thời gian');
const image = text.match(/!\[[^\]]*\]\(([^)]+)\)/)?.[1];
if (!image || !existsSync(image)) errors.push(`ảnh burndown ${image ?? '(không có)'} không tồn tại`);

for (const e of errors) console.log(`✗ ${e}`);
console.log(errors.length ? `FAIL: ${errors.length} lỗi` : `PASS: ${Object.keys(sprintMap).length} issue xếp sprint, ${Object.keys(final).length} issue Sprint 1, burndown cuối ${openSWP} SWP, ${rows.length} rủi ro`);
process.exit(errors.length ? 1 : 0);
