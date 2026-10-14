#!/usr/bin/env node
// Đẩy data/backlog.json lên GitHub: issue + sub-issue (native) + item trên Project + field Item type / Owner,
// rồi (pha link) đổi id trong thân issue thành #số và tạo quan hệ "blocked by" native.
// Chạy lại an toàn: lúc khởi động dò issue đã có theo tiền tố id ở tiêu đề (tiền tố trùng → dừng); ghi
// number/nodeId/itemId (và bodySha/fieldsSet/blockedByLinked) ngược vào backlog.json sau MỖI item.
// Hạn mức / lỗi mạng: chờ rồi thử lại (xem lib/github-mutation.mjs); lỗi khác: dừng.
// Hợp đồng sau khi tạo: backlog.json là nội dung lúc tạo. Chạy lại chỉ (a) tạo item còn thiếu và set field còn thiếu
// (pha create), (b) cập nhật thân khi bản dựng đổi VÀ thân trên GitHub chưa bị sửa tay, (c) thêm blocked-by còn thiếu
// (pha link). Nhãn, Owner, cha, tiêu đề và blocked-by đã bỏ KHÔNG được đồng bộ lại — đổi trực tiếp trên GitHub / Project.
// Dùng: node scripts/create-issues.mjs [--phase create|link|all] [--only FG-01,E-13] [--limit N] [--delay 800] [--dry-run]
//   --phase   mặc định create; link chỉ xử lý issue đã có số (issue chặn ở epic khác cũng phải đã tạo, không thì dừng)
//   --only    lọc theo epicId (FG-01…FG-12, E-13…E-15), cách nhau bằng dấu phẩy; cả hai pha đều chỉ xử lý epic đó
//   --limit   dừng sau N item ở pha create (không giới hạn nếu bỏ cờ)
//   --delay   mili-giây nghỉ sau mỗi mutation, mặc định 800; phải là số ≥ 0, không thì dừng ngay
//   --dry-run chỉ đọc GitHub rồi in việc sẽ làm; không ghi GitHub, không ghi backlog.json
import { createHash } from 'node:crypto';
import { graphql, paginate, readJson, writeJson, parseArgs, PROJECT_OWNER, REPO } from './lib/gh-graphql.mjs';
import { renderBody, issueTitle } from './lib/render-issue-body.mjs';
import { createMutator, sleep, NETWORK } from './lib/github-mutation.mjs';

const args = parseArgs();
const phase = args.phase || 'create';
const only = args.only ? String(args.only).split(',') : null;
const limit = Number(args.limit ?? Infinity);
const delayMs = Number(args.delay ?? 800);
if (!(delayMs >= 0)) throw new Error('--delay phải là số mili-giây ≥ 0');
const dry = Boolean(args['dry-run']);
const BACKLOG = 'data/backlog.json';
const ITEM_TYPE = { epic: 'Epic', story: 'User Story', task: 'Task' };
const PROJECT_ITEMS = 'projectItems(first:5){ nodes { id project { id } } }';
const [owner, name] = REPO.split('/');

const backlog = readJson(BACKLOG);
const ids = readJson('data/project-ids.json');
const byId = new Map(backlog.items.map((i) => [i.id, i]));
const numberOf = (id) => byId.get(id)?.number ?? null;
const bodyOf = (item) => renderBody(item, { byId, numberOf });
const projectItemIdOf = (projectItems) => projectItems.nodes.find((p) => p.project.id === ids.projectId)?.id ?? null;
const save = () => writeJson(BACKLOG, backlog);
const sha = (s) => createHash('sha1').update(s).digest('hex').slice(0, 12);

const mutate = createMutator({ delayMs });

// Issue vừa tạo có tiêu đề này chưa (sau lỗi mạng giữa chừng)? Dò 20 issue mới nhất
function findCreated(title) {
  const recent = graphql(`query($o:String!,$n:String!){ repository(owner:$o,name:$n){ issues(last:20, orderBy:{field:CREATED_AT, direction:ASC}){
    nodes { id number title ${PROJECT_ITEMS} } } } }`, { o: owner, n: name }).repository.issues.nodes;
  return recent.find((i) => i.title === title) ?? null;
}

