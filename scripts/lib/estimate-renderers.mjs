// Bảng của estimate.md §1–4, sinh từ data/swp-review.json, data/hours-calibration.json, data/swp-scores.final.json, data/hours.final.json,
// data/backlog.json và data/lab1-comparison.json. Cột "Vì sao" ở §4 lấy từ lab1-comparison.json (viết tay).
import { table } from './markdown-table.mjs';
import { EPICS } from './epic-map.mjs';

const ISSUES = 'https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues';
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const num = (n, digits = 1) => (Number.isInteger(n) ? String(n) : n.toFixed(digits)).replace('.', ',');
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const round1 = (n) => Math.round(n * 10) / 10;
const manDays = (hours) => round1(hours / 8);
const md = (hours) => num(manDays(hours));

// Theo epic: số lá, số story, tổng SWP / giờ của lá (container không cộng lần hai)
function epicTotals(data) {
  const items = data('backlog').items;
  const scoreByNumber = new Map(data('swp-scores.final').map((r) => [r.number, r]));
  const hoursByNumber = new Map(data('hours.final').map((r) => [r.number, r.hours]));
  return Object.keys(EPICS).map((epic) => {
    const own = items.filter((i) => i.epicId === epic);
    const leaves = own.filter((i) => !scoreByNumber.get(i.number).container);
    return {
      epic, leaves: leaves.length, stories: own.filter((i) => i.kind === 'story').length,
      swp: sum(leaves.map((i) => scoreByNumber.get(i.number).finalSWP)), hours: sum(leaves.map((i) => hoursByNumber.get(i.number))),
    };
  });
}

export const estimateRenderers = {
  // §1 Issue mẫu skill chọn để kiểm (5 đại diện) và điểm đã chốt
  'swp-representatives': ({ data }) => {
    const review = data('swp-review');
    const rows = review.representatives.map((r) => [
      `[#${r.number}](${ISSUES}/${r.number}) ${cell(r.title)}`,
      `${r.skillScope} × ${r.skillComplexity} → **${r.skillSWP}** (${r.skillLevel})`,
      r.witnessSWP == null ? '— (không thuộc tập chấm lại)' : String(r.witnessSWP),
      `${r.changed ? 'Sửa' : 'Giữ'}: ${r.verdictScope} × ${r.verdictComplexity} → **${r.verdictSWP}** (${r.verdictLevel})`,
      cell(r.reason),
    ]);
    return table(['Issue', 'Skill chấm (Scope × Complexity → SWP)', 'Assessor 2', 'Bạn chốt', 'Lý do'], rows);
  },

  // §2 Bộ 6 issue hiệu chuẩn hệ số k (DR-06)
  'hours-calibration': ({ data }) => {
    const cal = data('hours-calibration');
    const rows = cal.calibrationIssues.map((c) => [`[#${c.number}](${ISSUES}/${c.number}) ${cell(c.id)}`, c.owner, `${c.scope} × ${c.complexity}`,
      String(c.swp), num(c.hours), num(c.hoursPerSWP, 2), cell(c.breakdown)]);
    rows.push(['**Tổng**', '', '', `**${cal.sumSWP}**`, `**${num(cal.sumHours)}**`, `**${num(cal.kRaw, 2)} → k = ${num(cal.k)}**`, '']);
    return table(['Issue', 'Vai', 'Scope × Complexity', 'SWP', 'Giờ ước', 'Giờ/SWP', 'Chia theo bước'], rows);
  },

  // §3 Tổng theo epic
  'estimate-by-epic': ({ data }) => {
    const totals = epicTotals(data);
    const rows = totals.map((t) => [`${t.epic} ${EPICS[t.epic]}`, String(t.leaves), String(t.swp), num(t.hours),
      `${t.stories} story · ${md(t.hours)} MD`]);
    const all = { leaves: sum(totals.map((t) => t.leaves)), swp: sum(totals.map((t) => t.swp)), hours: sum(totals.map((t) => t.hours)) };
    rows.push(['**Tổng**', `**${all.leaves}**`, `**${all.swp}**`, `**${num(all.hours)}**`, `**${md(all.hours)} MD**`]);
    return table(['Epic', 'Số issue (lá)', 'Tổng SWP', 'Tổng giờ', 'Ghi chú'], rows);
  },

  // §4 So với estimate LAB-1 (MD; LAB-5 MD = giờ / 8)
  'estimate-vs-lab1': ({ data }) => {
    const byEpic = new Map(epicTotals(data).map((t) => [t.epic, t]));
    const cmp = data('lab1-comparison');
    const parts = cmp.rows.map((r) => ({ ...r, hours: sum(r.epics.map((e) => byEpic.get(e).hours)) }))
      .map((p) => ({ ...p, lab5Md: manDays(p.hours) }));
    const rows = parts.map((p) => {
      const diff = round1(p.lab5Md - p.lab1Md);
      return [cell(p.part), num(p.lab1Md), num(p.lab5Md), `${diff > 0 ? '+' : ''}${num(diff)}`, cell(p.why)];
    });
    const lab1Total = sum(parts.map((p) => p.lab1Md));
    // Tổng LAB-5 quy từ tổng giờ (không cộng các dòng đã làm tròn) để khớp §3
    const lab5Total = manDays(sum(parts.map((p) => p.hours)));
    rows.push(['**Tổng**', `**${num(round1(lab1Total))}**`, `**${num(round1(lab5Total))}**`, `**${num(round1(lab5Total - lab1Total))}**`, cell(cmp.totalWhy)]);
    return table(['Phần', 'LAB-1 (MD)', 'LAB-5 (MD)', 'Chênh', 'Vì sao'], rows);
  },
};
