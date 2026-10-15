#!/usr/bin/env node
// Giả lập một sprint theo năng lực từng vai (DR-07): mỗi vai làm focusFactor × 1/N số giờ sprint mỗi ngày, việc đang dở trước rồi
// theo thứ tự trong data/sprint-plan.json; issue chỉ bắt đầu khi mọi lá chặn nó đã Done. Câu hỏi E-15: làm xong phần gửi → Blocked chờ
// khách (PR-A-04: khách chưa trả lời trong Sprint 1), hỏi lại sau 3 ngày làm việc (sự kiện followup, vẫn Blocked).
// Sự kiện lệch lấy từ data/sprint-1-scenario.json:
//   block   { ids, fromDay, toDay, note, resumeNote } — không làm được (Blocked) trong các ngày đó; resumeNote là lý do hết chặn
//           ghi ở sự kiện quay lại (nếu issue còn chờ lá chặn khác, thêm "; vẫn chờ #n")
//   reopen  { id, day, reworkRatio, note } — issue đã Done mở lại, thêm giờ sửa = ratio × giờ ước
//   carry   { id, day, note }              — chuyển sang sprint sau cuối ngày đó (rời phạm vi, vẫn In Progress)
// Ra: data/sprint-1-log.json (mọi lần đổi trạng thái / sprint / hỏi lại theo ngày, trạng thái cuối kèm giờ còn lại,
// giờ rảnh theo vai) và data/sprint-1-burndown.json (SWP còn lại theo kế hoạch tuyến tính và thực tế). Tất định, không gọi mạng.
// --focus <x> thay focusFactor của cấu hình, --dry-run chỉ in tóm tắt (dùng để đo độ nhạy, không ghi file). reopen / carry dừng
// với lỗi nếu issue không ở đúng trạng thái ngày đó (vd --focus 1: #253 đã Done trước ngày chuyển) — khi đó thu gọn scenario.
// Dùng: node scripts/simulate-sprint.mjs [--focus 0.8] [--dry-run]
import { readJson, writeJson, parseArgs } from './lib/gh-graphql.mjs';
import { loadSprintModel } from './lib/sprint-model.mjs';

const SPRINT = 'Sprint 1';
const args = parseArgs();
const cfg = readJson('data/sprint-config.json');
const scenario = readJson('data/sprint-1-scenario.json');
const { leafByNumber } = loadSprintModel();
const days = cfg.sprints[SPRINT].workdays;
const nextSprint = cfg.planSprints[cfg.planSprints.indexOf(SPRINT) + 1];
const plan = readJson('data/sprint-plan.json')[SPRINT].issues.map((n) => leafByNumber.get(n));
const byId = new Map(plan.map((l) => [l.id, l]));
const need = (id) => {
  if (!byId.has(id)) throw new Error(`kịch bản nhắc ${id} không thuộc ${SPRINT}`);
  return byId.get(id);
};

const state = new Map(plan.map((l) => [l.number, { status: 'Todo', left: l.hours, sprint: SPRINT }]));
const log = [];
const move = (l, day, to, note) => {
  const s = state.get(l.number);
  if (s.status === to) return;
  log.push({ day, date: days[day - 1], number: l.number, id: l.id, from: s.status, to, note });
  s.status = to;
};
const isQuestion = (l) => l.epicId === 'E-15';
const activeBlock = (l, day) => scenario.block.find((b) => b.ids.includes(l.id) && day >= b.fromDay && day <= b.toDay);
const blockedToday = (l, day) => Boolean(activeBlock(l, day));
const depsDone = (l) => l.blockers.every((n) => state.get(n)?.status === 'Done');
const resumeNote = (l) => {
  const waiting = l.blockers.filter((n) => state.get(n)?.status !== 'Done');
  const why = scenario.block.find((b) => b.ids.includes(l.id)).resumeNote;
  return waiting.length ? `${why}; vẫn chờ ${waiting.map((n) => `#${n}`).join(', ')}` : `${why}, làm tiếp`;
};
const focusFactor = Number(args.focus ?? cfg.focusFactor ?? 1);
const dailyHours = Object.fromEntries(Object.entries(cfg.roleHoursPerSprint).map(([r, h]) => [r, (h / days.length) * focusFactor]));
for (const e of [...scenario.reopen, ...scenario.carry]) need(e.id);
for (const b of scenario.block) b.ids.forEach(need);

const swpOf = (items) => items.reduce((t, i) => t + i.swp, 0);
const leavesInScope = () => plan.filter((l) => state.get(l.number).sprint === SPRINT);
const scopeSWP = () => swpOf(leavesInScope());
const totalSWP = scopeSWP();
const burndown = [{ day: 0, date: null, planned: totalSWP, actual: totalSWP, scope: totalSWP }];
const reaskDay = new Map(); // số câu hỏi E-15 → ngày hỏi lại
const idle = Object.fromEntries(Object.keys(dailyHours).map((r) => [r, 0]));
const round2 = (n) => Math.round(n * 100) / 100;

