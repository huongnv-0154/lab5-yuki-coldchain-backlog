#!/usr/bin/env node
// Cổng G2 phần backlog (trước khi tạo issue): đối chiếu data/backlog.json với data/sources.json và luật chia
// (task-breakdown §1); đọc thêm blockingQuestionsAllowed trong data/backlog-adjustments.json. Không gọi mạng.
// Kiểm: cấu trúc cha – con, ≥ 2 DoD, owner, nhãn, blockedBy / affects / questions trỏ id có thật (câu hỏi E-15 chỉ chặn
// issue có trong blockingQuestionsAllowed), độ phủ nguồn (nguồn có epic phải thành issue hoặc có lý do trong notIssued),
// không câu 「」 dài > 20 ký tự. Luật tham chiếu trong chữ: id viết ở title / body (FGnn-nn, E13-nn, E14-nn, E15-…)
// phải là item có thật — bắt id đã gộp / đã bỏ.
// In "✗" cho mỗi lỗi (exit 1 nếu có lỗi) và "!" cho cảnh báo không làm fail (tiêu đề > 90 ký tự).
// Dùng: node scripts/check-backlog.mjs [--max-items 450]   (trần số item, mặc định 450 theo DR-04; vượt thì lỗi)
import { readJson, parseArgs } from './lib/gh-graphql.mjs';

const args = parseArgs();
const maxItems = Number(args['max-items'] ?? 450); // trần theo DR-04 (plan gốc 250)
const { items, notIssued } = readJson('data/backlog.json');
const sources = readJson('data/sources.json').items;
const blockingAllowed = readJson('data/backlog-adjustments.json').blockingQuestionsAllowed;
const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);

const EPICS = [...Array.from({ length: 12 }, (_, i) => `FG-${String(i + 1).padStart(2, '0')}`), 'E-13', 'E-14', 'E-15'];
const epicLabel = (epic) => `epic:E-${epic.slice(-2)}`;
const TEAM_OF = { 'BE-1': 'BE', 'BE-2': 'BE', 'FE-1': 'FE', 'FE-2': 'FE', 'QA-1': 'QA', 'QA-Auto': 'QA', Infra: 'Infra', PM: 'PM', BrSE: 'BrSE', Design: 'Design' };
const TYPE_OF = { epic: 'type:epic', story: 'type:story', task: 'type:task' };
const teamLabel = (team) => `team:${team}`;
const ALLOWED = new Set([
  ...Object.values(TYPE_OF),
  ...[...new Set(Object.values(TEAM_OF))].map(teamLabel),
  ...EPICS.map(epicLabel),
  'constraint:driver-hours-2024', 'src:l5', 'src:design-only', 'src:integration', 'src:hardening', 'src:clarify',
  'graded:br-temp-02', 'graded:br-date-01',
]);
const isQuestion = (id) => /^E15-/.test(id);
const DRIVER_HOURS = /^(FR-SCH-0[234]|L5-021|L5-066|MOCK-09|DEV-014|L5-007)$/;

// 1. Cấu trúc từng item
const byId = new Map();
for (const it of items) {
  if (byId.has(it.id)) fail(`${it.id} trùng id`);
  byId.set(it.id, it);
}
const children = new Map();
for (const it of items) if (it.parentId) children.set(it.parentId, [...(children.get(it.parentId) || []), it.id]);

