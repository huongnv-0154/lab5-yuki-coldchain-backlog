#!/usr/bin/env node
// Gộp 15 epic (data/backlog-epics.json) và phần backlog của từng job (data/backlog-parts/J*.json: items, notIssued, gaps),
// áp quyết định DR-04 (data/backlog-adjustments.json), rồi ghi:
//   data/backlog.json — items + notIssued (nguồn duy nhất để tạo issue)
//   data/gaps.json    — chỗ hở phát hiện khi break, mã GAP-L5-nn (đánh số theo thứ tự job, rồi thứ tự trong job), kèm cách xử lý
// Đọc thêm data/sources.json (đổi mã dòng bảng chênh lệch DEV-/MOCK-/GAP-xx → task L5) và backlog.json cũ (giữ liên kết GitHub).
// Khoá của backlog-adjustments.json, theo thứ tự áp:
//   addItems, addBlockedBy   — thêm item / liên kết bị bỏ sót (addBlockedBy: id không có → dừng)
//   removeItems, mergeItems  — bỏ item; gộp item trùng vào item giữ lại (cộng sources / affects / specRefs, bỏ item gộp cùng con của nó)
//   refAliases               — chữ trong blockedBy / affects → id issue, khi không phải mã nguồn
//   blockingQuestionsAllowed — issue được phép bị câu hỏi E-15 chặn (áp cùng bước chuẩn hoá tham chiếu, xem dưới)
//   addLabels, removeLabels  — thêm nhãn theo id ({label, ids}); gỡ nhãn theo epic / id ({label, epics, ids})
//   patches                  — ghi đè trường theo đường dẫn "a.b.c" (id không có → dừng)
//   dropGaps, gapHandling    — bỏ mục không phải chỗ hở spec; mọi gap giữ lại phải có gapHandling, thiếu thì dừng
// Tham chiếu blockedBy / affects ghi bằng mã nguồn hay chữ được đổi sang id issue; không đổi được thì chuyển vào body.notes.
// blockedBy trỏ tới câu hỏi E-15 không chặn (PR-D-04) → chuyển sang body.questions, trừ issue có trong blockingQuestionsAllowed.
// Giữ number/nodeId/itemId (và bodySha/fieldsSet/blockedByLinked) của backlog.json cũ (sau khi tạo issue) để chạy lại không mất liên kết.
// Dùng: node scripts/merge-backlog.mjs   (không có cờ; in một dòng JSON gồm total, byKind, notIssued, gaps)
import { existsSync, readdirSync } from 'node:fs';
import { readJson, writeJson } from './lib/gh-graphql.mjs';

const adj = readJson('data/backlog-adjustments.json');
const PARTS = 'data/backlog-parts';
const jobNumber = (name) => parseInt(name.slice(1), 10);
const parts = readdirSync(PARTS).filter((n) => /^J\d+\.json$/.test(n)).sort((a, b) => jobNumber(a) - jobNumber(b));
if (!parts.length) throw new Error(`chưa có ${PARTS}/J*.json`);
const jobs = parts.map((n) => readJson(`${PARTS}/${n}`));

let items = [...readJson('data/backlog-epics.json'), ...jobs.flatMap((j) => j.items)];
const notIssued = jobs.flatMap((j) => j.notIssued.map((x) => ({ ...x, job: j.job })));
// items đổi liên tục ở bước 1 nên luôn tra trên danh sách hiện tại
const findItem = (id) => items.find((i) => i.id === id);
const dedupeByJson = (list) => list.filter((v, i) => list.findIndex((x) => JSON.stringify(x) === JSON.stringify(v)) === i);

// 0. Item và liên kết thêm theo DR-04 (việc bị bỏ sót phát hiện khi gộp)
items.push(...(adj.addItems || []));
for (const [id, refs] of Object.entries(adj.addBlockedBy || {})) {
  const it = findItem(id);
  if (!it) throw new Error(`addBlockedBy cho ${id}: không có item`);
  it.body.blockedBy = [...new Set([...(it.body.blockedBy || []), ...refs])];
}

// 1. Gộp item trùng (câu hỏi E-15 trùng, việc index lô trùng) vào item giữ lại
items = items.filter((it) => !adj.removeItems[it.id]);
for (const [from, to] of Object.entries(adj.mergeItems)) {
  const src = findItem(from);
  const dst = findItem(to);
  if (!src || !dst) throw new Error(`mergeItems ${from} → ${to}: thiếu item`);
  for (const key of ['sources', 'affects', 'specRefs']) {
    dst.body[key] = dedupeByJson([...(dst.body[key] || []), ...(src.body[key] || [])]);
  }
  items = items.filter((it) => it.id !== from && it.parentId !== from);
}
const redirect = (id) => adj.mergeItems[id] ?? id;

