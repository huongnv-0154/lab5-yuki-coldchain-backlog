#!/usr/bin/env node
// Tạo/cập nhật bộ nhãn của repo (gh label create --force: chạy lại không lỗi).
// Dùng: node scripts/create-labels.mjs [--dry-run]
import { execFileSync } from 'node:child_process';
import { parseArgs, REPO } from './lib/gh-graphql.mjs';

const dry = Boolean(parseArgs()['dry-run']);
const EPICS = Array.from({ length: 15 }, (_, i) => `E-${String(i + 1).padStart(2, '0')}`);

const LABELS = [
  ['type:epic', '5319e7', 'Epic — nhóm chức năng FG LAB-1 hoặc epic nền'],
  ['type:story', '1d76db', 'Issue cấp giữa, có giá trị nghiệp vụ'],
  ['type:task', '0e8a16', 'Việc lá ≤ 16 giờ'],
  ...['BE', 'FE', 'QA', 'Infra', 'PM', 'BrSE', 'Design'].map((t) => [`team:${t}`, 'c5def5', `Đội ${t}`]),
  ...EPICS.map((e) => [`epic:${e}`, 'ededed', `Thuộc epic ${e}`]),
  ['constraint:driver-hours-2024', 'b60205', 'Chịu ràng buộc giới hạn giờ lái xe tải từ 2024 (Product B)'],
  ['src:l5', 'fbca04', 'Từ bảng chênh lệch LAB-4 (mã L5-xxx)'],
  ['src:design-only', 'fbca04', 'Màn/chức năng LAB-4 chỉ có thiết kế, chưa dựng'],
  ['src:integration', 'fbca04', 'Giao diện ngoài (IF-xxx)'],
  ['src:hardening', 'fbca04', 'Nâng prototype lên mức production (NFR)'],
  ['src:clarify', 'fbca04', 'Issue làm rõ với khách (chỗ hở spec)'],
  ['graded:br-temp-02', 'd93f0b', 'Luật nhiệt độ phân cấp BR-TEMP-02'],
  ['graded:br-date-01', 'd93f0b', 'Luật đảo ngày BR-DATE-01'],
];

for (const [name, color, description] of LABELS) {
  if (dry) { console.log(`[dry] ${name}`); continue; }
  execFileSync('gh', ['label', 'create', name, '--color', color, '--description', description, '--force', '-R', REPO], { stdio: 'pipe' });
}
console.log(`${dry ? '[dry] ' : ''}${LABELS.length} nhãn`);
