// Block của progress-report.md: §1 trạng thái theo sprint (từ snapshot Project), §2 burndown (từ data/sprint-1-burndown.json),
// §3 dự báo tới mốc (văn xuôi, từ data/milestone-projection.json) và thời điểm snapshot cho phần ghi chú kỹ thuật.
import { table } from './markdown-table.mjs';

const STATUS_ORDER = ['Todo', 'In Progress', 'Blocked', 'Done'];
const sum = (xs) => xs.reduce((a, b) => a + (b ?? 0), 0);
const num = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1)).replace('.', ',');
const leaves = (items) => items.filter((i) => i.subIssueNumbers.length === 0);
const isQuestion = (i) => /^E15-/.test(i.title);
const ROLE_NAME = { 'QA (Auto)': 'QA tự động', 'QA (Manual)': 'QA thủ công' };
const roleName = (g) => ROLE_NAME[g] ?? g;
const pct = (focus) => `${Math.round(focus * 100)}%`;
const monthVi = (ym) => `${Number(ym.slice(5))}/${ym.slice(0, 4)}`; // '2027-04' → '4/2027'
const listVi = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} và ${xs.at(-1)}`);

// Ghi chú: nhóm nhỏ liệt kê số issue; nhóm có câu hỏi khách E-15 thì đếm riêng
function note(group) {
  const questions = group.filter(isQuestion).length;
  const parts = [];
  if (questions) parts.push(`${questions} câu hỏi khách E-15 chờ trả lời`);
  if (group.length && group.length <= 8) parts.push(group.map((i) => `#${i.number}`).join(', '));
  return parts.join(' · ');
}

export const progressRenderers = {
  // §1 Trạng thái các issue lá của một Iteration (options.sprint) theo snapshot
  'status-summary': ({ snapshot, options }) => {
    const pool = leaves(snapshot.items).filter((i) => !options.sprint || i.sprint === options.sprint);
    const rows = STATUS_ORDER.map((s) => {
      const group = pool.filter((i) => (i.status ?? 'Todo') === s);
      return [s, String(group.length), num(sum(group.map((i) => i.storyPoint))), note(group)];
    });
    rows.push(['**Tổng**', `**${pool.length}**`, `**${num(sum(pool.map((i) => i.storyPoint)))}**`, '']);
    return table(['Trạng thái', 'Số issue', 'Tổng SWP', 'Ghi chú'], rows);
  },

  // §2 Burndown: SWP còn lại theo kế hoạch (tuyến tính) và theo kịch bản mô phỏng cuối mỗi ngày; phạm vi đổi khi chuyển issue sang sprint sau
  burndown: ({ data }) => {
    const days = data('sprint-1-burndown');
    const rows = days.map((d) => {
      const diff = d.actual - d.planned;
      return [d.day === 0 ? '0 (đầu sprint)' : String(d.day), d.date ?? '—', num(d.planned), num(d.actual),
        `${diff > 0 ? '+' : ''}${num(Math.round(diff * 10) / 10)}`, num(d.scope)];
    });
    return table(['Ngày', 'Ngày lịch', 'Kế hoạch còn lại (SWP)', 'Mô phỏng còn lại (SWP)', 'Chênh', 'Phạm vi (SWP)'], rows);
  },

  // §3 Dự báo tới mốc: văn xuôi (không dòng bảng — bảng đầu tiên của §3 phải là bảng rủi ro)
  'milestone-projection': ({ data }) => {
    const p = data('milestone-projection');
    const [full, ...rest] = p.runs;
    const gap = (md) => (md >= 0 ? `dư ${num(md)} MD` : `thiếu ${num(-md)} MD`);
    const focusText = (r) => `dành ${pct(r.focus)} giờ cho issue${r.focus === p.sprint1Focus ? ' (như Sprint 1)' : ''}`;
    const lines = [
      `**Dự báo tới ${p.milestone} (${p.window.to}).** Sau Sprint 1 còn ${num(p.remaining.hours)} giờ việc (${num(p.remaining.md)} MD, 1 MD = ${p.hoursPerMD} giờ). `
        + `Năng lực từ ${p.window.from} tới ${p.milestone} theo kế hoạch nhân sự của bản đề xuất, trừ PM (${p.window.workdays} ngày làm việc theo lịch Nhật): `
        + p.runs.map((r) => `${num(r.capacityHours)} giờ nếu ${focusText(r)}`).join(', ') + '.',
      '',
      'Dồn chung mọi vai thì ' + p.runs.map((r) => `${gap(r.marginMD)} ở ${pct(r.focus)} (xong khoảng ${r.finishDatePooled})`).join(', ') + '.',
    ];
    const short = full.shortRoles.map(roleName);
    if (short.length) {
      const spare = Object.entries(full.byRole).filter(([, v]) => v.marginMD > 0).sort((x, y) => y[1].marginMD - x[1].marginMD)
        .slice(0, 2).map(([g]) => roleName(g));
      lines.push('', `Tách theo vai thì không kịp ngay cả ở ${pct(full.focus)}: `
        + full.shortRoles.map((g) => `${roleName(g)} ${gap(full.byRole[g].marginMD)} (xong khoảng ${full.byRole[g].finishDate})`).join(', ') + '. '
        + rest.map((r) => `Ở ${pct(r.focus)}: ${r.shortRoles.map((g) => `${roleName(g)} xong khoảng ${r.byRole[g].finishDate}`).join(', ')}.`).join(' ')
        + ` Phần dư nhiều nhất nằm ở ${listVi(spare)}, không chuyển ngay sang ${listVi(short)} được.`
        + ` Ngày xong sau tháng ${monthVi(p.lastStaffingMonth)} tính với mức nhân sự tháng ${monthVi(p.lastStaffingMonth)}.`);
    }
    // Biến thể chặt hơn: vai viết code phải xong trước khi pha phát triển của bản đề xuất kết thúc
    const cw = p.codePhaseWindow;
    const codeGap = (g) => p.runs.map((r) => `${gap(r.codePhase[g].marginMD)} ở ${pct(r.focus)}`).join(', ');
    lines.push('', `Nếu phần code phải xong trước khi pha phát triển của bản đề xuất kết thúc (${cw.to}, ${cw.workdays} ngày làm việc), `
      + `Backend ${codeGap('Backend')}; Frontend ${codeGap('Frontend')}.`);
    lines.push('', 'Giả định chính: kế hoạch nhân sự của bản đề xuất còn gánh cả diễn tập chuyển đổi dữ liệu và giai đoạn test, nên năng lực thật cho backlog thấp hơn các số trên — phần thiếu thực tế còn lớn hơn.');
    return lines.join('\n');
  },

  // Thời điểm lấy snapshot Project (đưa xuống phần ghi chú kỹ thuật, không để trong bảng §1)
  'snapshot-time': ({ snapshot }) => `Bảng §1 sinh từ snapshot Project lúc ${snapshot.fetchedAt.slice(0, 16)}Z.`,
};
