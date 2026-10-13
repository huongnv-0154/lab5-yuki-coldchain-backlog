#!/usr/bin/env node
// Khai thác nguồn backlog từ gói LAB-4 (đọc tại chỗ, không chép) → data/sources.json.
// Nguồn: task L5-xxx của deviation-table, spec/module/tech "Chỉ thiết kế" + API/DB đích chưa dựng (bảng tra system-design),
// yêu cầu chưa đủ ở traceability, chức năng mock/ngoài phạm vi LAB-3, NFR + giao diện ngoài + môi trường + câu hỏi mở của kiến trúc đích, 14 ADR.
// Excerpt chỉ lấy cột tự viết và đã lọc trích RFP.
// Dừng (exit 1) nếu gói LAB-4 khác commit mốc (git diff), có tệp chưa được git theo dõi trong gói, hoặc không đọc được repo.
// Nếu có data/epic-overrides.json ({ "<id>": { "epic": "FG-xx", "why": "…" } }) thì áp lên epic sau cùng; mục AMBIGUOUS thành INFERRED.
// Dùng: node scripts/mine-sources.mjs [--lab34 <repo>] [--commit <sha>]
//   --lab34 mặc định ~/projects/lab34-yuki-coldchain-prototype · --commit mặc định c3cf20d (mốc PR-A-01)
// stdout: { total, byKind, ambiguous } — ambiguous = id chưa có epic (trừ việc dự án, không phải task, task gộp, ADR).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { writeJson, parseArgs } from './lib/gh-graphql.mjs';
import { readTables, excerpt } from './lib/markdown-table.mjs';
import { FEATURE_FG, ADR_EPIC, epicOfRequirement, isClientQuestion } from './lib/epic-map.mjs';
import { mineArchitecture } from './lib/architecture-sources.mjs';

const args = parseArgs();
const repo = args.lab34 || join(homedir(), 'projects/lab34-yuki-coldchain-prototype');
const commit = args.commit || 'c3cf20d';
const PKG = 'submission/lab4';
// Gói phải đúng bằng commit mốc (PR-A-01), nếu không số liệu sinh ra không truy được
try {
  execFileSync('git', ['-C', repo, 'diff', '--quiet', commit, '--', PKG], { stdio: 'ignore' });
  // Tệp chưa được git theo dõi trong gói cũng làm lệch mốc (vd một ADR lạ)
  if (execFileSync('git', ['-C', repo, 'ls-files', '--others', '--exclude-standard', '--', PKG], { encoding: 'utf8' }).trim()) throw new Error('untracked');
} catch {
  console.error(`Dừng: ${PKG} trong ${repo} khác commit mốc ${commit} (hoặc không đọc được repo) — số liệu sẽ không truy được`);
  process.exit(1);
}
const read = (rel) => readFileSync(join(repo, rel), 'utf8');
const lab4 = (rel) => `${PKG}/${rel}`;

const items = [];
const add = (it) => items.push({ confidence: 'EXTRACTED', epicBy: 'none', ...it });

// Chức năng LAB-1 (qua LAB-3 feature-list): F → FG, trạng thái prototype
const fRows = readTables(read('submission/lab3/feature-list.md'), ['F-ID', 'FG', 'Trạng thái prototype']);
const fgOfF = Object.fromEntries(fRows.map(({ row }) => [row['F-ID'], row.FG]));
const firstF = (text) => text.match(/F-\d{3}/)?.[0];

// Màn / module → thư mục feature (từ link của _index.md)
const indexRows = readTables(read(lab4('specs/_index.md')), ['ID', 'Hiện trạng', 'Feature', 'Link']);
const linkTarget = (row) => row.Link.match(/\(([^)]+)\)/)?.[1];
const featureOfName = {};
for (const { row } of indexRows) {
  const name = linkTarget(row)?.match(/([A-Z0-9_]+)_(SPEC|FUNC|TECH)\.md$/)?.[1];
  if (name) featureOfName[name] = row.Feature;
}

