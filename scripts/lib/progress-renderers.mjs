// Bảng của progress-report.md: §1 trạng thái theo sprint (từ snapshot Project) và §2 burndown (từ data/sprint-1-burndown.json).
import { table } from './markdown-table.mjs';

const STATUS_ORDER = ['Todo', 'In Progress', 'Blocked', 'Done'];
const sum = (xs) => xs.reduce((a, b) => a + (b ?? 0), 0);
const num = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1)).replace('.', ',');
const leaves = (items) => items.filter((i) => i.subIssueNumbers.length === 0);
const isQuestion = (i) => /^E15-/.test(i.title);

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
    rows.push(['**Tổng**', `**${pool.length}**`, `**${num(sum(pool.map((i) => i.storyPoint)))}**`, `snapshot ${snapshot.fetchedAt.slice(0, 16)}Z`]);
    return table(['Trạng thái', 'Số issue', 'Tổng SWP', 'Ghi chú'], rows);
  },

  // §2 Burndown: SWP còn lại theo kế hoạch (tuyến tính) và thực tế cuối mỗi ngày; phạm vi đổi khi chuyển issue sang sprint sau
  burndown: ({ data }) => {
    const days = data('sprint-1-burndown');
    const rows = days.map((d) => {
      const diff = d.actual - d.planned;
      return [d.day === 0 ? '0 (đầu sprint)' : String(d.day), d.date ?? '—', num(d.planned), num(d.actual),
        `${diff > 0 ? '+' : ''}${num(Math.round(diff * 10) / 10)}`, num(d.scope)];
    });
    return table(['Ngày', 'Ngày lịch', 'Kế hoạch còn lại (SWP)', 'Thực tế còn lại (SWP)', 'Chênh', 'Phạm vi (SWP)'], rows);
  },
};
