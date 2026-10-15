#!/usr/bin/env node
// Sửa ba lỗi vệ sinh issue từ cross-review (X-16, X-17, X-12) — mặc định chỉ đọc GitHub (dry-run), ghi kế hoạch ra file tạm data/issue-hygiene-fixes.tmp.json
// (bị .gitignore). File chính data/issue-hygiene-fixes.json (bằng chứng lần ghi đã duyệt) chỉ ghi khi --apply có việc để làm.
//   X-16: 9 dòng "Ghi chú" của #103 #104 #78 #168 #169 #170 #172 #175 #176 ghi mã spec → thay bằng #issue (giữ mã trong ngoặc) hoặc nêu lý do.
//         Kèm một dòng Phạm vi thêm vào #284 (migration customers.notification_email mà #103/#104 cần — chỗ sót phát hiện khi kiểm X-16).
//   X-17: tick `- [ ]` → `- [x]` chỉ trong mục "Định nghĩa xong (DoD)" của các issue đã đóng; tập đóng trên GitHub phải khớp final Done của
//         data/sprint-1-log.json (lệch → báo và không --apply).
//   X-12: comment giả lập ngày 6 của #368 (dấu <!-- sim:sprint-1:368:6 -->) đổi chữ "hết chặn" cho đúng; nguồn đã sửa ở simulate-sprint.mjs.
// --apply: ghi qua createMutator (issue) và REST PATCH (comment); bỏ qua mục đã đúng đích; mục nào có nội dung hiện tại khác nội dung lúc lập
// kế hoạch thì dừng riêng mục đó (đọc lại ngay trước khi ghi). --help: in cách dùng, không ghi gì. Không đụng data/backlog.json.
// Dùng: node scripts/fix-issue-hygiene.mjs [--apply] [--delay 1000] [--help]
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readJson, writeJson, parseArgs, REPO } from './lib/gh-graphql.mjs';
import { createMutator, sleep } from './lib/github-mutation.mjs';

const args = parseArgs();
if (args.help) {
  console.log('Dùng: node scripts/fix-issue-hygiene.mjs [--apply] [--delay 1000]\n  (mặc định dry-run: đọc GitHub, in diff, ghi kế hoạch ra data/issue-hygiene-fixes.tmp.json; --apply mới ghi lên GitHub và data/issue-hygiene-fixes.json)');
  process.exit(0);
}
const delayMs = Number(args.delay ?? 1000);
if (!(delayMs >= 0)) throw new Error('--delay phải là số mili-giây ≥ 0');
const OUT = 'data/issue-hygiene-fixes.json';
const OUT_TMP = 'data/issue-hygiene-fixes.tmp.json';
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const gh = (...a) => JSON.parse(execFileSync('gh', ['api', ...a], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }));
const rest = (path) => gh('--paginate', '--slurp', path).flat();

