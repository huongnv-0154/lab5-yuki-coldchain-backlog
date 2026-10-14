#!/usr/bin/env node
// Cổng nộp G5 cho 6 file ở gốc repo theo đề LAB-5 mục IV, chỉ đọc file + git:
//   1. đầu file có nội dung bắt buộc; các mục ## đúng thứ tự; bảng đầu tiên của mục có đủ cột tối thiểu của đề;
//   2. README: ô đầu các dòng bảng Cấu trúc repo phủ mọi mục ở gốc sẽ lên repo (git đang theo dõi + file mới chưa bị
//      .gitignore); không có thư mục chép gói LAB-4 (A-08); mục Link có repo, Project,
//      báo cáo HTML, dòng mở thử không đăng nhập (chỉ tìm trong mục Link, không tìm cả file);
//   3. markdown nộp (6 file + skills/ + premise-revisions/): không còn 〔TODO, không trích 「…」 dài quá 40 ký tự (chống
//      chép câu RFP), không còn chuỗi Demo-yuki, link tương đối trỏ tới file sẽ lên repo (không ra ngoài repo, không vào
//      chỗ bị .gitignore), mọi #số / URL issue của repo này có trên Project (data/project-snapshot.json);
//   4. mọi file sẽ lên repo (md, json, html, mjs…): không token / Bearer / email thật.
// Dùng: node scripts/check-lab5.mjs   (exit 1 nếu có lỗi)
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { readJson } from './lib/gh-graphql.mjs';

