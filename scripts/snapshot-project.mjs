#!/usr/bin/env node
// Chụp toàn bộ item của Project (phân trang) → data/project-snapshot.json.
// Mọi bảng trong 6 file nộp sinh từ snapshot này, không gõ tay số liệu.
// Dùng: node scripts/snapshot-project.mjs [--out data/project-snapshot.json]
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { graphql, paginate, readJson, writeJson, parseArgs, PROJECT_OWNER, PROJECT_NUMBER } from './lib/gh-graphql.mjs';

const VALUE_FRAGMENT = `__typename
  ... on ProjectV2ItemFieldSingleSelectValue { name field { ... on ProjectV2FieldCommon { name } } }
  ... on ProjectV2ItemFieldNumberValue { number field { ... on ProjectV2FieldCommon { name } } }
  ... on ProjectV2ItemFieldIterationValue { title startDate duration field { ... on ProjectV2FieldCommon { name } } }`;

function fetchPage(after) {
  return graphql(`query($login:String!,$n:Int!,$after:String){ user(login:$login){ projectV2(number:$n){
    items(first:100, after:$after){ pageInfo { hasNextPage endCursor } nodes {
      id isArchived
      content { __typename ... on Issue {
        id number title url state closedAt
        labels(first:30){ nodes { name } }
        parent { number }
        subIssues(first:100){ nodes { number } }
      } }
      fieldValues(first:30){ nodes { ${VALUE_FRAGMENT} } }
    } } } } }`, { login: PROJECT_OWNER, n: PROJECT_NUMBER, after }).user.projectV2.items;
}

// Tên field trên Project → khoá trong snapshot (set-field.mjs dùng lại để so giá trị hiện tại)
export const FIELD_KEYS = { Status: 'status', 'Item type': 'itemType', Owner: 'owner', Sprint: 'sprint', 'Story Point': 'storyPoint', 'Estimated time': 'estimatedTime' };

// Giá trị một field: số (Number), tên sprint (Iteration) hoặc tên option (SingleSelect)
function readFieldValue(value) {
  if (value.__typename.endsWith('NumberValue')) return value.number;
  if (value.__typename.endsWith('IterationValue')) return value.title;
  return value.name;
}

// Gom các field đã biết của một item về dạng { status, itemType, ... }
function readFieldValues(fieldValueNodes) {
  const values = {};
  for (const value of fieldValueNodes) {
    const key = FIELD_KEYS[value.field?.name];
    if (key) values[key] = readFieldValue(value);
  }
  return values;
}

function toSnapshotItem(node) {
  const content = node.content || {};
  const values = readFieldValues(node.fieldValues.nodes);
  return {
    itemId: node.id,
    contentType: content.__typename,
    issueId: content.id ?? null,
    number: content.number ?? null,
    title: content.title ?? null,
    url: content.url ?? null,
    state: content.state ?? null,
    closedAt: content.closedAt ?? null,
    labels: (content.labels?.nodes || []).map((l) => l.name).sort(),
    parentNumber: content.parent?.number ?? null,
    subIssueNumbers: (content.subIssues?.nodes || []).map((s) => s.number).sort((a, b) => a - b),
    status: values.status ?? null,
    itemType: values.itemType ?? null,
    owner: values.owner ?? null,
    sprint: values.sprint ?? null,
    storyPoint: values.storyPoint ?? null,
    estimatedTime: values.estimatedTime ?? null,
  };
}

export function fetchSnapshot() {
  const items = paginate(fetchPage)
    .filter((node) => !node.isArchived)
    .map(toSnapshotItem)
    .sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  return { fetchedAt: new Date().toISOString(), project: `${PROJECT_OWNER}/projects/${PROJECT_NUMBER}`, itemCount: items.length, items };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = parseArgs().out || 'data/project-snapshot.json';
  const snap = fetchSnapshot();
  // Dữ liệu không đổi → giữ fetchedAt cũ, để bảng sinh ra không bị báo lệch chỉ vì mốc giờ
  const prev = existsSync(out) ? readJson(out) : null;
  if (prev && JSON.stringify(prev.items) === JSON.stringify(snap.items)) snap.fetchedAt = prev.fetchedAt;
  writeJson(out, snap);
  console.log(`snapshot: ${snap.itemCount} item → ${out}`);
}
