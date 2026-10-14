// Mô hình backlog dùng chung cho chọn sprint và giả lập sprint: issue lá kèm vai, giờ, SWP đã chốt (P3) và các lá
// chặn nó. Issue chặn là story / epic thì quy về mọi lá con của nó (story xong khi mọi lá xong).
import { readJson } from './gh-graphql.mjs';

export function loadSprintModel() {
  const items = readJson('data/backlog.json').items;
  const scoreOf = new Map(readJson('data/swp-scores.final.json').map((r) => [r.number, r]));
  const hoursOf = new Map(readJson('data/hours.final.json').map((r) => [r.number, r.hours]));
  const byId = new Map(items.map((i) => [i.id, i]));
  const children = new Map();
  for (const i of items) if (i.parentId) children.set(i.parentId, [...(children.get(i.parentId) || []), i]);
  const leafNumbersOf = (id) => {
    if (!byId.has(id)) throw new Error(`issue chặn ${id} không có trong data/backlog.json`);
    const kids = children.get(id) || [];
    if (!kids.length) return [byId.get(id).number];
    return kids.flatMap((k) => leafNumbersOf(k.id));
  };

  // Thứ tự lá giữ thứ tự của backlog.json (cha trước con, theo id) — là thứ tự làm mặc định trong một epic
  const leaves = items.filter((i) => !scoreOf.get(i.number).container).map((i) => ({
    number: i.number, id: i.id, epicId: i.epicId, owner: i.owner, title: i.title,
    hours: hoursOf.get(i.number), swp: scoreOf.get(i.number).finalSWP,
    blockers: [...new Set((i.body?.blockedBy || []).flatMap(leafNumbersOf))],
  }));
  const leafByNumber = new Map(leaves.map((l) => [l.number, l]));
  return { leaves, leafByNumber };
}

// Câu hỏi E-15 gắn với epic nào: "E15-FG05-01" → "FG-05"; câu hỏi chung (E15-01…) → null
export const questionEpic = (id) => {
  const fg = id.match(/^E15-FG(\d{2})-/)?.[1];
  return fg ? `FG-${fg}` : null;
};