// X-16: dòng cũ → dòng mới. "Ảnh hưởng: DEV-/MOCK-/GAP-" là dòng lệch trong deviation-table LAB-4, do chính issue E-15 đó xử lý (không có issue riêng);
// issue chịu tác động là issue đã nêu ở dòng "Issue bị ảnh hưởng" ngay trên → trỏ về đó. #103/#104: cột customers.notification_email là thay đổi đích T4
// của CORE_MASTER_DB (LAB-4) nhưng backlog chưa có issue migration → gộp vào #284 (DB người nhận thông báo thu hồi), thêm một dòng Phạm vi ở #284.
const NE = 'CORE_MASTER_DB customers.notification_email (FG-01)';
const NE_WHY = 'LAB-4 đã thiết kế cột (CORE_MASTER_DB.md:439, thay đổi đích T4 tại c3cf20d) nhưng backlog không có issue migration nó (chỉ #103/#104 nhắc tới) → gộp vào #284.';
const NE_TO = '— migration cột này làm ở #284 (thay đổi đích T4 của CORE_MASTER_DB, LAB-4)';
const E15_WHY = (code, n) => `${code} là dòng lệch trong deviation-table LAB-4, do chính issue này xử lý; issue chịu tác động là #${n}, đã nêu ở dòng "Issue bị ảnh hưởng" ngay trên.`;
const X16 = [
  [103, `- Phụ thuộc: ${NE} cho bước thông báo`, `- Phụ thuộc: ${NE} cho bước thông báo ${NE_TO}`, NE_WHY, 'ổn'],
  [104, `- Phụ thuộc: ${NE}`, `- Phụ thuộc: ${NE} ${NE_TO}`, NE_WHY, 'ổn'],
  // #284: thêm dòng Phạm vi sau dòng cuối của mục (dòng RLS) — phát hiện khi kiểm X-16, không đổi SWP (thêm một cột NULL + CHECK)
  [284, '- RLS như 5 bảng recall', '- RLS như 5 bảng recall\n- Migration cột `customers.notification_email` (CORE_MASTER_DB thay đổi đích T4 của LAB-4) — #103, #104 đọc cột này để gửi thông báo', 'Chỗ sót của backlog phát hiện khi kiểm X-16: LAB-4 đã thiết kế cột, chưa issue nào làm migration.', 'ổn'],
  ...[[78, 'GAP-14', 65], [168, 'DEV-005', 31], [169, 'DEV-011', 56], [170, 'DEV-012', 33], [172, 'DEV-035', 33], [175, 'MOCK-15', 146], [176, 'MOCK-16', 59]]
    .map(([i, c, n]) => [i, `- Ảnh hưởng: ${c}`, `- Ảnh hưởng: #${n} (${c})`, E15_WHY(c, n), 'ổn']),
];
// So theo nội dung, không theo vị trí: chèn một dòng (#284) không làm cả đoạn phía sau thành "đổi"
const diffLines = (a, b) => {
  const [A, B] = [a.split('\n'), b.split('\n')];
  const removed = A.filter((l) => !B.includes(l));
  const added = B.filter((l) => !A.includes(l));
  return Array.from({ length: Math.max(removed.length, added.length) }, (_, k) => ({ old: removed[k] ?? null, new: added[k] ?? null }));
};

// 1. Đọc GitHub
const closed = rest(`repos/${REPO}/issues?state=closed&per_page=100`).filter((i) => !i.pull_request);
const doneInLog = Object.entries(readJson('data/sprint-1-log.json').final).filter(([, f]) => f.status === 'Done').map(([n]) => Number(n));
const closedNums = closed.map((i) => i.number);
const mismatch = { closedNotDone: closedNums.filter((n) => !doneInLog.includes(n)), doneNotClosed: doneInLog.filter((n) => !closedNums.includes(n)) };
const bodyOf = new Map(closed.map((i) => [i.number, i.body ?? '']));
for (const n of new Set(X16.map((x) => x[0]))) if (!bodyOf.has(n)) bodyOf.set(n, gh(`repos/${REPO}/issues/${n}`).body ?? '');

// 2. Tính thân mới: X-16 rồi X-17 (hai việc không đè dòng nhau)
const newBody = new Map();
const edit = (n, f) => newBody.set(n, f(newBody.get(n) ?? bodyOf.get(n)));
for (const [n, oldLine, newLine] of X16) {
  if (bodyOf.get(n).includes(newLine)) continue; // đã sửa ở lần --apply trước → chạy lại được sau khi dừng giữa chừng
  const lines = bodyOf.get(n).split('\n');
  const at = lines.filter((l) => l.trimEnd() === oldLine);
  if (at.length !== 1) throw new Error(`#${n}: không tìm đúng 1 dòng "${oldLine}" (thấy ${at.length}) — thân đã đổi?`);
  edit(n, (b) => b.split('\n').map((l) => (l.trimEnd() === oldLine ? newLine : l)).join('\n'));
}
for (const n of closedNums) {
  let inDod = false;
  edit(n, (b) => b.split('\n').map((l) => {
    if (/^\*\*/.test(l)) inDod = /^\*\*Định nghĩa xong/.test(l);
    return inDod ? l.replace(/^(\s*- )\[ \]/, '$1[x]') : l;
  }).join('\n'));
}
const issues = [...newBody].filter(([n, b]) => b !== bodyOf.get(n)).sort(([a], [b]) => a - b).map(([n, b]) => ({
  number: n, baseSha: sha(bodyOf.get(n)), targetSha: sha(b), target: b, changes: diffLines(bodyOf.get(n), b),
  fixes: [...(X16.some((x) => x[0] === n) ? ['X-16'] : []), ...(closedNums.includes(n) ? ['X-17'] : [])],
}));

