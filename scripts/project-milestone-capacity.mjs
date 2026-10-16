#!/usr/bin/env node
// Dự báo tới mốc M-03: giờ việc còn lại của backlog sau Sprint 1 so với năng lực theo kế hoạch nhân sự LAB-1.
//   Việc còn lại: mọi issue lá (giờ trong data/hours.final.json qua sprint-model); lá Done ở Sprint 1 tính 0, lá Sprint 1
//   chưa xong tính hoursLeft trong data/sprint-1-log.json final, lá khác tính đủ giờ.
//   Năng lực: bảng 要員計画 LAB-1 (data/sprint-config.json lab1Staffing, trừ PM) từ đầu Sprint 2 tới M-03, mỗi tháng chia
//   đều theo ngày làm việc Nhật của tháng đó; 1 MD = hoursPerMD giờ; nhân focus (phần giờ dành cho issue).
//   Ngày xong: cộng dồn năng lực từng ngày làm việc từ đầu Sprint 2; quá tháng cuối của bảng thì giữ mức tháng cuối.
// Ra: data/milestone-projection.json (tất định, không ghi thời điểm chạy, không gọi mạng).
// Dùng: node scripts/project-milestone-capacity.mjs
import { readJson, writeJson } from './lib/gh-graphql.mjs';
import { loadSprintModel } from './lib/sprint-model.mjs';

const OUT = 'data/milestone-projection.json';
const FOCUS = [1, 0.8];
const MILESTONE = 'M-03';
// Ngày lễ Nhật (祝日) rơi vào ngày thường trong 2026-12 … 2027-04: 成人の日, 建国記念の日, 天皇誕生日,
// 振替休日 (春分の日 2027-03-21 là Chủ nhật), 昭和の日. 元日 nằm trong kỳ nghỉ cuối năm bên dưới; tháng 12/2026 không có 祝日.
// Ngày lễ Nhật 2027 (dự báo dừng ở hết tháng cuối của bảng nhân sự; danh sách dư tới tháng 9 không ảnh hưởng): 成人の日, 建国記念の日, 天皇誕生日,
// 春分の日 (21/3 là Chủ nhật → nghỉ bù 22/3), 昭和の日, Golden Week 3–5/5, 海の日, 山の日, 敬老の日, 秋分の日
const JP_HOLIDAYS = new Set(['2027-01-11', '2027-02-11', '2027-02-23', '2027-03-22', '2027-04-29', '2027-05-03', '2027-05-04', '2027-05-05',
  '2027-07-19', '2027-08-11', '2027-09-20', '2027-09-23']);
const YEAR_END = ['2026-12-29', '2027-01-03']; // nghỉ cuối năm 12/29〜1/3 (quy ước LAB-1)

const cfg = readJson('data/sprint-config.json');
const staffing = cfg.lab1Staffing;
const { final } = readJson('data/sprint-1-log.json');
const { leaves } = loadSprintModel();
const from = cfg.sprints['Sprint 2'].start;
const to = cfg.milestones[MILESTONE];
const H = staffing.hoursPerMD;
const round1 = (n) => Math.round(n * 10) / 10;

