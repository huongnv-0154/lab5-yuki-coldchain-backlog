#!/usr/bin/env node
// Đưa kết quả giả lập Sprint 1 (data/sprint-1-log.json, DR-07) lên GitHub.
// Ghi hai bản đồ cho set-field.mjs (trừ khi --dry-run): data/sprint-1-field-sprint.json (Sprint của mọi issue đã xếp, issue chuyển
// sprint lấy sprint cuối) và data/sprint-1-field-status.json (Status cuối của issue Sprint 1).
// --apply: mỗi cặp (issue, ngày) có sự kiện → một comment "Giả lập Sprint 1 · ngày N (ngày)" theo thứ tự ngày; gán issue
// từng In Progress cho tài khoản đang đăng nhập; đóng issue Done (COMPLETED). Chạy lại an toàn: ledger
// data/sprint-1-applied.json ghi sau mỗi lần ghi; comment mang dấu <!-- sim:sprint-1:<số>:<ngày> -->, ledger chưa có thì dò
// dấu trên issue trước khi gửi (mất ledger / lỗi mạng không sinh comment trùng). --dry-run: chỉ đọc, không ghi file nào.
// Dùng: node scripts/apply-sprint-log.mjs [--apply] [--dry-run] [--delay 1000]
import { existsSync } from 'node:fs';
import { graphql, readJson, writeJson, parseArgs } from './lib/gh-graphql.mjs';
import { createMutator } from './lib/github-mutation.mjs';

const args = parseArgs();
const dry = Boolean(args['dry-run']);
const delayMs = Number(args.delay ?? 1000);
if (!(delayMs >= 0)) throw new Error('--delay phải là số mili-giây ≥ 0');
const LEDGER = 'data/sprint-1-applied.json';
const { sprint, events, final } = readJson('data/sprint-1-log.json');
const nodeIdOf = new Map(readJson('data/backlog.json').items.map((i) => [i.number, i.nodeId]));

// 1. Bản đồ field
const sprintMap = readJson('data/sprint-field.json');
for (const [n, f] of Object.entries(final)) sprintMap[n] = f.sprint;
const statusMap = Object.fromEntries(Object.entries(final).map(([n, f]) => [n, f.status]));
if (!dry) {
  writeJson('data/sprint-1-field-sprint.json', sprintMap);
  writeJson('data/sprint-1-field-status.json', statusMap);
}
console.log(`bản đồ field: Sprint ${Object.keys(sprintMap).length} issue, Status ${Object.keys(statusMap).length} issue`);
if (!args.apply) process.exit(0);

// 2. Comment / assignee / đóng issue
const ledger = existsSync(LEDGER) ? readJson(LEDGER) : { comments: [], assigned: [], closed: [] };
const save = () => { if (!dry) writeJson(LEDGER, ledger); };
const mutate = createMutator({ delayMs });
const marker = (n, day) => `<!-- sim:${sprint.toLowerCase().replace(' ', '-')}:${n}:${day} -->`;

const groups = new Map(); // "số:ngày" → sự kiện, giữ thứ tự ngày rồi thứ tự xảy ra
for (const e of events) {
  const key = `${e.number}:${e.day}`;
  groups.set(key, [...(groups.get(key) || []), e]);
}
const lineOf = (e) => {
  if (e.kind === 'followup') return `- ${e.note}`;
  return e.field === 'Sprint' ? `- Chuyển ${e.from} → ${e.to}: ${e.note}` : `- ${e.from} → ${e.to}: ${e.note}`;
};
const bodyOf = (list) => [
  `**Giả lập ${sprint} · ngày ${list[0].day} (${list[0].date})**`, '', ...list.map(lineOf), '',
  '<sub>Lịch sử giả lập theo PREMISE PR-A-13 / progress-report.md — không phải việc đã làm thật.</sub>', marker(list[0].number, list[0].day),
].join('\n');

// Comment đã có trên issue chưa (ledger mất hoặc lỗi mạng giữa chừng) — dò theo dấu
function posted(n, day) {
  const nodes = graphql(`query($id:ID!){ node(id:$id){ ... on Issue { comments(last:100){ nodes { body } } } } }`, { id: nodeIdOf.get(n) }).node.comments.nodes;
  return nodes.some((c) => c.body.includes(marker(n, day)));
}

let comments = 0;
for (const [key, list] of [...groups].sort(([, listA], [, listB]) => listA[0].day - listB[0].day)) {
  if (ledger.comments.includes(key)) continue;
  const n = list[0].number;
  if (posted(n, list[0].day)) { // đã có trên GitHub mà ledger chưa ghi → chỉ ghi ledger
    ledger.comments.push(key);
    save();
    continue;
  }
  if (dry) { comments++; continue; }
  try {
    await mutate(`mutation($s:ID!,$b:String!){ addComment(input:{subjectId:$s, body:$b}){ clientMutationId } }`, { s: nodeIdOf.get(n), b: bodyOf(list) }, { idempotent: false });
  } catch (err) {
    if (!posted(n, list[0].day)) throw err;
  }
  ledger.comments.push(key);
  save();
  comments++;
}

const viewer = graphql('query{ viewer { id login } }').viewer;
const worked = [...new Set(events.filter((e) => e.to === 'In Progress').map((e) => e.number))];
let assigned = 0;
for (const n of worked.filter((x) => !ledger.assigned.includes(x))) {
  if (!dry) {
    await mutate(`mutation($a:ID!,$u:[ID!]!){ addAssigneesToAssignable(input:{assignableId:$a, assigneeIds:$u}){ clientMutationId } }`, { a: nodeIdOf.get(n), u: [viewer.id] });
    ledger.assigned.push(n);
    save();
  }
  assigned++;
}

const done = Object.entries(final).filter(([, f]) => f.status === 'Done').map(([n]) => Number(n));
let closed = 0;
for (const n of done.filter((x) => !ledger.closed.includes(x))) {
  if (!dry) {
    await mutate(`mutation($i:ID!){ closeIssue(input:{issueId:$i, stateReason:COMPLETED}){ clientMutationId } }`, { i: nodeIdOf.get(n) });
    ledger.closed.push(n);
    save();
  }
  closed++;
}
console.log(`${dry ? '[dry] ' : ''}comment ${comments}, gán ${assigned} issue cho ${viewer.login}, đóng ${closed} issue`);