// Epic của một đoạn văn: mã F → FG; không có thì tên màn/module → feature → FG
function inferEpic(text) {
  const f = firstF(text);
  if (f && fgOfF[f]) return { epic: fgOfF[f], epicBy: `F:${f}` };
  for (const name of text.match(/[A-Z][A-Z0-9]+(?:_[A-Z0-9]+)+/g) || []) {
    const feature = featureOfName[name.replace(/_(SPEC|FUNC|TECH)$/, '')];
    const fg = FEATURE_FG[feature];
    if (fg) return { epic: fg, epicBy: `feature:${feature}` };
  }
  return { epic: null, epicBy: 'none' };
}

// Epic của một tài liệu chỉ thiết kế: mã F trong tên > thư mục feature > mã F đầu tiên trong thân
function epicOfDesignDoc(title, feature, body) {
  const fTitle = firstF(title);
  if (fTitle && fgOfF[fTitle]) return { function: fTitle, epic: fgOfF[fTitle], epicBy: `F:${fTitle}`, confidence: 'INFERRED' };
  if (FEATURE_FG[feature]) return { function: firstF(body) ?? null, epic: FEATURE_FG[feature], epicBy: `feature:${feature}`, confidence: 'INFERRED' };
  const fBody = firstF(body);
  if (fBody && fgOfF[fBody]) return { function: fBody, epic: fgOfF[fBody], epicBy: `F:${fBody} (thân)`, confidence: 'INFERRED' };
  return { function: null, epic: null, epicBy: 'none', confidence: 'AMBIGUOUS' };
}

// 1. Task L5 + dòng chênh lệch gốc
const devFile = lab4('specs/_common/deviation-table.md');
const dev = read(devFile);
const originById = Object.fromEntries(
  readTables(dev, ['ID', 'Loại', 'Hướng xử lý', 'Task LAB-5']).map(({ row }) => [row.ID, row]),
);
for (const { line, row } of readTables(dev, ['Task', 'Từ dòng', 'Việc', 'Mức'])) {
  const origin = originById[row['Từ dòng']];
  const context = [row['Việc'], origin?.['Thiết kế (LAB-1 / RFP, trang)'], origin?.['Code (path:line)'], origin?.['Hướng xử lý']].join(' ');
  const mergedInto = row['Việc'].match(/Gộp vào (L5-\d{3})/)?.[1] ?? null;
  const notATask = /Không phải task/i.test(row['Việc']);
  const clientQ = isClientQuestion(row['Việc']);
  const { epic, epicBy } = clientQ ? { epic: 'E-15', epicBy: 'client-question' } : inferEpic(context);
  let confidence = 'AMBIGUOUS';
  if (epic) confidence = clientQ || epicBy.startsWith('F:') ? 'EXTRACTED' : 'INFERRED';
  add({
    id: row.Task, kind: 'l5', from: row['Từ dòng'], level: row['Mức'], gapType: origin?.['Loại'] ?? null,
    excerpt: excerpt(row['Việc']), file: devFile, anchor: `L${line}`, mergedInto, notATask,
    epic, epicBy, confidence,
  });
}

// 2. Spec / module / tech "Chỉ thiết kế"
const designOnlyRows = indexRows.filter(({ row }) => /Chỉ thiết kế/.test(row['Hiện trạng']));
for (const { line, row } of designOnlyRows) {
  const file = linkTarget(row);
  const specPath = file ? lab4(`specs/${file}`) : null;
  const body = specPath ? read(specPath) : '';
  add({
    id: row.ID, kind: `design-only-${row['Loại'].toLowerCase()}`, excerpt: excerpt(row['Tên tài liệu']),
    file: specPath ?? lab4('specs/_index.md'), anchor: specPath ? '' : `L${line}`, feature: row.Feature,
    ...epicOfDesignDoc(row['Tên tài liệu'], row.Feature, body),
  });
}

// 2b. API / DB đích chưa dựng ("Đích (chỉ thiết kế)" ở hai bảng tra system-design)
for (const kind of ['api', 'database']) {
  const indexFile = lab4(`specs/system-design/${kind}-design/_index.md`);
  for (const { line, row } of readTables(read(indexFile), ['ID', 'Tên tài liệu', 'Feature', 'Link']).filter(({ row }) => /^Đích/.test(row['Tên tài liệu']))) {
    const file = linkTarget(row);
    const specPath = file ? lab4(`specs/system-design/${kind}-design/${file}`) : null;
    const feature = FEATURE_FG[row.Feature] !== undefined ? row.Feature : file?.split('/')[0];
    add({
      id: row.ID, kind: `design-only-${kind === 'api' ? 'api' : 'db'}`, excerpt: excerpt(row['Tên tài liệu'].replace(/^Đích \(chỉ thiết kế\) — /, '')),
      file: specPath ?? indexFile, anchor: specPath ? '' : `L${line}`, feature: feature ?? null,
      ...epicOfDesignDoc(row['Tên tài liệu'], feature, specPath ? read(specPath) : ''),
    });
  }
}