// 3. Comment X-12
const MARK = '<!-- sim:sprint-1:368:6 -->';
const OLD = '- Blocked → Todo: Hết chặn, làm tiếp';
const NEW = `- Blocked → Todo: ${readJson('data/sprint-1-log.json').events.find((e) => e.number === 368 && e.day === 6).note}`;
const cmts = rest(`repos/${REPO}/issues/368/comments?per_page=100`).filter((c) => c.body.includes(MARK));
if (cmts.length !== 1) throw new Error(`#368: cần đúng 1 comment mang dấu ${MARK}, thấy ${cmts.length}`);
const [cm] = cmts;
if (!cm.body.includes(OLD) && !cm.body.includes(NEW)) throw new Error('comment #368 ngày 6 không chứa dòng cần sửa');
const cTarget = cm.body.replace(OLD, NEW);
const comments = [{ issue: 368, commentId: cm.id, baseSha: sha(cm.body), targetSha: sha(cTarget), target: cTarget, changes: diffLines(cm.body, cTarget) }];

const lines = issues.reduce((t, i) => t + i.changes.length, 0);
const plan = {
  note: 'Kế hoạch sửa vệ sinh issue (X-16, X-17, X-12); sinh bởi scripts/fix-issue-hygiene.mjs — mặc định chỉ đọc',
  totals: { issues: issues.length, lines, comments: comments.filter((c) => c.changes.length).length },
  x16: X16.map(([issue, oldText, newText, rationale, mapping]) => ({ issue, oldText, newText, rationale, mapping })),
  x17: { closedOnGitHub: closedNums.length, doneInLog: doneInLog.length, mismatch },
  issues, comments,
};
// Dry-run hoặc --apply không còn việc: không đè file chính
const hasWork = plan.totals.issues > 0 || plan.totals.comments > 0;
writeJson(args.apply && hasWork ? OUT : OUT_TMP, plan);
for (const i of issues) {
  console.log(`#${i.number} [${i.fixes.join('+')}]`);
  for (const c of i.changes) console.log(`${c.old === null ? '' : `  - ${c.old}\n`}${c.new === null ? '' : `  + ${c.new}`}`);
}
for (const c of comments) for (const d of c.changes) console.log(`comment #${c.issue}/${c.commentId}\n  - ${d.old}\n  + ${d.new}`);
console.log(`\n${args.apply ? '' : '[dry] '}${plan.totals.issues} issue, ${lines} dòng, ${plan.totals.comments} comment; đóng ${closedNums.length} / Done log ${doneInLog.length}; lệch: ${JSON.stringify(mismatch)}`);
if (!args.apply) process.exit(0);
if (mismatch.closedNotDone.length || mismatch.doneNotClosed.length) throw new Error('tập issue đóng lệch final Done — dừng, không ghi');

// 4. Ghi, mỗi mục đọc lại ngay trước khi sửa
const mutate = createMutator({ delayMs });
const nodeIdOf = new Map(readJson('data/backlog.json').items.map((i) => [i.number, i.nodeId]));
let wrote = 0, same = 0, aborted = 0;
for (const i of issues) {
  const cur = sha(gh(`repos/${REPO}/issues/${i.number}`).body ?? '');
  if (cur === i.targetSha) { same++; continue; }
  if (cur !== i.baseSha) { console.log(`#${i.number}: thân đã đổi so với lúc lập kế hoạch, bỏ qua`); aborted++; continue; }
  await mutate('mutation($i:ID!,$b:String!){ updateIssue(input:{id:$i, body:$b}){ clientMutationId } }', { i: nodeIdOf.get(i.number), b: i.target });
  wrote++;
}
for (const c of comments) {
  const cur = sha(gh(`repos/${REPO}/issues/comments/${c.commentId}`).body);
  if (cur === c.targetSha) { same++; continue; }
  if (cur !== c.baseSha) { console.log(`comment ${c.commentId}: đã đổi, bỏ qua`); aborted++; continue; }
  execFileSync('gh', ['api', '-X', 'PATCH', `repos/${REPO}/issues/comments/${c.commentId}`, '-F', 'body=@-'], { input: c.target });
  await sleep(delayMs);
  wrote++;
}
console.log(`đã ghi ${wrote}, giữ nguyên ${same}, bỏ qua ${aborted}`);