// 2. Mã nguồn → id issue: ưu tiên issue code (không phải E-15), rồi issue cha hơn sub
const isQuestion = (id) => /^E15-/.test(id);
const rank = (id) => (isQuestion(id) ? 2 : 0) + (id.includes('.') ? 1 : 0);
// Mã dòng bảng chênh lệch (DEV-/MOCK-/GAP-xx) → task L5 sinh ra từ dòng đó
const l5OfRow = new Map(readJson('data/sources.json').items.filter((s) => s.kind === 'l5').map((s) => [s.from, s.mergedInto ?? s.id]));
const bySource = new Map();
for (const it of items) {
  for (const s of it.body?.sources || []) {
    const cur = bySource.get(s.id);
    if (!cur || rank(it.id) < rank(cur)) bySource.set(s.id, it.id);
  }
}

// 3. Chuẩn hoá tham chiếu: "FG08-04 (ghi chú)" → FG08-04; mã nguồn / dòng chênh lệch → issue; chữ → alias E-13/E-14; không tìm được → notes
const ids = new Set(items.map((i) => i.id));
function resolveRef(raw) {
  const text = String(raw).trim();
  const token = text.split(/[\s(]/)[0];
  const head = redirect(l5OfRow.get(token) ?? token);
  if (ids.has(head)) return head;
  if (bySource.has(head)) return bySource.get(head);
  const alias = adj.refAliases.find(([key]) => text.includes(key));
  if (alias) return alias[1];
  return null;
}
for (const it of items) {
  const body = it.body || {};
  const blocked = [];
  const questions = [];
  const notes = [...(body.notes || [])];
  for (const raw of body.blockedBy || []) {
    const id = resolveRef(raw);
    if (!id || id === it.id) { notes.push(`Phụ thuộc: ${raw}`); continue; }
    if (isQuestion(id) && !adj.blockingQuestionsAllowed[it.id]) questions.push(id);
    else blocked.push(id);
  }
  const affects = [];
  for (const raw of body.affects || []) {
    const id = resolveRef(raw);
    if (id && id !== it.id) affects.push(id); else notes.push(`Ảnh hưởng: ${raw}`);
  }
  Object.assign(body, { blockedBy: [...new Set(blocked)], questions: [...new Set([...(body.questions || []), ...questions])], affects: [...new Set(affects)], notes });
  for (const key of ['blockedBy', 'questions', 'affects', 'notes']) if (!body[key].length) delete body[key];
}

// 4. Nhãn và sửa nội dung theo DR-04
for (const rule of adj.addLabels || []) {
  for (const it of items) if (rule.ids.includes(it.id) && !it.labels.includes(rule.label)) it.labels.push(rule.label);
}
for (const rule of adj.removeLabels) {
  for (const it of items) if (rule.epics.includes(it.epicId) || rule.ids.includes(it.id)) it.labels = it.labels.filter((l) => l !== rule.label);
}
function setByPath(target, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  keys.reduce((obj, key) => obj[key], target)[lastKey] = value;
}
for (const [id, patch] of Object.entries(adj.patches)) {
  const it = findItem(id);
  if (!it) throw new Error(`patch cho ${id}: không có item`);
  for (const [path, value] of Object.entries(patch)) setByPath(it, path, value);
}

// 5. Liên kết GitHub của lần tạo issue trước
const previous = existsSync('data/backlog.json') ? new Map(readJson('data/backlog.json').items.map((i) => [i.id, i])) : new Map();
for (const it of items) {
  const old = previous.get(it.id);
  Object.assign(it, { number: old?.number ?? null, nodeId: old?.nodeId ?? null, itemId: old?.itemId ?? null });
  for (const key of ['bodySha', 'fieldsSet', 'blockedByLinked']) if (old?.[key] !== undefined) it[key] = old[key];
}

// 6. Chỗ hở: bỏ mục không phải chỗ hở spec, gắn cách xử lý; ref trống → issue lấy gap làm nguồn
const gaps = jobs.flatMap((j) => j.gaps.map((g) => ({ ...g, job: j.job })))
  .map((g, i) => ({ id: `GAP-L5-${String(i + 1).padStart(2, '0')}`, ...g }))
  .filter((g) => !adj.dropGaps[g.id])
  .map((g) => {
    const h = adj.gapHandling[g.id];
    if (!h) throw new Error(`${g.id} chưa có cách xử lý trong backlog-adjustments.json`);
    const issued = items.filter((it) => (it.body?.sources || []).some((s) => s.id === g.id)).map((it) => it.id);
    const ref = h.ref ? redirect(h.ref) : issued.join(', ') || null;
    return { ...g, handling: h.handling, premise: h.premise ?? null, ref, note: h.note ?? null };
  });

function countBy(key) {
  const counts = {};
  for (const it of items) counts[it[key]] = (counts[it[key]] || 0) + 1;
  return counts;
}
const byKind = countBy('kind');
writeJson('data/backlog.json', {
  generatedFrom: { epics: 'data/backlog-epics.json', jobs: parts, adjustments: 'data/backlog-adjustments.json', sources: 'data/sources.json' },
  counts: { total: items.length, byKind, byEpic: countBy('epicId'), notIssued: notIssued.length },
  items,
  notIssued,
});
writeJson('data/gaps.json', { count: gaps.length, dropped: adj.dropGaps, gaps });
console.log(JSON.stringify({ total: items.length, byKind, notIssued: notIssued.length, gaps: gaps.length }));