// Repo, nhãn, và issue đã có (khôi phục số sau một lần chạy bị ngắt)
const repo = graphql(`query($o:String!,$n:String!){ repository(owner:$o,name:$n){ id labels(first:100){ nodes { id name } } } }`, { o: owner, n: name }).repository;
const labelId = new Map(repo.labels.nodes.map((l) => [l.name, l.id]));
const existing = paginate((after) => graphql(`query($o:String!,$n:String!,$a:String){ repository(owner:$o,name:$n){ issues(first:100, after:$a){
  pageInfo { hasNextPage endCursor } nodes { id number title ${PROJECT_ITEMS} } } } }`, { o: owner, n: name, a: after }).repository.issues);
const prefixes = existing.map((i) => i.title.split(' ')[0]);
const dupes = prefixes.filter((p, k) => byId.has(p) && prefixes.indexOf(p) !== k);
if (dupes.length) throw new Error(`GitHub có issue trùng tiền tố id: ${[...new Set(dupes)].join(', ')} — gộp / đóng tay trước khi chạy`);
for (const issue of existing) {
  const item = byId.get(issue.title.split(' ')[0]);
  if (item?.number && item.number !== issue.number) console.log(`! ${item.id}: backlog ghi #${item.number}, GitHub có #${issue.number}`);
  if (!item || item.number) continue;
  Object.assign(item, { number: issue.number, nodeId: issue.id, itemId: projectItemIdOf(issue.projectItems) });
}

// Thứ tự: cha trước con (epic → story/task dưới epic → sub)
const depth = (it) => (it.kind === 'epic' ? 0 : byId.get(it.parentId)?.kind === 'epic' ? 1 : 2);
const scope = backlog.items.filter((it) => !only || only.includes(it.epicId)).sort((a, b) => depth(a) - depth(b));

function labelIdOf(item, label) {
  const id = labelId.get(label);
  if (id === undefined) throw new Error(`${item.id}: repo thiếu nhãn ${label}`);
  return id;
}

// Item của issue trên Project: phản hồi createIssue đôi khi chưa kịp có projectItems → đọc lại vài lần, cuối cùng mới thêm
async function ensureProjectItem(item) {
  for (let i = 0; i < 3 && !item.itemId; i++) {
    const { projectItems } = graphql(`query($id:ID!){ node(id:$id){ ... on Issue { ${PROJECT_ITEMS} } } }`, { id: item.nodeId }).node;
    item.itemId = projectItemIdOf(projectItems);
    if (!item.itemId) await sleep(2_000);
  }
  if (!item.itemId) {
    item.itemId = (await mutate(`mutation($p:ID!,$c:ID!){ addProjectV2ItemById(input:{projectId:$p, contentId:$c}){ item { id } } }`, { p: ids.projectId, c: item.nodeId })).addProjectV2ItemById.item.id;
  }
  save();
}

async function setField(item, field, option) {
  const f = ids.fields[field];
  await mutate(`mutation($p:ID!,$i:ID!,$f:ID!,$o:String!){ updateProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,fieldId:$f,value:{singleSelectOptionId:$o}}){ clientMutationId } }`,
    { p: ids.projectId, i: item.itemId, f: f.id, o: f.options[option] });
}

// Đưa issue lên Project và set field Item type / Owner
async function syncProjectFields(item) {
  await ensureProjectItem(item);
  await setField(item, 'Item type', ITEM_TYPE[item.kind]);
  await setField(item, 'Owner', item.owner);
  item.fieldsSet = true;
  save();
}

