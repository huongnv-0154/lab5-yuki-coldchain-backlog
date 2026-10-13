// Nguồn backlog từ kiến trúc đích LAB-4 (target-architecture.md): môi trường, NFR → cơ chế, giao diện ngoài, câu hỏi mở.
// id có tiền tố (env: / nfr: / if: / arch-q:) để không trùng mã yêu cầu của bảng truy vết; nfr: và if: có thêm `ref` giữ mã gốc.
import { readTables, excerpt } from './markdown-table.mjs';
import { epicOfRequirement } from './epic-map.mjs';

export function mineArchitecture(markdown, file) {
  const items = [];
  const item = (it) => items.push({ confidence: 'INFERRED', file, ...it });
  for (const { line, row } of readTables(markdown, ['Môi trường', 'Mục đích'])) {
    item({ id: `env:${row['Môi trường']}`, kind: 'environment', excerpt: excerpt(`${row['Mục đích']} · ${row['Dữ liệu']}`), anchor: `L${line}`, epic: 'E-14', epicBy: 'arch-section', confidence: 'EXTRACTED' });
  }
  for (const { line, row } of readTables(markdown, ['NFR (RFP)', 'Cơ chế đích'])) {
    const ref = row['NFR (RFP)'].split(' ')[0];
    item({ id: `nfr:${ref}`, ref, kind: 'nfr', excerpt: excerpt(row['Cơ chế đích']), anchor: `L${line}`, epic: epicOfRequirement(ref), epicBy: 'req-prefix' });
  }
  for (const { line, row } of readTables(markdown, ['Câu hỏi', 'Ở đâu'])) {
    item({ id: `arch-q:${row['#']}`, kind: 'open-question', excerpt: excerpt(row['Câu hỏi']), anchor: `L${line}`, epic: 'E-15', epicBy: 'arch-section' });
  }
  for (const [index, text] of markdown.split('\n').entries()) {
    const ref = text.match(/^\| (IF-[A-Z]+-\d+) \|/)?.[1];
    if (ref) item({ id: `if:${ref}`, ref, kind: 'interface', excerpt: excerpt(text.split('|')[2] || ''), anchor: `L${index + 1}`, epic: epicOfRequirement(ref), epicBy: 'req-prefix' });
  }
  return items;
}
