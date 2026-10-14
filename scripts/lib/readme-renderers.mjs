// Khối GENERATED của README.md: dòng kết quả mở thử không đăng nhập (incognito-check, đọc data/public-access-check.json
// do check-public-access.mjs ghi) và bảng Spec → epic (spec-to-epic), sinh từ data/sources.json (nguồn LAB-4 đã gắn epic),
// data/backlog.json (epic, dòng PREMISE theo issue, nhãn ràng buộc) và data/swp-scores.final.json. Đường dẫn spec bỏ
// tiền tố submission/lab4/.
import { table } from './markdown-table.mjs';
import { EPICS } from './epic-map.mjs';

const ISSUES = 'https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues';
const CONSTRAINT = 'constraint:driver-hours-2024';
const ADR_LABEL = '`architecture/adr/`';
const count = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);

// Nhóm một file nguồn thành nhãn ngắn: thư mục feature, api / database theo feature, file dùng chung, ADR…
function specGroup(file, id) {
  const f = file.replace(/^submission\/lab4\//, '');
  if (f === 'specs/_common/deviation-table.md') return 'bảng chênh lệch `specs/_common/deviation-table.md` (task L5)';
  if (f === 'specs/_common/traceability.md') return '`specs/_common/traceability.md` (mã yêu cầu)';
  if (f === 'submission/lab3/feature-list.md') return 'LAB-3 `feature-list.md` (chức năng F)';
  if (f.startsWith('architecture/adr/')) return `${ADR_LABEL} ${id}`;
  if (f === 'architecture/target-architecture.md') return '`architecture/target-architecture.md`';
  const design = f.match(/^specs\/system-design\/(api|database)-design\/(?:([\w-]+)\/)?/);
  if (design) return `\`specs/system-design/${design[1]}-design/${design[2] ? `${design[2]}/` : ''}\``;
  const common = f.match(/^specs\/_common\/([\w-]+\.md)$/);
  if (common) return `\`specs/_common/${common[1]}\``;
  const feature = f.match(/^specs\/([\w-]+)\//);
  return feature ? `\`specs/${feature[1]}/\`` : `\`${f}\``;
}

// Cột Spec của một epic: nhóm file nguồn kèm số lượng, mã ADR gom về một nhãn, rồi các dòng PR-S-* của PREMISE
function epicSpecs(epic, sources, own) {
  const groups = new Map();
  for (const s of sources.filter((x) => x.epic === epic && x.file)) count(groups, specGroup(s.file, s.id));
  const adrs = [...groups.keys()].filter((k) => k.startsWith(ADR_LABEL)).map((k) => k.split(' ').pop()).sort();
  const specs = [...groups].filter(([k]) => !k.startsWith(ADR_LABEL)).map(([k, n]) => `${k} ×${n}`);
  if (adrs.length) specs.push(`${ADR_LABEL} ${adrs.join(', ')}`);
  const prs = [...new Set(own.flatMap((i) => i.body?.premise ?? []).filter((p) => p.startsWith('PR-S-')))].sort();
  if (prs.length) specs.push(`PREMISE ${prs.join(', ')}`);
  return specs;
}

// Cột Ghi chú của một epic: số issue lá và SWP, nhãn ràng buộc giờ lái xe, riêng E-15 thêm lý do không có spec
function epicNotes(epic, own, leafSWP) {
  const leaves = own.filter((i) => leafSWP.has(i.number));
  const notes = [`${leaves.length} issue lá · ${leaves.reduce((t, i) => t + leafSWP.get(i.number), 0)} SWP`];
  const constrained = own.filter((i) => i.labels.includes(CONSTRAINT)).length;
  if (constrained) notes.push(`ràng buộc đặc thù: giới hạn giờ lái xe tải từ 2024 — ${constrained} issue mang nhãn \`${CONSTRAINT}\` (task-breakdown.md mục 3)`);
  if (epic === 'E-15') notes.push('câu hỏi gửi khách, không có spec riêng — nguồn là chỗ để ngỏ của gói LAB-4');
  return notes.join('; ');
}

export const readmeRenderers = {
  // Dòng "đã mở thử bằng cửa sổ ẩn danh": kết quả GET không đăng nhập của scripts/check-public-access.mjs
  'incognito-check': ({ data }) => {
    const check = data('public-access-check');
    const parts = check.results.map((r) => `${r.name} ${r.status ?? 'lỗi mạng'} ${r.ok ? '✓' : '✗'}`);
    return `Đã mở thử không đăng nhập (như cửa sổ ẩn danh — ${check.method}), ${check.checkedAt.slice(0, 16).replace('T', ' ')} UTC: ${parts.join(' · ')}.`;
  },

  'spec-to-epic': ({ data }) => {
    const sources = data('sources').items;
    const items = data('backlog').items;
    const leafSWP = new Map(data('swp-scores.final').filter((s) => !s.container).map((s) => [s.number, s.finalSWP]));
    const rows = Object.entries(EPICS).map(([epic, name]) => {
      const own = items.filter((i) => i.epicId === epic);
      const epicItem = own.find((i) => i.kind === 'epic');
      return [
        epicSpecs(epic, sources, own).join(' · ') || '—',
        `[#${epicItem.number}](${ISSUES}/${epicItem.number}) — ${epic} ${name}`,
        epicNotes(epic, own, leafSWP),
      ];
    });
    return table(['Spec (file LAB-4 tại `c3cf20d` hoặc dòng PREMISE)', 'Epic trên Project', 'Ghi chú'], rows);
  },
};
