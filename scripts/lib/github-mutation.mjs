// Gửi mutation GitHub có hãm tốc: nghỉ delayMs sau mỗi mutation thành công. Hạn mức → chờ 60s, 120s, 240s rồi 480s mỗi
// lần; lỗi mạng → chờ 5s, 10s… và chỉ thử lại khi thao tác lặp lại vô hại (idempotent); cả hai tối đa 6 lần thử lại.
// createIssue truyền idempotent:false — người gọi tự dò issue đã tạo.
import { graphql } from './gh-graphql.mjs';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const NETWORK = /TLS handshake|timeout|ECONNRESET|EOF|connection reset|Bad Gateway|Service Unavailable|Gateway Timeout|HTTP 50[234]/i;
const RATE_LIMITED = /rate limit|secondary|abuse|too quickly|RATE_LIMITED/i;

export function createMutator({ delayMs }) {
  return async function mutate(query, variables, { idempotent = true } = {}) {
    for (let attempt = 0; ; attempt++) {
      try {
        const data = graphql(query, variables, { retries: 1 });
        await sleep(delayMs);
        return data;
      } catch (err) {
        const limited = RATE_LIMITED.test(err.message);
        if (!(limited || (NETWORK.test(err.message) && idempotent)) || attempt >= 6) throw err;
        const wait = limited ? 60_000 * 2 ** Math.min(attempt, 3) : 5_000 * (attempt + 1);
        console.log(`… ${limited ? 'hạn mức GitHub' : 'lỗi mạng'}, chờ ${wait / 1000}s (lần ${attempt + 1})`);
        await sleep(wait);
      }
    }
  };
}
