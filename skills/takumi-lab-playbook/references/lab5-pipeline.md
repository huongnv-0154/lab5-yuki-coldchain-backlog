# LAB-5 pipeline — break task, GitHub Project, SWP, sprint giả lập

Một phase = một phiên, chạy bằng `/tkm:takumi plans/…/plan.md --auto`. Mỗi phase đi đủ vòng: làm → tester → reviewer (khác model) → giao (delivery-tracker, doc-writer, evidence gate, commit, capture-lessons, handoff). Mọi lần đẩy nội dung lên GitHub (push, tạo issue, ghi field, comment, đóng issue, đổi public) hỏi user trước.

## Bảng phase ↔ cổng ↔ script ↔ file nộp

| Phase | Việc | Script / skill | Cổng | File nộp chạm tới |
|---|---|---|---|---|
| P0 | Mốc LAB-4 (commit bản nộp, user xác nhận), Project + field (Status có Blocked, Iteration, Story Point, Estimated time, Owner, Item type), view, nhãn | `configure-project.mjs`, `create-labels.mjs`, `snapshot-project.mjs`, `check-project.mjs` | không đánh G (plan chỉ có G1–G5); `check-project.mjs` xanh: field đúng | stub 6 file |
| P1 | Nguồn break có tái hiện, luật chia, 15 epic, PREMISE v1 | `mine-sources.mjs`; `decision-review` (luật chia, chỗ hở lớn) | G1: PREMISE đủ 3 phần, "Vì sao" trỏ nguồn | PREMISE.md, task-breakdown.md §1 |
| P2a | Backlog JSON: subagent song song theo nhóm epic, một hướng dẫn chung + 2 issue mẫu | `merge-backlog.mjs` (tất định), `check-backlog.mjs` | G2 (phần backlog): mọi nguồn thành issue hoặc có lý do, DoD ≥ 2, owner / nhãn, id có thật, trần item (lá ≤ 16 giờ kiểm ở G3, chưa có giờ lúc này) | data/backlog.json, data/gaps.json |
| P2b | Đăng issue + sub-issue gốc + blocked-by gốc | `create-issues.mjs` (createIssue kèm parent + project + label; ghi số ngược sau mỗi item; dò trùng theo tiền tố), `link-issue-ids.mjs` (id backlog trong PREMISE → link issue) | G2 (phần Project): số item Project = backlog, sub-issue nối cha | task-breakdown.md §2–4, PREMISE cột issue |
| P3 | Chấm SWP bằng `tkm:estimate-swp --level high --no-push-kpi`; DR 5 đại diện; agent ghi Story Point; quy giờ | `extract-swp.mjs`, `set-field.mjs --value-key`, `derive-hours.mjs` | G3: Story Point = payload HTML; giờ = SWP × k; lá ≤ 16 giờ | estimate.md, swp-report/report.html |
| P4 | Chọn phạm vi sprint, giả lập, đưa lên Project, rủi ro | `plan-sprint.mjs`, `simulate-sprint.mjs`, `apply-sprint-log.mjs`, `render-burndown-svg.mjs`, `tkm:predict-risks`, `check-progress.mjs` | G4: bảng = snapshot; burndown cuối = SWP chưa Done; rủi ro có issue, mốc, vai, ngày | progress-report.md, PREMISE (giả định giả lập) |
| P5 | README, AI-report, skills/, cổng nộp, review 6 file, go / no-go | `check-public-access.mjs` (GET không đăng nhập → `data/public-access-check.json`), `render-tables.mjs --check`, `check-lab5.mjs`, `tkm:review-doc` | G5: đủ phần đúng thứ tự, không TODO, không token / email / câu RFP dài, link tương đối và `#số` khớp repo / snapshot, bảng = data; kết quả mở thử không đăng nhập ghi vào README | README.md, AI-report.md |

## Bài học dùng lại

- Mốc LAB trước = bản nộp user xác nhận, không suy từ hạn nộp.
- Không chép gói repo private sang repo public; trỏ mã / đường dẫn file.
- Bảng trong file nộp sinh từ `data/` bằng `render-tables.mjs`, có `--check`; sửa dữ liệu chứ không sửa bảng.
- Chọn phạm vi sprint: ghim chuỗi đường găng trước, rồi mới theo thứ tự epic.
- Tham số giả lập chọn tay (hệ số tập trung) phải công khai là giả định kèm độ nhạy.
- Cổng kiểm mới: thử phá trên bản sao để chắc cổng không PASS sai; `--dry-run` và `--help` không được ghi file.
- Tải sprint tính theo vai, không cộng gộp.