// Ngày dạng 'YYYY-MM-DD', tính theo UTC để không lệch múi giờ
const addDay = (d) => new Date(Date.parse(`${d}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
const isWorkday = (d) => {
  const wd = new Date(`${d}T00:00:00Z`).getUTCDay();
  return wd !== 0 && wd !== 6 && !JP_HOLIDAYS.has(d) && !(d >= YEAR_END[0] && d <= YEAR_END[1]);
};
const workdays = (a, b) => {
  const out = [];
  for (let d = a; d <= b; d = addDay(d)) if (isWorkday(d)) out.push(d);
  return out;
};

// Số ngày làm việc của từng tháng trong bảng nhân sự (mẫu số khi chia MD tháng ra từng ngày)
const months = Object.keys(staffing.months).sort();
const lastMonth = months.at(-1);
// Hết bảng nhân sự LAB-1 thì không còn ai làm: dự báo dừng ở ngày cuối tháng cuối, không kéo dài mức tháng cuối
const [ly, lm] = lastMonth.split('-').map(Number);
const PLAN_END = new Date(Date.UTC(ly, lm, 0)).toISOString().slice(0, 10);
const monthDays = Object.fromEntries(months.map((m) => {
  const [y, mo] = m.split('-').map(Number);
  const end = new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10);
  return [m, workdays(`${m}-01`, end).length];
}));
const groups = Object.keys(staffing.roleMap); // vai LAB-1 có nhận issue (PM không có trong roleMap)
// MD của một nhóm vai trong một ngày làm việc (ngoài bảng nhân sự = 0)
const dailyMD = (group, day) => {
  const m = day.slice(0, 7);
  return staffing.months[m] ? staffing.months[m][group] / monthDays[m] : 0;
};

// Việc còn lại theo nhóm vai LAB-1
const groupOf = Object.fromEntries(Object.entries(staffing.roleMap).flatMap(([g, roles]) => roles.map((r) => [r, g])));
const remainingHours = Object.fromEntries(groups.map((g) => [g, 0]));
let doneCount = 0;
let unfinished = { issues: 0, hours: 0 };
for (const l of leaves) {
  const f = final[l.number];
  if (!groupOf[l.owner]) throw new Error(`#${l.number}: vai ${l.owner} không có trong lab1Staffing.roleMap`);
  if (f?.status === 'Done') { doneCount++; continue; }
  if (f) unfinished = { issues: unfinished.issues + 1, hours: unfinished.hours + f.hoursLeft };
  remainingHours[groupOf[l.owner]] += f ? f.hoursLeft : l.hours;
}
const totalRemaining = Object.values(remainingHours).reduce((a, b) => a + b, 0);

// Ngày làm việc đầu tiên mà năng lực cộng dồn (từ đầu Sprint 2) đủ cho số giờ cần
function finishDate(needHours, perDayHours) {
  if (needHours <= 0) return null;
  let sum = 0;
  for (let d = from; d <= PLAN_END; d = addDay(d)) {
    if (!isWorkday(d)) continue;
    sum += perDayHours(d);
    if (sum >= needHours - 1e-9) return d;
  }
  return `sau ${PLAN_END}`;
}

const windowDays = workdays(from, to);
// Vai viết code (Backend, Frontend) xong trước khi pha 開発・実装 của LAB-1 kết thúc — biến thể chặt hơn của cửa sổ tới M-03
const CODE_GROUPS = ['Backend', 'Frontend'];
const codeEnd = staffing.codePhaseEnd;
const codeDays = workdays(from, codeEnd);
const planDays = workdays(from, PLAN_END);
const runs = FOCUS.map((focus) => {
  const capMD = (g) => windowDays.reduce((t, d) => t + dailyMD(g, d), 0) * focus;
  const byRole = Object.fromEntries(groups.map((g) => {
    const capacityMD = round1(capMD(g));
    const remainingMD = round1(remainingHours[g] / H);
    // Chênh lấy từ hai số đã làm tròn để câu chữ cộng trừ khớp nhau
    return [g, {
      capacityMD, remainingMD, marginMD: round1(capacityMD - remainingMD),
      finishDate: finishDate(remainingHours[g], (d) => dailyMD(g, d) * H * focus),
      // Chưa xong khi hết bảng nhân sự: phần còn thiếu lúc đó
      shortAtPlanEndMD: round1(Math.max(0, remainingMD - round1(planDays.reduce((t, d) => t + dailyMD(g, d), 0) * focus))),
    }];
  }));
  const capacityHours = groups.reduce((t, g) => t + capMD(g), 0) * H;
  const shortRoles = groups.filter((g) => byRole[g].marginMD < 0);
  const roleFinish = groups.map((g) => byRole[g].finishDate).filter(Boolean).sort();
  return {
    focus,
    capacityHours: round1(capacityHours),
    remainingHours: round1(totalRemaining),
    marginMD: round1(round1(capacityHours / H) - round1(totalRemaining / H)),
    finishDatePooled: finishDate(totalRemaining, (d) => groups.reduce((t, g) => t + dailyMD(g, d), 0) * H * focus),
    shortRoles,
    finishDateByRole: roleFinish.at(-1),
    byRole,
    codePhase: Object.fromEntries(CODE_GROUPS.map((g) => {
      const capacityMD = round1(codeDays.reduce((t, d) => t + dailyMD(g, d), 0) * focus);
      return [g, { capacityMD, marginMD: round1(capacityMD - byRole[g].remainingMD) }];
    })),
  };
});

writeJson(OUT, {
  note: `Dự báo tới ${MILESTONE} (${to}) sau Sprint 1. Năng lực = bảng 要員計画 LAB-1 trừ PM, chia theo ngày làm việc Nhật; `
    + `1 MD = ${H} giờ; focus = phần giờ dành cho issue. "Pooled" = dồn chung năng lực mọi vai; "byRole" = mỗi vai LAB-1 chỉ làm issue của vai mình. `
    + `Giả định: kế hoạch nhân sự LAB-1 còn gánh diễn tập chuyển đổi dữ liệu và giai đoạn test, nên năng lực thật cho backlog thấp hơn. `
    + `Sinh bởi scripts/project-milestone-capacity.mjs.`,
  milestone: MILESTONE,
  window: { from, to, workdays: windowDays.length },
  codePhaseWindow: { from, to: codeEnd, workdays: codeDays.length },
  workdaysByMonth: monthDays,
  holidays: [...JP_HOLIDAYS],
  yearEndBreak: YEAR_END,
  planEnd: PLAN_END, // hết bảng nhân sự LAB-1: vai chưa xong lúc này ghi 'sau <ngày>' kèm shortAtPlanEndMD
  sprint1Focus: cfg.focusFactor,
  hoursPerMD: H,
  remaining: {
    hours: round1(totalRemaining), md: round1(totalRemaining / H), leaves: leaves.length, doneLeaves: doneCount,
    sprint1Unfinished: { issues: unfinished.issues, hours: round1(unfinished.hours) },
    byRoleHours: Object.fromEntries(groups.map((g) => [g, round1(remainingHours[g])])),
  },
  runs,
});
console.log(runs.map((r) => `focus ${r.focus}: năng lực ${r.capacityHours} giờ / còn ${r.remainingHours} giờ → ${r.marginMD} MD, xong (gộp) ${r.finishDatePooled}, theo vai ${r.finishDateByRole}; thiếu: ${r.shortRoles.join(', ') || '—'}`).join('\n'));
