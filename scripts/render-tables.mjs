#!/usr/bin/env node
// Thay nội dung giữa <!-- GENERATED:<tên> [k=v ...] --> và <!-- /GENERATED --> trong các file nộp
// bằng bảng sinh từ data/project-snapshot.json (+ data/*.json). Tên lạ → dừng (không bỏ qua im lặng).
// Dùng: node scripts/render-tables.mjs [--check]   (--check: chỉ báo file nào lệch, exit 1 nếu lệch)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { readJson, parseArgs } from './lib/gh-graphql.mjs';
import { renderers } from './lib/table-renderers.mjs';

const FILES = ['README.md', 'PREMISE.md', 'task-breakdown.md', 'estimate.md', 'progress-report.md', 'AI-report.md'];
// Thân block không được chứa thẻ mở khác → thiếu thẻ đóng thì không nuốt sang block sau
const BLOCK = /<!-- GENERATED:([\w-]+)((?:\s+[\w-]+=[^\s>]+)*)\s*-->(?:(?!<!-- GENERATED:)[\s\S])*?<!-- \/GENERATED -->/g;

const args = parseArgs();
const snapshot = readJson('data/project-snapshot.json');
const data = (name) => readJson(`data/${name}.json`);

// ' sprint="Sprint_1" x=y' → { sprint: 'Sprint 1', x: 'y' } (bỏ ngoặc kép, '_' → khoảng trắng)
function parseOptions(rawOpts) {
  const pairs = rawOpts.trim().split(/\s+/).filter(Boolean).map((kv) => kv.split('='));
  return Object.fromEntries(pairs.map(([key, value]) => [key, value.replace(/^"|"$/g, '').replaceAll('_', ' ')]));
}

let drift = 0;
let blocks = 0;
for (const file of FILES.filter((f) => existsSync(f))) {
  const before = readFileSync(file, 'utf8');
  // Thẻ viết sai cú pháp sẽ không khớp BLOCK → đếm thẻ mở/đóng để dừng thay vì bỏ qua im lặng
  const opens = (before.match(/<!--\s*GENERATED:/g) || []).length;
  const closes = (before.match(/<!--\s*\/GENERATED\s*-->/g) || []).length;
  const matched = (before.match(BLOCK) || []).length;
  if (opens !== matched || closes !== matched) throw new Error(`${file}: ${opens} thẻ mở, ${closes} thẻ đóng, ${matched} block hợp lệ — sửa thẻ GENERATED`);
  const after = before.replace(BLOCK, (_, name, rawOpts) => {
    const render = renderers[name];
    if (!render) throw new Error(`${file}: không có renderer "${name}"`);
    blocks++;
    return `<!-- GENERATED:${name}${rawOpts} -->\n${render({ snapshot, data, options: parseOptions(rawOpts) })}\n<!-- /GENERATED -->`;
  });
  if (after === before) continue;
  drift++;
  if (args.check) console.log(`lệch: ${file}`);
  else writeFileSync(file, after);
}
console.log(`${blocks} block, ${drift} file ${args.check ? 'lệch' : 'cập nhật'}`);
if (args.check && drift) process.exit(1);
