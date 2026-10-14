#!/usr/bin/env node
// Đọc payload kiểm toán nhúng trong báo cáo HTML của skill chấm SWP → data/swp-scores.final.json.
// Lá: điểm đã chốt sau hiệu chỉnh (finalSWP); container: tổng con do skill cộng (script cộng lại để kiểm).
// --check: so payload HTML với data/swp-scores.final.json và field Story Point trong data/project-snapshot.json
//   (chạy snapshot-project.mjs trước); không ghi; in từng chỗ lệch, exit 1 nếu có lệch.
// Dùng: node scripts/extract-swp.mjs swp-report/report.html [--check]
import { readFileSync } from 'node:fs';
import { readJson, writeJson, parseArgs } from './lib/gh-graphql.mjs';

const OUT = 'data/swp-scores.final.json';
const PAYLOAD_TAG = /<script id="report-data" type="application\/json">([\s\S]*?)<\/script>/;
const args = parseArgs();
const htmlPath = args._[0];
if (!htmlPath) {
  console.error('cần đường dẫn báo cáo HTML, vd: node scripts/extract-swp.mjs swp-report/report.html');
  process.exit(1);
}

const match = readFileSync(htmlPath, 'utf8').match(PAYLOAD_TAG);
if (!match) throw new Error(`${htmlPath}: không thấy payload nhúng (script#report-data)`);
const payload = JSON.parse(match[1]);
const numberOf = (ref) => Number(ref.split('#').pop());

// Thứ tự khoá ở lá và container giống nhau để file xuất ổn định
const leaves = payload.issues.map((i) => ({
  ref: i.issueRef, number: numberOf(i.issueRef), container: false,
  scope: i.finalScope, complexity: i.finalComplexity,
  initialScope: i.initialScope, initialComplexity: i.initialComplexity, initialSWP: i.initialSWP,
  finalSWP: i.finalSWP, confidence: i.confidence, children: [],
}));
const parents = payload.parents.map((p) => ({
  ref: p.issueRef, number: numberOf(p.issueRef), container: true,
  scope: null, complexity: null,
  initialScope: null, initialComplexity: null, initialSWP: p.initialSWP,
  finalSWP: p.finalSWP, confidence: null, children: p.childRefs.map(numberOf),
}));
const rows = [...leaves, ...parents].sort((a, b) => a.number - b.number);
const byNumber = new Map(rows.map((r) => [r.number, r]));

// Container = Σ con (đệ quy qua story); container chưa đủ con (needs-breakdown) thì skill để null → báo lỗi
const errors = [];
for (const r of parents) {
  if (r.finalSWP == null) { errors.push(`#${r.number} container chưa có SWP (needs-breakdown)`); continue; }
  const sum = r.children.reduce((t, n) => t + (byNumber.get(n)?.finalSWP ?? NaN), 0);
  if (sum !== r.finalSWP) errors.push(`#${r.number} SWP ${r.finalSWP} ≠ Σ con ${sum}`);
}

if (args.check) {
  // So cả file đã xuất lẫn field trên Project với payload HTML vừa đọc (không tin file trung gian)
  const want = new Map(rows.map((r) => [r.number, r.finalSWP]));
  const file = new Map(readJson(OUT).map((r) => [r.number, r.finalSWP]));
  const snap = readJson('data/project-snapshot.json').items;
  if (file.size !== rows.length) errors.push(`${OUT} có ${file.size} item, payload HTML có ${rows.length}`);
  if (snap.length !== rows.length) errors.push(`Project có ${snap.length} item, payload HTML có ${rows.length}`);
  for (const r of rows) if (file.get(r.number) !== r.finalSWP) errors.push(`#${r.number} ${OUT} ghi ${file.get(r.number) ?? '∅'} ≠ payload ${r.finalSWP}`);
  for (const it of snap) {
    if (!want.has(it.number)) errors.push(`#${it.number} có trên Project nhưng không có trong payload HTML`);
    else if (it.storyPoint !== want.get(it.number)) errors.push(`#${it.number} Story Point ${it.storyPoint ?? '∅'} ≠ payload ${want.get(it.number)}`);
  }
  for (const e of errors) console.log(`✗ ${e}`);
  console.log(errors.length ? `FAIL: ${errors.length} lỗi` : `PASS: ${snap.length} item, Story Point và ${OUT} khớp payload HTML`);
  process.exit(errors.length ? 1 : 0);
}

for (const e of errors) console.log(`✗ ${e}`);
if (errors.length) process.exit(1);
writeJson(OUT, rows);
const total = leaves.reduce((t, r) => t + r.finalSWP, 0);
console.log(`${OUT}: ${leaves.length} lá + ${parents.length} container, tổng SWP lá ${total}, calibration ${payload.run.calibrationStatus}`);
