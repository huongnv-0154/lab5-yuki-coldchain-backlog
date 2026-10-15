// Bảng của task-breakdown.md §2–4, sinh từ data/sources.json, data/backlog.json, data/gaps.json.
// Issue đã có số → link GitHub; chưa có → id backlog dạng code.
import { table } from './markdown-table.mjs';
import { EPICS } from './epic-map.mjs';

const ISSUES = 'https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues';
const PREMISE = 'PREMISE.md';
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const short = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const KIND = {
  l5: 'task L5', 'design-only-spec': 'màn chỉ thiết kế', 'design-only-func': 'module chỉ thiết kế', 'design-only-tech': 'xử lý chỉ thiết kế',
  'design-only-api': 'API đích', 'design-only-db': 'DB đích', requirement: 'yêu cầu chưa đủ', function: 'chức năng chưa làm / mock',
  environment: 'môi trường', nfr: 'cơ chế NFR', interface: 'giao diện ngoài', 'open-question': 'câu hỏi mở kiến trúc', adr: 'ADR',
};

function context(data) {
  const { items, notIssued } = data('backlog');
  const byId = new Map(items.map((i) => [i.id, i]));
  const link = (id) => {
    const it = byId.get(id);
    return it?.number ? `[#${it.number}](${ISSUES}/${it.number}) ${id}` : `\`${id}\``;
  };
  const bySource = new Map();
  for (const it of items) for (const s of it.body?.sources || []) bySource.set(s.id, [...(bySource.get(s.id) || []), it]);
  return { items, byId, link, bySource, notIssued: new Map(notIssued.map((x) => [x.id, x.reason])) };
}

// Issue nhận nguồn: hiện issue gốc (không phải sub) kèm số sub cùng nhận nguồn; sub mà cha không nhận nguồn thì hiện riêng
function issueCell(list, link) {
  const roots = list.filter((it) => !it.id.includes('.'));
  const subs = list.filter((it) => it.id.includes('.'));
  if (!roots.length) return subs.map((it) => link(it.id)).join(', ');
  const rootCells = roots.map((r) => {
    const own = subs.filter((s) => s.parentId === r.id).length;
    return `${link(r.id)}${own ? ` (+${own} sub)` : ''}`;
  });
  const strays = subs.filter((s) => !roots.some((r) => r.id === s.parentId)).map((s) => link(s.id));
  return [...rootCells, ...strays].join(', ');
}

function whyNotIssued(src, notIssued) {
  if (src.mergedInto) return `Gộp vào ${src.mergedInto} (bảng chênh lệch LAB-4)`;
  // Có lý do riêng của job (vd. việc dựng thật nằm ở epic khác) thì dùng lý do đó thay cho câu chung
  if (src.notATask) return notIssued.get(src.id) ?? 'Bảng chênh lệch LAB-4 ghi "không phải task" (chỉ xác nhận)';
  if (src.project && /^ACC-/.test(src.id)) return 'Tiêu chí nghiệm thu — kiểm ở UAT (việc dự án, PR-D-02); chức năng liên quan đã có issue ở epic nghiệp vụ';
  if (src.project) return 'Việc vận hành / quản trị dự án, không đến từ detail design (PR-D-02)';
  if (src.kind === 'adr' && !src.epic) return 'Quy ước kiến trúc — áp vào DoD của mọi issue, không thành issue riêng';
  return notIssued.get(src.id) ?? 'Chưa có lý do';
}

const HEAD = ['Spec (mã LAB-4 · loại — tóm tắt)', 'Epic', 'Issue / sub-issue', 'Phần spec chưa thành issue và vì sao'];
const specCell = (s) => cell(`${s.ref ?? s.id} · ${KIND[s.kind] ?? s.kind} — ${s.excerpt}`);

export const breakdownRenderers = {
  // §2 Spec → issue: một bảng con mỗi epic, rồi một bảng cho nguồn không thành issue
  'spec-to-issue': ({ data }) => {
    const { link, bySource, notIssued } = context(data);
    const sources = data('sources').items;
    const out = [];
    for (const [epic, name] of Object.entries(EPICS)) {
      const rows = sources.filter((s) => s.epic === epic && bySource.has(s.id)).map((s) => [specCell(s), epic, issueCell(bySource.get(s.id), link), '—']);
      if (rows.length) out.push(`#### ${epic} ${name} — ${rows.length} nguồn`, '', table(HEAD, rows), '');
    }
    const orphan = sources.filter((s) => !bySource.has(s.id)).map((s) => [specCell(s), s.epic ?? '—', '—', cell(whyNotIssued(s, notIssued))]);
    out.push(`#### Nguồn không thành issue — ${orphan.length} nguồn`, '', table(HEAD, orphan));
    return out.join('\n');
  },

  // §3 Ràng buộc giờ lái xe tải 2024: issue gốc mang nhãn, kèm số sub cùng mang nhãn
  'driver-hours': ({ data }) => {
    const { items, link } = context(data);
    const labelled = items.filter((it) => it.labels.includes('constraint:driver-hours-2024'));
    const rows = labelled.filter((it) => !it.id.includes('.')).map((it) => {
      const ids = (it.body.sources || []).map((s) => s.id);
      const refs = ids.slice(0, 3).join(', ') + (ids.length > 3 ? ` +${ids.length - 3}` : '');
      const subs = labelled.filter((s) => s.parentId === it.id).length;
      return [cell(`Giới hạn giờ lái xe tải 2024 (${refs || '—'})`), `${link(it.id)}${subs ? ` (+${subs} sub)` : ''} ${cell(short(it.title, 60))}`,
        cell(it.body.constraintWhy ?? it.body.goal ?? '')];
    });
    return table(['Ràng buộc', 'Issue', 'Vì sao tách riêng'], rows);
  },

  // §4 Chỗ hở / mâu thuẫn phát hiện khi break
  gaps: ({ data }) => {
    const { link } = context(data);
    const refLinks = (ref) => (ref ? ref.split(/,\s*/).map(link).join(', ') : '');
    const handle = (g) => {
      const text = {
        premise: `Đã sửa thiết kế — [${g.premise}](${PREMISE}) · ${refLinks(g.ref)}`,
        assumption: `Giả định — [${g.premise}](${PREMISE}) · ${refLinks(g.ref)}`,
        'clarify-issue': `Tạo issue làm rõ — ${refLinks(g.ref)}`,
        open: `Để mở — ${g.note ?? ''}${g.ref ? ` (${refLinks(g.ref)})` : ''}`,
      }[g.handling];
      if (!text) throw new Error(`${g.id}: cách xử lý lạ "${g.handling}"`);
      return text;
    };
    const rows = data('gaps').gaps.map((g) => [g.id, cell(short(g.spec, 70)), cell(g.text), cell(handle(g))]);
    return table(['Mã', 'Spec', 'Chỗ hở / mâu thuẫn', 'Xử lý'], rows);
  },
};
