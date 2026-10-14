#!/usr/bin/env node
// Mở thử repo, Project và báo cáo HTML KHÔNG đăng nhập (như cửa sổ ẩn danh): GET không kèm cookie / token, ghi mã HTTP
// và có thấy dấu nhận biết của trang hay không vào data/public-access-check.json (README.md đọc file này).
// Dùng: node scripts/check-public-access.mjs   (exit 1 nếu có trang không mở được)
import { writeJson } from './lib/gh-graphql.mjs';

const TARGETS = [
  { name: 'Repo', url: 'https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog', expect: 'lab5-yuki-coldchain-backlog' },
  { name: 'GitHub Project', url: 'https://github.com/users/huongnv-0154/projects/2', expect: 'projects/2' },
  { name: 'Báo cáo HTML (raw)', url: 'https://raw.githubusercontent.com/huongnv-0154/lab5-yuki-coldchain-backlog/main/swp-report/report.html', expect: 'report-data' },
];

const results = [];
for (const t of TARGETS) {
  try {
    const res = await fetch(t.url, { redirect: 'follow', headers: { 'user-agent': 'lab5-public-access-check' } });
    const body = await res.text();
    results.push({ name: t.name, url: t.url, status: res.status, ok: res.status === 200 && body.includes(t.expect) });
  } catch (err) {
    results.push({ name: t.name, url: t.url, status: null, ok: false, error: err.message.slice(0, 120) });
  }
}
writeJson('data/public-access-check.json', { checkedAt: new Date().toISOString(), method: 'GET không cookie, không token', results });
for (const r of results) console.log(`${r.ok ? '✓' : '✗'} ${r.name}: ${r.status ?? r.error}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
