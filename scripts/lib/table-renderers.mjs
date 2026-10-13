// Bộ sinh bảng cho các block <!-- GENERATED:<tên> --> trong 6 file nộp.
// Mỗi renderer nhận ctx { snapshot, data(name), options } (options = k=v ghi trong thẻ GENERATED) và trả markdown;
// phase sau thêm renderer vào đây.

const STATUS_ORDER = ['Todo', 'In Progress', 'Blocked', 'Done'];
const sum = (xs) => xs.reduce((a, b) => a + (b ?? 0), 0);
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export const table = (head, rows) => [
  `| ${head.join(' | ')} |`,
  `|${head.map(() => '---').join('|')}|`,
  ...rows.map((r) => `| ${r.join(' | ')} |`),
].join('\n');

// Item lá = không có sub-issue; SWP chỉ cộng trên lá để cha không bị đếm hai lần
export const leaves = (items) => items.filter((i) => i.subIssueNumbers.length === 0);

export const renderers = {
  // Trạng thái theo snapshot (progress-report §1); --sprint lọc theo iteration
  'status-summary': ({ snapshot, options }) => {
    const pool = leaves(snapshot.items).filter((i) => !options.sprint || i.sprint === options.sprint);
    const rows = STATUS_ORDER.map((s) => {
      const group = pool.filter((i) => (i.status ?? 'Todo') === s);
      return [s, String(group.length), fmt(sum(group.map((i) => i.storyPoint))), ''];
    });
    rows.push(['**Tổng**', `**${pool.length}**`, `**${fmt(sum(pool.map((i) => i.storyPoint)))}**`, `snapshot ${snapshot.fetchedAt.slice(0, 16)}Z`]);
    return table(['Trạng thái', 'Số issue', 'Tổng SWP', 'Ghi chú'], rows);
  },
};
