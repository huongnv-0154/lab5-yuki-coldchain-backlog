#!/usr/bin/env node
// Chọn issue lá cho từng sprint theo data/sprint-config.json (DR-07):
//   0. issue trong pinned[sprint] (chuỗi đường găng) nhận trước, theo đúng thứ tự ghi; không nhận được thì dừng;
//   1. tối đa maxQuestionsPerSprint câu hỏi E-15 gắn với questionEpics (gửi sớm để khách có thời gian trả lời);
//   2. duyệt epic theo epicPriority, trong epic theo thứ tự backlog; nhận issue khi vai Owner còn đủ giờ và mọi lá
//      chặn nó đã được nhận ở sprint này hoặc sprint trước (chuỗi phụ thuộc làm tuần tự trong sprint).
// Ra: data/sprint-plan.json (danh sách, giờ và SWP theo sprint / vai) và data/sprint-field.json ({"<số>": "<sprint>"}
// để ghi field Sprint bằng set-field.mjs). Không gọi mạng.
// Dùng: node scripts/plan-sprint.mjs
import { readJson, writeJson } from './lib/gh-graphql.mjs';
import { loadSprintModel, questionEpic } from './lib/sprint-model.mjs';

const cfg = readJson('data/sprint-config.json');
const { leaves } = loadSprintModel();
const sprintOf = new Map(); // số issue → sprint đã nhận
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const plan = {};

for (const sprint of cfg.planSprints) {
  const left = { ...cfg.roleHoursPerSprint };
  const taken = [];
  const open = (l) => !sprintOf.has(l.number);
  const ready = (l) => l.blockers.every((n) => sprintOf.has(n));
  const fits = (l) => (left[l.owner] ?? 0) >= l.hours;
  const take = (l) => { sprintOf.set(l.number, sprint); taken.push(l); left[l.owner] -= l.hours; };

  for (const id of cfg.pinned?.[sprint] || []) {
    const l = leaves.find((x) => x.id === id);
    if (!l || !open(l) || !ready(l) || !fits(l)) throw new Error(`${sprint}: không ghim được ${id} (không phải lá, đã nhận, bị chặn hoặc vai hết giờ)`);
    take(l);
  }
  let questions = 0;
  for (const l of leaves.filter((x) => x.epicId === 'E-15' && open(x))) {
    if (questions >= cfg.maxQuestionsPerSprint) break;
    if (cfg.questionEpics.includes(questionEpic(l.id)) && ready(l) && fits(l)) { take(l); questions++; }
  }
  // Lặp trong một epic tới khi không nhận thêm được: issue bị chặn bởi issue vừa nhận ở lượt trước được nhận ở lượt sau
  for (const epic of cfg.epicPriority) {
    let added;
    do {
      added = false;
      for (const l of leaves.filter((x) => x.epicId === epic && open(x))) {
        if (ready(l) && fits(l)) { take(l); added = true; }
      }
    } while (added);
  }

  const hoursByRole = Object.fromEntries(Object.keys(cfg.roleHoursPerSprint).map((r) => [r, sum(taken.filter((l) => l.owner === r).map((l) => l.hours))]));
  plan[sprint] = { issues: taken.map((l) => l.number), count: taken.length, hours: sum(taken.map((l) => l.hours)), swp: sum(taken.map((l) => l.swp)), hoursByRole };
  console.log(`${sprint}: ${taken.length} issue, ${plan[sprint].hours} giờ, ${plan[sprint].swp} SWP, câu hỏi E-15 ${questions}`);
}

writeJson('data/sprint-plan.json', plan);
writeJson('data/sprint-field.json', Object.fromEntries([...sprintOf].map(([n, s]) => [String(n), s])));