// 3. Yêu cầu RFP chưa đủ (không chép nhãn yêu cầu — chỉ mã)
const traceFile = lab4('specs/_common/traceability.md');
for (const { line, row } of readTables(read(traceFile), ['ID', 'Đáp ứng', 'Hiện trạng prototype'])) {
  const status = row['Hiện trạng prototype'];
  if (/^Đã có/.test(status)) continue;
  const epic = epicOfRequirement(row.ID);
  add({
    id: row.ID, kind: 'requirement', status, response: row['Đáp ứng'], file: traceFile, anchor: `L${line}`,
    excerpt: excerpt([row['Màn (SPEC)'], row['FUNC / TECH'], row['Ghi chú']].filter((x) => x && x !== '—').join(' · ')),
    epic: epic === 'PJ' ? null : epic, project: epic === 'PJ', epicBy: 'req-prefix', confidence: 'INFERRED',
  });
}

// 4. Chức năng chưa làm / mock ở prototype
const unbuiltRows = fRows.filter(({ row }) => !/^Đã làm/.test(row['Trạng thái prototype']));
for (const { line, row } of unbuiltRows) {
  add({
    id: row['F-ID'], kind: 'function', status: excerpt(row['Trạng thái prototype'], 40),
    excerpt: excerpt(`${row['Chức năng (LAB-1)']} — ${row['Màn (Screen ID)']}`),
    file: 'submission/lab3/feature-list.md', anchor: `L${line}`, epic: row.FG, epicBy: 'feature-list',
  });
}

// 5. Kiến trúc đích: môi trường, NFR, giao diện ngoài, câu hỏi mở (id có tiền tố để không trùng mã yêu cầu ở mục 3)
const archFile = lab4('architecture/target-architecture.md');
for (const it of mineArchitecture(read(archFile), archFile)) add(it);

// 6. ADR
const adrDir = lab4('architecture/adr');
for (const name of readdirSync(join(repo, adrDir)).filter((n) => /^ADR-\d{4}/.test(n)).sort()) {
  const id = name.slice(0, 8);
  const title = read(`${adrDir}/${name}`).match(/^# (.+)$/m)?.[1] || name;
  add({ id, kind: 'adr', excerpt: excerpt(title), file: `${adrDir}/${name}`, anchor: '', epic: ADR_EPIC[id] ?? null, epicBy: 'adr-map', confidence: 'INFERRED' });
}

// Ánh xạ epic do người/agent duyệt (data/epic-overrides.json: { "<id>": { "epic": "FG-xx", "why": "…" } })
const OVERRIDES = 'data/epic-overrides.json';
if (existsSync(OVERRIDES)) {
  const overrides = JSON.parse(readFileSync(OVERRIDES, 'utf8'));
  for (const it of items) {
    const override = overrides[it.id];
    if (!override) continue;
    Object.assign(it, {
      epic: override.epic,
      epicBy: `override: ${override.why}`,
      confidence: it.confidence === 'AMBIGUOUS' ? 'INFERRED' : it.confidence,
    });
  }
}

// Đếm số mục theo một trường; thiếu giá trị gom vào nhóm '∅'
function countBy(key) {
  const counts = {};
  for (const it of items) {
    const group = it[key] ?? '∅';
    counts[group] = (counts[group] || 0) + 1;
  }
  return counts;
}

const byKind = countBy('kind');
writeJson('data/sources.json', {
  generatedFrom: { lab34Commit: commit, package: PKG, script: 'scripts/mine-sources.mjs' },
  counts: { total: items.length, byKind, byEpic: countBy('epic'), byConfidence: countBy('confidence') },
  items,
});

const ambiguousIds = items
  .filter((it) => !it.epic && !it.project && !it.notATask && !it.mergedInto && it.kind !== 'adr')
  .map((it) => it.id);
console.log(JSON.stringify({ total: items.length, byKind, ambiguous: ambiguousIds }));
