#!/usr/bin/env node
// Vẽ burndown Sprint 1 thành SVG (không dependency) từ data/sprint-1-burndown.json, chú thích 3 sự kiện lệch lấy từ
// data/sprint-1-scenario.json + data/sprint-1-log.json. Nền trắng cố định để đọc được cả ở giao diện tối của GitHub.
// Dùng: node scripts/render-burndown-svg.mjs   → images/burndown-sprint-1.svg
import { mkdirSync, writeFileSync } from 'node:fs';
import { readJson } from './lib/gh-graphql.mjs';

const OUT = 'images/burndown-sprint-1.svg';
const days = readJson('data/sprint-1-burndown.json');
const scenario = readJson('data/sprint-1-scenario.json');
const numberOf = new Map(readJson('data/sprint-1-log.json').events.map((e) => [e.id, e.number]));
// Khung vẽ W × H; lề trái L, phải R, trên T, dưới B
const W = 760; const H = 400; const L = 56; const R = 24; const T = 64; const B = 56;
const finalPoint = days.at(-1);
const maxDay = finalPoint.day;
const yMax = Math.ceil(Math.max(...days.map((d) => d.scope)) / 20) * 20;
const x = (d) => L + (d / maxDay) * (W - L - R);
const y = (v) => T + (1 - v / yMax) * (H - T - B);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const path = (key) => days.map((d, i) => `${i ? 'L' : 'M'}${x(d.day).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ');

const out = [];
out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif">`);
out.push('<title id="t">Burndown Sprint 1 (giả lập)</title>');
out.push(`<desc id="d">SWP còn lại theo ngày: kế hoạch tuyến tính từ ${days[0].planned} về 0, mô phỏng còn ${finalPoint.actual} ở ngày ${maxDay}; phạm vi giảm từ ${days[0].scope} xuống ${finalPoint.scope}.</desc>`);
out.push(`<rect width="${W}" height="${H}" fill="#ffffff"/>`);
out.push(`<text x="${L}" y="26" font-size="16" font-weight="600" fill="#1f2328">Burndown Sprint 1 — giả lập 2026-11-30 → 2026-12-11</text>`);

// Sự kiện: dải chặn và vạch ngày
for (const b of scenario.block) {
  const left = x(b.fromDay - 1);
  out.push(`<rect x="${left}" y="${T}" width="${x(b.toDay) - left}" height="${H - T - B}" fill="#fff4e5"/>`);
  out.push(`<text x="${left + 4}" y="${T + 28}" font-size="11" fill="#9a6700">${esc(b.ids.map((id) => `#${numberOf.get(id)}`).join(', '))} Blocked: tenant IdP trễ</text>`);
}
const marks = [
  ...scenario.reopen.map((r) => ({ day: r.day, text: `#${numberOf.get(r.id)} mở lại (lỗi hồi quy)` })),
  ...scenario.carry.map((c) => ({ day: c.day, text: `#${numberOf.get(c.id)} → Sprint 2` })),
];
marks.forEach((m, i) => {
  out.push(`<line x1="${x(m.day)}" y1="${T}" x2="${x(m.day)}" y2="${H - B}" stroke="#8250df" stroke-dasharray="3 3"/>`);
  out.push(`<text x="${x(m.day) - 4}" y="${T + 46 + i * 16}" font-size="11" text-anchor="end" fill="#8250df">${esc(m.text)}</text>`);
});

// Lưới và trục
for (let v = 0; v <= yMax; v += 20) {
  out.push(`<line x1="${L}" y1="${y(v)}" x2="${W - R}" y2="${y(v)}" stroke="#d0d7de" stroke-width="${v ? 0.6 : 1}"/>`);
  out.push(`<text x="${L - 8}" y="${y(v) + 4}" font-size="11" text-anchor="end" fill="#57606a">${v}</text>`);
}
for (const d of days) out.push(`<text x="${x(d.day)}" y="${H - B + 18}" font-size="11" text-anchor="middle" fill="#57606a">${d.day}</text>`);
out.push(`<text x="${(L + W - R) / 2}" y="${H - 14}" font-size="12" text-anchor="middle" fill="#57606a">Ngày làm việc</text>`);
const plotMidY = (T + H - B) / 2;
out.push(`<text x="16" y="${plotMidY}" font-size="12" text-anchor="middle" fill="#57606a" transform="rotate(-90 16 ${plotMidY})">SWP còn lại</text>`);

// Đường
out.push(`<path d="${path('scope')}" fill="none" stroke="#bf8700" stroke-width="1.5" stroke-dasharray="2 4"/>`);
out.push(`<path d="${path('planned')}" fill="none" stroke="#8c959f" stroke-width="2" stroke-dasharray="6 4"/>`);
out.push(`<path d="${path('actual')}" fill="none" stroke="#0969da" stroke-width="2.5"/>`);
for (const d of days) out.push(`<circle cx="${x(d.day)}" cy="${y(d.actual)}" r="3.5" fill="#0969da"><title>Ngày ${d.day}: còn ${d.actual} SWP</title></circle>`);
out.push(`<text x="${x(maxDay) - 8}" y="${y(finalPoint.actual) + 18}" font-size="12" font-weight="600" text-anchor="end" fill="#0969da">còn ${finalPoint.actual}</text>`);

// Chú giải
const legend = [['#0969da', 'Mô phỏng', ''], ['#8c959f', 'Kế hoạch tuyến tính', '6 4'], ['#bf8700', 'Phạm vi sprint', '2 4']];
legend.forEach(([color, label, dash], i) => {
  const lx = L + i * 180;
  out.push(`<line x1="${lx}" y1="44" x2="${lx + 28}" y2="44" stroke="${color}" stroke-width="2.5"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`);
  out.push(`<text x="${lx + 34}" y="48" font-size="12" fill="#1f2328">${label}</text>`);
});
out.push('</svg>');

mkdirSync('images', { recursive: true });
writeFileSync(OUT, `${out.join('\n')}\n`);
console.log(`${OUT}: ${days.length} điểm, phạm vi ${days[0].scope} → ${finalPoint.scope} SWP, còn ${finalPoint.actual}`);
