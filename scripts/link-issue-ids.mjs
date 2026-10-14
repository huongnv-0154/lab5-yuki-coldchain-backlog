#!/usr/bin/env node
// Đổi id backlog (FG04-12, E13-01.4, E15-FG06-01…) trong các dòng bảng của file markdown thành link issue:
// "FG04-12" → "[FG04-12 #57](…/issues/57)". Id đã nằm trong link thì bỏ qua → chạy lại không đổi gì thêm.
// Chỉ đổi id có số issue trong data/backlog.json; id chưa tạo issue giữ nguyên.
// Dùng: node scripts/link-issue-ids.mjs PREMISE.md [--check]   (--check đặt SAU tên file; không ghi file,
//   in số id chưa link / chưa có issue, exit 1 nếu còn id cần link, exit 0 nếu không)
import { readFileSync, writeFileSync } from 'node:fs';
import { readJson, parseArgs } from './lib/gh-graphql.mjs';

const args = parseArgs();
const file = args._[0];
if (!file) {
  console.error('cần tên file, vd: node scripts/link-issue-ids.mjs PREMISE.md');
  process.exit(1);
}
const ISSUES = 'https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues';
const numberOf = new Map(readJson('data/backlog.json').items.filter((i) => i.number).map((i) => [i.id, i.number]));
// id không nằm sau "[" (đã là link) và không dính chữ / số / dấu chấm liền trước
const ID = /(?<![\[\w.-])(?:FG\d{2}-\d{2}(?:\.\d+)?|E1[345]-(?:FG\d{2}-)?\d{2}(?:\.\d+)?)(?![\w.-]*\]\()(?!\.?\d)/g;

const before = readFileSync(file, 'utf8');
let linked = 0;
let missing = 0;
const after = before.split('\n').map((line) => {
  if (!line.startsWith('|')) return line; // chỉ đổi trong bảng, giữ nguyên văn xuôi
  return line.replace(ID, (id) => {
    const n = numberOf.get(id);
    if (!n) { missing++; return id; }
    linked++;
    return `[${id} #${n}](${ISSUES}/${n})`;
  });
}).join('\n');

if (args.check) {
  console.log(`${file}: ${linked} id chưa link, ${missing} id chưa có issue`);
  process.exit(linked ? 1 : 0);
}
if (after !== before) writeFileSync(file, after);
console.log(`${file}: link ${linked} id, ${missing} id chưa có issue`);
