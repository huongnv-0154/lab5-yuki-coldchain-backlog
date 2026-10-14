// Đọc / viết bảng markdown (GFM): đọc thành mảng object theo tiêu đề cột, viết từ mảng dòng; lọc câu trích RFP khỏi excerpt.

// Tách một dòng bảng thành ô; bỏ qua `|` nằm trong `code` và \| đã escape
export function splitRow(line) {
  const cells = [];
  let cur = '';
  let inCode = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '`') inCode = !inCode;
    if (ch === '\\' && line[i + 1] === '|') { cur += '|'; i++; continue; }
    if (ch === '|' && !inCode) { cells.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells.slice(1, -1); // bỏ ô rỗng trước | đầu và sau | cuối
}

// Mọi bảng có tiêu đề chứa đủ các cột `mustHave`; trả [{ line, row: {cột: ô} }] (line = số dòng của hàng, đếm từ 1)
export function readTables(markdown, mustHave) {
  const lines = markdown.split('\n');
  const out = [];
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].startsWith('|') || !/^\|[\s:-]+\|/.test(lines[i + 1])) continue;
    const head = splitRow(lines[i]);
    if (!mustHave.every((h) => head.includes(h))) continue;
    for (let j = i + 2; j < lines.length && lines[j].startsWith('|'); j++) {
      const cells = splitRow(lines[j]);
      out.push({ line: j + 1, row: Object.fromEntries(head.map((h, k) => [h, cells[k] ?? ''])) });
    }
  }
  return out;
}

// Câu trích tiếng Nhật trong 「」 dài ≥ 8 ký tự coi là trích RFP/đề → thay bằng dấu lược (repo public)
const JA = /[ぁ-んァ-ヶ一-龥]/;
export function scrubQuotes(text) {
  return text.replace(/「([^」]*)」/g, (m, body) => (body.length >= 8 && JA.test(body) ? '「…」' : m));
}

// Bỏ định dạng markdown, gọn khoảng trắng, cắt ≤ max ký tự
export function excerpt(text, max = 120) {
  const plain = scrubQuotes(text)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*|__|`/g, '')
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > max ? `${plain.slice(0, max - 1)}…` : plain;
}

// Viết bảng markdown từ tiêu đề và các dòng (mỗi dòng là mảng ô đã escape)
export const table = (head, rows) => [
  `| ${head.join(' | ')} |`,
  `|${head.map(() => '---').join('|')}|`,
  ...rows.map((r) => `| ${r.join(' | ')} |`),
].join('\n');