// Mỗi file: head = chuỗi phải có trong 8 dòng đầu; sections = [tiêu đề ## (regex), cột bắt buộc của bảng đầu tiên trong mục]
const SPEC = {
  'README.md': {
    head: ['Dự án:', 'Mã học viên: `huongnv-0154`', 'Đề: Product B'],
    sections: [[/^## Tổng quan/], [/^## Link/, ['Gì', 'Link']], [/^## Cấu trúc repo/, ['File / thư mục', 'Nội dung']],
      [/^## Spec → epic/, ['Spec', 'Epic trên Project', 'Ghi chú']]],
  },
  'PREMISE.md': {
    head: [],
    sections: [[/^## 1\. Spec thêm/, ['Spec', 'Thêm / Bỏ / Sửa', 'Trước → sau', 'Vì sao', 'Issue bị ảnh hưởng']],
      [/^## 2\. Giả định/, ['Giả định', 'Chỗ spec / RFP để ngỏ', 'Ảnh hưởng tới issue / estimate']],
      [/^## 3\. Hướng đã chốt/, ['Vấn đề', 'Các phương án ở LAB-4', 'Phương án chốt', 'Vì sao']]],
  },
  'task-breakdown.md': {
    head: [],
    sections: [[/^## 1\. Nguyên tắc/], [/^## 2\. /, ['Spec', 'Epic', 'Issue / sub-issue', 'Phần spec chưa thành issue và vì sao']],
      [/^## 3\. /, ['Ràng buộc', 'Issue', 'Vì sao tách riêng']], [/^## 4\. /, ['Spec', 'Chỗ hở / mâu thuẫn', 'Xử lý']]],
  },
  'estimate.md': {
    head: ['swp-report/report.html'],
    sections: [[/^## 1\. /, ['Issue', 'Skill chấm (Scope × Complexity → SWP)', 'Bạn chốt', 'Lý do']], [/^## 2\. Cách quy ra giờ/],
      [/^## 3\. Tổng theo epic/, ['Epic', 'Số issue', 'Tổng SWP', 'Tổng giờ', 'Ghi chú']],
      [/^## 4\. So với estimate LAB-1/, ['Phần', 'LAB-1', 'LAB-5', 'Chênh', 'Vì sao']]],
  },
  'progress-report.md': {
    head: ['Iteration: **Sprint 1**', '2026-11-30 → 2026-12-11'],
    sections: [[/^## 1\. Trạng thái/, ['Trạng thái', 'Số issue', 'Tổng SWP', 'Ghi chú']], [/^## 2\. Burndown/],
      [/^## 3\. Rủi ro trễ/, ['Rủi ro', 'Issue', 'Ảnh hưởng tới mốc nào', 'Hành động', 'Ai làm, khi nào']]],
  },
  'AI-report.md': {
    head: [],
    sections: [[/^## 1\. Skill và prompt/], [/^## 2\. Review output AI/], [/^## 3\. Điểm đặc biệt/]],
  },
};
// Chuỗi phải có trong mục Link của README.md
const README_LINK_MARKERS = [
  'https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog',
  'https://github.com/users/huongnv-0154/projects/2',
  'swp-report/report.html',
  'Đã mở thử không đăng nhập',
];
const errors = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);

// 1. Thứ tự mục + cột
for (const [file, spec] of Object.entries(SPEC)) {
  if (!existsSync(file)) { fail(file, 'không có file'); continue; }
  const lines = readFileSync(file, 'utf8').split('\n');
  const head = lines.slice(0, 8).join('\n');
  for (const h of spec.head) if (!head.includes(h)) fail(file, `đầu file thiếu "${h}"`);
  const found = spec.sections.map(([re]) => lines.findIndex((l) => re.test(l)));
  spec.sections.forEach(([re, columns], k) => {
    if (found[k] < 0) return fail(file, `thiếu mục ${re}`);
    if (k && found[k] < found[k - 1]) fail(file, `mục ${re} sai thứ tự`);
    if (!columns) return;
    // Mục kế tiếp không có thì tìm bảng tới cuối file
    const end = found[k + 1] > 0 ? found[k + 1] : lines.length;
    const header = lines.slice(found[k], end).find((l) => l.startsWith('|'));
    if (!header) return fail(file, `mục ${re} không có bảng`);
    for (const c of columns) if (!header.includes(c)) fail(file, `bảng mục ${re} thiếu cột "${c}"`);
  });
}

// 2. README: cấu trúc phủ mọi mục ở gốc; Link đủ
const readme = readFileSync('README.md', 'utf8');
// File sẽ lên repo = git đang theo dõi + file mới chưa bị .gitignore (chạy cổng trước khi git add vẫn đúng)
const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).split('\n').filter(Boolean);
const trackedSet = new Set(tracked);
const roots = [...new Set(tracked.map((p) => (p.includes('/') ? `${p.split('/')[0]}/` : p)))];
const sectionOf = (title) => readme.split(new RegExp(`^## ${title}`, 'm'))[1]?.split(/^## /m)[0] ?? '';
// Chỉ ô đầu của từng dòng bảng — chữ trong đoạn văn dưới bảng không được tính
const listed = sectionOf('Cấu trúc repo').split('\n').filter((l) => l.startsWith('|')).map((l) => l.split('|')[1].trim());
for (const r of roots) if (!listed.includes(`\`${r}\``)) fail('README.md', `bảng Cấu trúc repo thiếu \`${r}\``);
const LAB4_COPY = /^(submission|specs|architecture|requirements|lab4|lab4-baseline)\/$/;
for (const r of roots.filter((x) => LAB4_COPY.test(x))) fail(r, 'thư mục giống bản chép gói LAB-4 — đề cấm chép (A-08)');
const linkSection = sectionOf('Link');
for (const marker of README_LINK_MARKERS) {
  if (!linkSection.includes(marker)) fail('README.md', `mục Link thiếu "${marker}"`);
}

// 3. Quét chung
const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const files = [...Object.keys(SPEC), ...walk('skills'), ...walk('premise-revisions')].filter((f) => f.endsWith('.md'));
const SELF = 'scripts/check-lab5.mjs'; // chứa chính các mẫu token bên dưới
const SECRET = /gh[pousr]_[A-Za-z0-9]{20,}|github_pat_|Bearer\s+[A-Za-z0-9]|Authorization:/;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const ALLOWED_EMAIL = /@(example\.com|users\.noreply\.github\.com)$/;
// #số không dính chữ / & / # phía trước, tối đa 4 chữ số (mã màu #123456 không tính); URL issue chỉ của repo này
const ISSUE_REF = /(?<![\w&/#])#(\d{1,4})(?!\w)|huongnv-0154\/lab5-yuki-coldchain-backlog\/issues\/(\d+)\b/g;
const issueNumbers = new Set(readJson('data/project-snapshot.json').items.map((i) => i.number));
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if (text.includes('〔TODO')) fail(file, 'còn dấu 〔TODO');
  if (text.includes('Demo-yuki')) fail(file, 'còn chuỗi Demo-yuki');
  for (const [, a, b] of text.matchAll(ISSUE_REF)) if (!issueNumbers.has(Number(a ?? b))) fail(file, `issue #${a ?? b} không có trên Project`);
  for (const m of text.match(/「[^」]{41,}」/g) ?? []) fail(file, `trích 「…」 dài ${m.length} ký tự — kiểm có phải câu RFP: ${m.slice(0, 30)}…`);
  for (const [, target] of text.matchAll(/\]\(((?!https?:|#|mailto:)[^)\s]+)\)/g)) {
    const path = normalize(join(dirname(file), target.split('#')[0])).replace(/\/$/, '');
    const inRepo = !path.startsWith('..') && (trackedSet.has(path) || tracked.some((t) => t.startsWith(`${path}/`)));
    if (!inRepo) fail(file, `link tương đối tới chỗ không lên repo (không có, ra ngoài repo hoặc bị .gitignore): ${target}`);
  }
}

// 4. Token / email trên mọi file sẽ lên repo (cả data, báo cáo HTML, script)
for (const file of tracked.filter((f) => f !== SELF && existsSync(f))) {
  const text = readFileSync(file, 'utf8');
  if (SECRET.test(text)) fail(file, 'có chuỗi giống token / header xác thực');
  for (const m of text.match(EMAIL) ?? []) if (!ALLOWED_EMAIL.test(m)) fail(file, `có email ${m}`);
}

for (const e of errors) console.log(`✗ ${e}`);
console.log(errors.length ? `FAIL: ${errors.length} lỗi` : `PASS: ${Object.keys(SPEC).length} file nộp, ${files.length} file markdown quét, ${tracked.length} file sẽ lên repo quét token / email, ${roots.length} mục ở gốc`);
process.exit(errors.length ? 1 : 0);
