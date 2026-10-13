#!/usr/bin/env node
// Cấu hình GitHub Project có sẵn (không tạo mới), chạy lại bao nhiêu lần cũng được:
// thêm option Blocked vào Status, tạo field Sprint/Story Point/Estimated time/Owner/Type nếu thiếu,
// tạo view Board/Backlog/Sprint 1 (tên 'Type' bị GitHub giữ chỗ → dùng 'Item type'), rồi ghi id ra data/project-ids.json.
// Dùng: node scripts/configure-project.mjs [--public] [--dry-run]
import { graphql, writeJson, parseArgs, PROJECT_OWNER, PROJECT_NUMBER } from './lib/gh-graphql.mjs';

const args = parseArgs();
const dry = Boolean(args['dry-run']);

const SPRINT_START = '2026-11-30';
const SPRINT_DAYS = 14;
const SPRINTS = ['Sprint 1', 'Sprint 2', 'Sprint 3'];
const OWNERS = ['PM', 'BrSE', 'BE-1', 'BE-2', 'FE-1', 'FE-2', 'QA-1', 'QA-Auto', 'Infra', 'Design'];
const STATUS_ORDER = [
  ['Todo', 'GREEN', 'Chưa bắt đầu'],
  ['In Progress', 'YELLOW', 'Đang làm'],
  ['Blocked', 'RED', 'Bị chặn — ghi lý do và người gỡ trong comment'],
  ['Done', 'PURPLE', 'Đạt định nghĩa xong (DoD) của issue'],
];

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const FIELD_FRAGMENT = `__typename ... on ProjectV2FieldCommon { id name dataType }
  ... on ProjectV2SingleSelectField { options { id name color description } }
  ... on ProjectV2IterationField { configuration { iterations { id title startDate duration } } }`;

function readProject() {
  return graphql(`query($login:String!,$n:Int!){ user(login:$login){ projectV2(number:$n){
    id title url public
    fields(first:50){ nodes { ${FIELD_FRAGMENT} } }
    views(first:20){ nodes { id name number layout filter } } } } }`,
  { login: PROJECT_OWNER, n: PROJECT_NUMBER }).user.projectV2;
}

const run = (label, fn) => {
  console.log(`${dry ? '[dry] ' : ''}${label}`);
  return dry ? null : fn();
};

let project = readProject();
const byName = () => Object.fromEntries(project.fields.nodes.map((f) => [f.name, f]));

// 1. Status + Blocked (giữ id option cũ để không mất giá trị đã gán)
const status = byName().Status;
if (!status.options.some((o) => o.name === 'Blocked')) {
  const keep = Object.fromEntries(status.options.map((o) => [o.name, o.id]));
  const singleSelectOptions = STATUS_ORDER.map(([name, color, description]) => ({
    ...(keep[name] ? { id: keep[name] } : {}), name, color, description,
  }));
  run('Status: thêm Blocked', () => graphql(`mutation($id:ID!,$o:[ProjectV2SingleSelectFieldOptionInput!]){
    updateProjectV2Field(input:{fieldId:$id, singleSelectOptions:$o}){ clientMutationId } }`, { id: status.id, o: singleSelectOptions }));
}

// 2. Field còn thiếu
const wanted = [
  { name: 'Sprint', dataType: 'ITERATION', iterationConfiguration: {
    startDate: SPRINT_START, duration: SPRINT_DAYS,
    iterations: SPRINTS.map((title, i) => ({ title, startDate: addDays(SPRINT_START, i * SPRINT_DAYS), duration: SPRINT_DAYS })),
  } },
  { name: 'Story Point', dataType: 'NUMBER' },
  { name: 'Estimated time', dataType: 'NUMBER' },
  { name: 'Owner', dataType: 'SINGLE_SELECT', singleSelectOptions: OWNERS.map((name) => ({ name, color: 'GRAY', description: 'Vai giả định theo LAB-1' })) },
  { name: 'Item type', dataType: 'SINGLE_SELECT', singleSelectOptions: [
    { name: 'Epic', color: 'PURPLE', description: 'Nhóm chức năng (FG LAB-1) hoặc epic nền E-13…E-15' },
    { name: 'User Story', color: 'BLUE', description: 'Issue cấp giữa, giá trị nghiệp vụ nhìn thấy được' },
    { name: 'Task', color: 'GREEN', description: 'Việc kỹ thuật lá, ≤ 16 giờ' },
  ] },
];
for (const f of wanted) {
  if (byName()[f.name]) continue;
  run(`Tạo field ${f.name} (${f.dataType})`, () => graphql(`mutation($input:CreateProjectV2FieldInput!){
    createProjectV2Field(input:$input){ projectV2Field { ... on ProjectV2FieldCommon { id } } } }`,
  { input: { projectId: project.id, ...f } }));
}

