// Dựng thân issue GitHub (markdown) từ một item của data/backlog.json.
// Id backlog trong nội dung (FG04-12, E15-FG06-01…) đổi thành "#số (id)" khi issue đích đã có số;
// chưa có thì giữ id dạng code — pha "link" của create-issues.mjs dựng lại thân khi đủ số. Id của chính issue
// và id không có trong backlog giữ nguyên chữ.
const REPO_URL = 'https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog';
const BACKLOG_ID = /FG\d{2}-\d{2}(?:\.\d+)?|E1[345]-(?:FG\d{2}-)?\d{2}(?:\.\d+)?/;
const ID_TOKEN = new RegExp(`\\b(?:${BACKLOG_ID.source})\\b`, 'g');

export const issueTitle = (item) => `${item.id} ${item.title}`;

export function renderBody(item, { byId, numberOf }) {
  const ref = (id) => (numberOf(id) ? `#${numberOf(id)} (${id})` : `\`${id}\``);
  const link = (text) => String(text).replace(ID_TOKEN, (id) => (byId.has(id) && id !== item.id ? ref(id) : id));
  const list = (xs) => xs.map((x) => `- ${link(x)}`).join('\n');
  const body = item.body || {};
  const epic = byId.get(`EP-${item.epicId}`);
  const lines = [];

  const head = [`**ID:** \`${item.id}\``, `**Epic:** ${epic ? epic.title : item.epicId}`, `**Owner (giả định):** ${item.owner}`];
  if (item.parentId) head.push(`**Parent:** ${ref(item.parentId)}`);
  lines.push(head.join(' · '), '');
  if (body.goal) lines.push(`**Mục tiêu:** ${link(body.goal)}`, '');
  if (body.lab1) lines.push(`**LAB-1:** ${body.lab1}`, '');
  if (body.sources?.length) lines.push(`**Nguồn (gói LAB-4 tại \`c3cf20d\`):** ${body.sources.map((s) => `${s.id} (${s.confidence})`).join(' · ')}`);
  const HAS_ID = new RegExp(BACKLOG_ID.source);
  if (body.specRefs?.length) lines.push(`**Spec:** ${body.specRefs.map((s) => (HAS_ID.test(s) ? link(s) : `\`${s}\``)).join(' · ')}`);
  if (body.premise?.length) lines.push(`**PREMISE:** ${body.premise.map((p) => `[${p}](${REPO_URL}/blob/main/PREMISE.md)`).join(' · ')}`);
  if (body.sources?.length || body.specRefs?.length || body.premise?.length) lines.push('');
  if (body.scope?.length) lines.push('**Phạm vi**', list(body.scope), '');
  if (body.outOfScope?.length) lines.push('**Ngoài phạm vi**', list(body.outOfScope), '');
  if (body.dod?.length) lines.push('**Định nghĩa xong (DoD)**', body.dod.map((d) => `- [ ] ${link(d)}`).join('\n'), '');

  const deps = [];
  if (body.blockedBy?.length) deps.push(`Chặn bởi: ${body.blockedBy.map(ref).join(', ')}`);
  if (body.questions?.length) deps.push(`Câu hỏi khách liên quan (không chặn — PR-D-04): ${body.questions.map(ref).join(', ')}`);
  if (body.affects?.length) deps.push(`Issue bị ảnh hưởng: ${body.affects.map(ref).join(', ')}`);
  if (deps.length) lines.push('**Phụ thuộc**', deps.map((d) => `- ${d}`).join('\n'), '');
  if (body.notes?.length) lines.push('**Ghi chú**', list(body.notes), '');

  lines.push(`<sub>Sinh từ \`data/backlog.json\` của repo này; sửa trên Project, không sửa tay file.</sub>`);
  return lines.join('\n');
}