for (let day = 1; day <= days.length; day++) {
  // Hỏi lại câu hỏi E-15 chưa có trả lời, đúng ngày đã ghi khi gửi
  for (const [n, d] of reaskDay) {
    const l = leafByNumber.get(n);
    if (d === day && state.get(n).status === 'Blocked') log.push({ day, date: days[day - 1], number: n, id: l.id, from: 'Blocked', to: 'Blocked', note: 'Đã hỏi lại (giả lập); khách chưa trả lời, giữ Blocked', kind: 'followup' });
  }
  // Mở lại issue đã Done (lỗi hồi quy phát hiện đầu ngày)
  for (const r of scenario.reopen.filter((e) => e.day === day)) {
    const l = need(r.id);
    if (state.get(l.number).status !== 'Done') throw new Error(`${r.id} chưa Done ở ngày ${day}, không mở lại được`);
    state.get(l.number).left = Math.round(l.hours * r.reworkRatio * 2) / 2; // làm tròn 0,5 giờ
    move(l, day, 'In Progress', r.note);
  }
  // Issue bị chặn từ ngoài: In Progress / Todo đến lượt → Blocked; hết ngày chặn → trở lại
  for (const l of plan) {
    const s = state.get(l.number);
    if (s.sprint !== SPRINT || s.status === 'Done' || isQuestion(l)) continue;
    const block = activeBlock(l, day);
    if (block) move(l, day, 'Blocked', block.note);
    else if (s.status === 'Blocked') move(l, day, s.left < l.hours ? 'In Progress' : 'Todo', resumeNote(l));
  }
  for (const [role, hours] of Object.entries(dailyHours)) {
    let free = hours;
    // Ưu tiên việc đang dở, rồi theo thứ tự kế hoạch
    const queue = leavesInScope().filter((l) => l.owner === role)
      .sort((a, b) => (state.get(b.number).status === 'In Progress') - (state.get(a.number).status === 'In Progress'));
    for (const l of queue) {
      if (free <= 0) break;
      const s = state.get(l.number);
      if (['Done', 'Blocked'].includes(s.status) || blockedToday(l, day) || !depsDone(l)) continue;
      if (s.status === 'Todo') move(l, day, 'In Progress', isQuestion(l) ? 'Soạn câu hỏi gửi khách' : 'Bắt đầu');
      const spent = Math.min(free, s.left);
      s.left = Math.round((s.left - spent) * 100) / 100; // bỏ sai số số thực
      free -= spent;
      if (s.left > 0) continue;
      if (isQuestion(l)) {
        // Hỏi lại sau 3 ngày làm việc; quá cuối sprint thì hẹn sang sprint sau (không sinh sự kiện trong sprint này)
        const again = day + 3;
        if (again <= days.length) reaskDay.set(l.number, again);
        move(l, day, 'Blocked', `Đã gửi câu hỏi (giả lập); hỏi lại ${again <= days.length ? days[again - 1] : `đầu ${nextSprint}`} nếu chưa có trả lời`);
      } else move(l, day, 'Done', 'Xong, đạt DoD');
    }
    idle[role] = round2(idle[role] + Math.max(free, 0));
  }
  // Chuyển sang sprint sau cuối ngày
  for (const c of scenario.carry.filter((e) => e.day === day)) {
    const l = need(c.id);
    const s = state.get(l.number);
    if (s.status === 'Done') throw new Error(`${c.id} đã Done ở ngày ${day}, không chuyển sprint được`);
    s.sprint = nextSprint;
    log.push({ day, date: days[day - 1], number: l.number, id: l.id, from: SPRINT, to: nextSprint, note: c.note, field: 'Sprint' });
  }
  const scope = scopeSWP();
  const doneSWP = swpOf(leavesInScope().filter((l) => state.get(l.number).status === 'Done'));
  burndown.push({ day, date: days[day - 1], planned: Math.round(totalSWP * (1 - day / days.length) * 10) / 10, actual: scope - doneSWP, scope });
}

const final = Object.fromEntries(plan.map((l) => {
  const s = state.get(l.number);
  return [l.number, { id: l.id, status: s.status, sprint: s.sprint, swp: l.swp, hoursLeft: s.status === 'Done' ? 0 : s.left }];
}));
if (!args['dry-run']) {
  writeJson('data/sprint-1-log.json', { sprint: SPRINT, events: log, final, idleHoursByRole: idle });
  writeJson('data/sprint-1-burndown.json', burndown);
}
const finalInScope = Object.values(final).filter((f) => f.sprint === SPRINT);
const withStatus = (status) => finalInScope.filter((f) => f.status === status);
const doneItems = withStatus('Done');
const donePercent = Math.round((swpOf(doneItems) / swpOf(finalInScope)) * 100);
console.log(`${SPRINT}: phạm vi cuối ${finalInScope.length} issue / ${swpOf(finalInScope)} SWP — Done ${doneItems.length} (${swpOf(doneItems)} SWP, ${donePercent}%), In Progress ${withStatus('In Progress').length}, Blocked ${withStatus('Blocked').length}, Todo ${withStatus('Todo').length}; ${log.length} sự kiện; giờ rảnh ${Object.entries(idle).filter(([, h]) => h > 0).map(([r, h]) => `${r} ${h}`).join(', ')}`);