if (!dry) project = readProject();
const fields = byName();

// 3. View (group-by không đặt được qua API — nhóm theo Parent issue chỉnh trên UI)
const visible = ['Title', 'Status', 'Item type', 'Owner', 'Sprint', 'Story Point', 'Estimated time', 'Parent issue', 'Sub-issues progress', 'Labels']
  .map((n) => fields[n]?.id).filter(Boolean);
const views = [
  { name: 'Board', layout: 'BOARD_LAYOUT', filter: '', renameFrom: 'View 1' },
  { name: 'Backlog', layout: 'TABLE_LAYOUT', filter: '' },
  { name: 'Sprint 1', layout: 'BOARD_LAYOUT', filter: 'sprint:"Sprint 1"' },
];
for (const v of views) {
  const existing = project.views.nodes.find((x) => x.name === v.name || x.name === v.renameFrom);
  if (existing) {
    if (existing.name !== v.name || (existing.filter || '') !== v.filter) {
      run(`View ${existing.name} → ${v.name}`, () => graphql(`mutation($id:ID!,$name:String!,$filter:String){
        updateProjectV2View(input:{viewId:$id, name:$name, filter:$filter}){ clientMutationId } }`, { id: existing.id, name: v.name, filter: v.filter }));
    }
    continue;
  }
  run(`Tạo view ${v.name}`, () => {
    const created = graphql(`mutation($p:ID!,$name:String!,$layout:ProjectV2ViewLayout!,$vis:[ID!]){
      createProjectV2View(input:{projectId:$p, name:$name, layout:$layout, configuration:{visibleFieldIds:$vis}}){ projectV2View { id } } }`,
    { p: project.id, name: v.name, layout: v.layout, vis: visible }).createProjectV2View.projectV2View;
    if (v.filter) graphql(`mutation($id:ID!,$filter:String){ updateProjectV2View(input:{viewId:$id, filter:$filter}){ clientMutationId } }`, { id: created.id, filter: v.filter });
  });
}

// 4. Public (chỉ khi có --public)
if (args.public && !project.public) {
  run('Đặt Project public', () => graphql(`mutation($p:ID!){ updateProjectV2(input:{projectId:$p, public:true}){ projectV2 { public } } }`, { p: project.id }));
}

// 5. Ghi id (chỉ node id, không token)
const toFieldEntry = (f) => ({
  id: f.id,
  dataType: f.dataType,
  ...(f.options ? { options: Object.fromEntries(f.options.map((o) => [o.name, o.id])) } : {}),
  ...(f.configuration ? { iterations: Object.fromEntries(f.configuration.iterations.map((it) => [it.title, { id: it.id, startDate: it.startDate, duration: it.duration }])) } : {}),
});

if (!dry) {
  project = readProject();
  const ids = {
    projectId: project.id, number: PROJECT_NUMBER, owner: PROJECT_OWNER, url: project.url, public: project.public,
    fields: Object.fromEntries(project.fields.nodes.map((f) => [f.name, toFieldEntry(f)])),
    views: project.views.nodes.map(({ id, name, number, layout, filter }) => ({ id, name, number, layout, filter })),
  };
  writeJson('data/project-ids.json', ids);
  console.log(`OK: ${Object.keys(ids.fields).length} field, ${ids.views.length} view, public=${ids.public}`);
}