for (const it of items) {
  const tag = it.id;
  const body = it.body || {};
  if (!EPICS.includes(it.epicId)) fail(`${tag} epicId lạ: ${it.epicId}`);
  if (!TYPE_OF[it.kind]) fail(`${tag} kind lạ: ${it.kind}`);
  const hasValidParent = it.kind === 'epic' ? !it.parentId : byId.has(it.parentId);
  if (!hasValidParent) fail(`${tag} parentId không hợp lệ: ${it.parentId}`);
  const parent = byId.get(it.parentId);
  if (it.kind === 'story' && parent?.kind !== 'epic') fail(`${tag} là story nhưng cha là ${parent?.kind}`);
  if (it.kind === 'task' && parent?.kind === 'task') fail(`${tag} là task dưới task ${parent.id}`);
  if (parent && parent.epicId !== it.epicId) fail(`${tag} khác epic với cha ${parent.id}`);
  const kids = children.get(it.id) || [];
  if (it.kind !== 'task' && kids.length === 0) fail(`${tag} (${it.kind}) là container rỗng`);
  if (it.kind === 'task' && kids.length) fail(`${tag} là task nhưng có con`);
  const dodCount = (body.dod || []).length;
  if (dodCount < 2) fail(`${tag} có ${dodCount} DoD (cần ≥ 2)`);
  if (!TEAM_OF[it.owner]) fail(`${tag} owner lạ: ${it.owner}`);
  for (const l of it.labels) if (!ALLOWED.has(l)) fail(`${tag} nhãn lạ: ${l}`);
  if (!it.labels.includes(TYPE_OF[it.kind])) fail(`${tag} thiếu nhãn ${TYPE_OF[it.kind]}`);
  if (!it.labels.includes(epicLabel(it.epicId))) fail(`${tag} thiếu nhãn ${epicLabel(it.epicId)}`);
  if (it.kind !== 'epic' && !it.labels.includes(teamLabel(TEAM_OF[it.owner]))) fail(`${tag} nhãn team không khớp owner ${it.owner}`);
  if ((body.sources || []).some((s) => DRIVER_HOURS.test(s.id)) && !it.labels.includes('constraint:driver-hours-2024')) fail(`${tag} chạm giờ lái 2024 nhưng thiếu nhãn constraint`);
  // Tham chiếu: id có thật; câu hỏi E-15 chỉ được chặn issue có trong danh sách DR-04 (PR-D-04)
  for (const ref of [...(body.blockedBy || []), ...(body.affects || []), ...(body.questions || [])]) {
    if (!byId.has(ref)) fail(`${tag} tham chiếu id không có: ${ref}`);
  }
  for (const ref of body.blockedBy || []) if (isQuestion(ref) && !blockingAllowed[tag]) fail(`${tag} bị câu hỏi ${ref} chặn nhưng không có trong blockingQuestionsAllowed`);
  for (const ref of body.questions || []) if (!isQuestion(ref)) fail(`${tag} questions chứa ${ref} không phải câu hỏi E-15`);
  // id viết trong chữ (vd "FG10-04", "E15-FG11-01") phải trỏ tới item có thật — bắt id đã gộp / đã bỏ
  for (const ref of `${it.title} ${JSON.stringify(it.body || {})}`.match(/\b(?:FG\d{2}-\d{2}(?:\.\d+)?|E1[34]-\d{2}(?:\.\d+)?|E15-(?:FG\d{2}-)?\d{2})\b/g) || []) {
    if (!byId.has(ref)) fail(`${tag} nhắc tới ${ref} trong nội dung nhưng không có item này`);
  }
  if (it.title.length > 90) warnings.push(`${tag} tiêu đề ${it.title.length} ký tự (> 90)`);
  // Repo public: không câu tiếng Nhật dài trong 「」 (dấu hiệu chép RFP)
  if (/「[^」]{21,}」/.test(JSON.stringify(it))) fail(`${tag} có câu trong 「」 dài > 20 ký tự`);
}

// 2. Độ phủ nguồn: mọi nguồn có epic → nằm trong sources của item hoặc notIssued có lý do
const covered = new Set(items.flatMap((it) => (it.body?.sources || []).map((s) => s.id)));
const skipped = new Map(notIssued.map((x) => [x.id, x.reason]));
for (const s of sources) {
  if (!s.epic) continue; // gộp / việc dự án / quy ước ADR — có lý do sẵn trong sources.json
  if (covered.has(s.id)) continue;
  if (skipped.get(s.id)?.trim()) continue;
  fail(`nguồn ${s.id} (${s.kind}, ${s.epic}) chưa thành issue và không có lý do`);
}
for (const s of sources.filter((x) => x.kind === 'l5' && !x.mergedInto && !x.notATask)) {
  if (!covered.has(s.id)) fail(`${s.id} không có issue nào (L5 phải thành issue)`);
}
for (const s of sources.filter((x) => x.kind === 'design-only-spec' || (x.kind === 'function' && /^Ngoài phạm vi/.test(x.status)))) {
  if (!covered.has(s.id)) fail(`${s.id} (${s.kind}) chưa có issue`);
}
for (const id of skipped.keys()) if (!sources.some((s) => s.id === id)) fail(`notIssued có id lạ: ${id}`);

if (items.length > maxItems) fail(`${items.length} item > trần ${maxItems}`);
for (const w of warnings) console.log(`! ${w}`);
for (const e of errors) console.log(`✗ ${e}`);
console.log(errors.length ? `FAIL: ${errors.length} lỗi / ${items.length} item` : `PASS: ${items.length} item, ${covered.size} nguồn đã thành issue, ${skipped.size} nguồn có lý do không thành issue`);
process.exit(errors.length ? 1 : 0);
