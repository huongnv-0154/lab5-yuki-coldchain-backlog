// Gọi GitHub GraphQL qua `gh api graphql` (token do gh giữ, script không đọc/in token).
// Thử tối đa 3 lần (đổi bằng { retries }), nghỉ 1s giữa các lần; lỗi dữ liệu (UNPROCESSABLE / NOT_FOUND / FORBIDDEN / INVALID)
// ném ngay không thử lại; lỗi GraphQL trả về được ném ra kèm thông điệp. Kèm paginate, readJson, writeJson (ghi nguyên tử), parseArgs.
import { execFileSync } from 'node:child_process';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

export function graphql(query, variables = {}, { retries = 3 } = {}) {
  const body = JSON.stringify({ query, variables });
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const raw = execFileSync('gh', ['api', 'graphql', '--input', '-'], {
        input: body,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      const res = JSON.parse(raw);
      if (res.errors?.length) throw new Error(res.errors.map((e) => e.message).join('; '));
      return res.data;
    } catch (err) {
      // gh in lỗi GraphQL ra stdout kèm exit ≠ 0 — gom lại cho dễ đọc
      const detail = err.stdout ? String(err.stdout).slice(0, 500) : err.message;
      lastErr = new Error(`GraphQL lỗi (lần ${attempt}/${retries}): ${detail}`);
      // lỗi dữ liệu (trùng tên, sai id…) không tự khỏi khi thử lại
      if (/UNPROCESSABLE|NOT_FOUND|FORBIDDEN|"type":"INVALID/.test(detail)) throw lastErr;
      if (attempt < retries) sleep(1000);
    }
  }
  throw lastErr;
}

// Phân trang theo cursor: fetchPage(after) trả { nodes, pageInfo }
export function paginate(fetchPage) {
  const all = [];
  let after = null;
  do {
    const page = fetchPage(after);
    all.push(...page.nodes);
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);
  return all;
}

export const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
// Ghi qua tệp tạm rồi đổi tên: bị ngắt giữa chừng cũng không để lại JSON cụt
export const writeJson = (path, data) => {
  writeFileSync(`${path}.tmp`, `${JSON.stringify(data, null, 2)}\n`);
  renameSync(`${path}.tmp`, path);
};

// `--cờ giá trị` → out.cờ = giá trị; cờ đứng cuối hoặc ngay trước một cờ khác → true; còn lại vào out._
export function parseArgs(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}

export const PROJECT_OWNER = 'huongnv-0154';
export const PROJECT_NUMBER = 2;
export const REPO = 'huongnv-0154/lab5-yuki-coldchain-backlog';