// Gửi createIssue; mất kết nối giữa chừng thì dò issue đã tạo thay vì tạo trùng
async function createIssueWithRetry(item, input) {
  let issue;
  for (let attempt = 0; !issue; attempt++) {
    try {
      issue = (await mutate(`mutation($input:CreateIssueInput!){ createIssue(input:$input){ issue { id number ${PROJECT_ITEMS} } } }`,
        { input }, { idempotent: false })).createIssue.issue;
    } catch (err) {
      if (!NETWORK.test(err.message) || attempt >= 4) throw err;
      await sleep(5_000 * (attempt + 1));
      issue = findCreated(input.title); // đã tạo trước khi mất kết nối → dùng luôn, không tạo trùng
      console.log(`… lỗi mạng khi tạo ${item.id}; ${issue ? `đã có #${issue.number}` : 'chưa có, tạo lại'}`);
    }
  }
  return issue;
}

async function createOne(item) {
  const parent = item.parentId ? byId.get(item.parentId) : null;
  if (parent && !parent.nodeId && !dry) throw new Error(`${item.id}: cha ${parent.id} chưa được tạo`);
  const body = bodyOf(item);
  const labelIds = item.labels.map((label) => labelIdOf(item, label));
  if (dry) {
    console.log(`[dry] ${item.id} ← ${parent?.id ?? '—'} (${item.labels.length} nhãn, ${body.length} ký tự)`);
    return;
  }
  const input = { repositoryId: repo.id, title: issueTitle(item), body, labelIds, projectV2Ids: [ids.projectId], ...(parent ? { parentIssueId: parent.nodeId } : {}) };
  const issue = await createIssueWithRetry(item, input);
  Object.assign(item, { number: issue.number, nodeId: issue.id, bodySha: sha(body), itemId: projectItemIdOf(issue.projectItems) });
  save();
  await syncProjectFields(item);
  console.log(`+ #${item.number} ${item.id}`);
}

// Thân dựng lại khi đủ số issue đích; chỉ gửi nếu khác lần đã đẩy
async function syncBody(item) {
  const body = bodyOf(item);
  if (sha(body) === item.bodySha) return;
  // Thân trên GitHub đã bị sửa tay (khác lần đẩy trước) → không ghi đè
  const live = graphql(`query($id:ID!){ node(id:$id){ ... on Issue { body } } }`, { id: item.nodeId }).node.body;
  if (sha(live) !== item.bodySha) return console.log(`! #${item.number} ${item.id}: thân trên GitHub đã sửa tay, bỏ qua`);
  if (dry) {
    console.log(`[dry] sửa thân #${item.number} ${item.id}`);
    return;
  }
  await mutate(`mutation($id:ID!,$b:String!){ updateIssue(input:{id:$id, body:$b}){ clientMutationId } }`, { id: item.nodeId, b: body });
  item.bodySha = sha(body);
  save();
}

async function linkBlockers(item) {
  for (const blocker of item.body?.blockedBy || []) {
    if ((item.blockedByLinked || []).includes(blocker)) continue;
    const target = byId.get(blocker);
    if (!target?.nodeId) throw new Error(`${item.id}: issue chặn ${blocker} chưa được tạo`);
    if (dry) { console.log(`[dry] #${item.number} blocked by #${target.number}`); continue; }
    try {
      await mutate(`mutation($i:ID!,$b:ID!){ addBlockedBy(input:{issueId:$i, blockingIssueId:$b}){ clientMutationId } }`, { i: item.nodeId, b: target.nodeId });
    } catch (err) {
      if (!/already.*block|block.*already/i.test(err.message)) throw err; // quan hệ đã có từ lần chạy trước
    }
    item.blockedByLinked = [...(item.blockedByLinked || []), blocker];
    save();
  }
}

let done = 0;
const started = Date.now();
if (phase === 'create' || phase === 'all') {
  for (const item of scope.filter((it) => !it.number || !it.fieldsSet)) {
    if (done >= limit) break;
    if (!item.number) await createOne(item);
    else if (!dry) await syncProjectFields(item); // tạo rồi nhưng chưa set field (bị ngắt giữa chừng)
    done++;
  }
}
if (phase === 'link' || phase === 'all') {
  for (const item of scope.filter((it) => it.number)) {
    await syncBody(item);
    await linkBlockers(item);
  }
}
const created = backlog.items.filter((i) => i.number).length;
console.log(`${dry ? '[dry] ' : ''}xong ${done} item trong ${Math.round((Date.now() - started) / 1000)}s; trên GitHub: ${created}/${backlog.items.length} (${PROJECT_OWNER} project ${ids.number})`);
