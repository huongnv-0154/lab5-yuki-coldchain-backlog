# AI-report — dùng AI cho LAB-5

Toàn bộ LAB-5 chạy trong Claude Code (bản desktop) với bộ skill Takumi (kit 26.10.2) và hai skill tự viết: `decision-review` và `takumi-lab-playbook` (bản sao của cả hai ở `skills/`). Plan lập bằng `tkm:create-plan` trên Fable 5.1; các phase chạy ở phiên chính Opus 5.5; việc viết, kiểm thử và review tài liệu giao cho subagent Sonnet; review code và assessor thứ hai của skill chấm SWP dùng Opus. Mỗi phase (P0 nền → P1 PREMISE → P2 break + đăng → P3 SWP + giờ → P4 sprint → P5 nộp, rồi P6 sửa theo cross review) chạy bằng `/tkm:takumi plans/…/plan.md --auto` theo cùng một vòng: làm → kiểm thử (tester) → review (reviewer) → giao (đồng bộ plan, soát tài liệu, cổng bằng chứng, commit, ghi bài học, handoff). Plan, sổ prompt, sổ review và bằng chứng nằm trong `plans/` (không đưa lên repo vì là ghi chú nội bộ); số liệu dưới đây lấy từ các sổ đó.

## 1. Skill và prompt cho từng việc

### Break task (P1–P2)

| Bước | Skill / agent | Prompt (tóm tắt) | Ra gì |
|---|---|---|---|
| Đọc gói LAB-4 tại mốc | 2 subagent Sonnet chạy song song | "Chỉ đọc gói LAB-4 tại `c3cf20d`; trả JSON ≤ 150 dòng; mỗi kết luận kèm file:dòng; không chép câu RFP" | Danh sách việc còn mở và bằng chứng cho chỗ hở GAP-41 |
| Gom nguồn break | script `mine-sources.mjs` (agent viết) | Đọc bảng markdown của gói LAB-4, dừng nếu không đúng commit mốc, chỉ lấy cột do mình viết, lọc trích dẫn RFP | 250 nguồn trong `data/sources.json` |
| Gán epic cho nguồn mơ hồ | 1 subagent Sonnet | Danh sách 50 id + định nghĩa 15 epic + luật "chọn theo chức năng nơi thay đổi rơi vào" | 50 gán epic; reviewer bắt 2 gán sai, sửa xong `data/epic-overrides.json` có 51 mục |
| Luật chia + epic | `decision-review` (DR-03) | Thẻ quyết định + bằng chứng; Challenger hỏi ngược | 15 epic, lá ≤ 16 giờ, một vai, DoD theo 5 loại việc |
| Viết backlog | 5 subagent Sonnet chạy song song theo nhóm epic, thêm 1 job sau cho các chỗ hở mà bảng chênh lệch LAB-4 bỏ sót | Một file hướng dẫn chung (schema JSON, luật chia, bảng Owner, nhãn, 2 issue mẫu) + danh sách nguồn riêng; mỗi job ghi một file JSON và tự kiểm bằng node | 433 item sau khi gộp |
| Gộp + cổng | `merge-backlog.mjs`, `check-backlog.mjs`, `decision-review` (DR-04) | Gộp tất định; cổng: trần 450 item, DoD ≥ 2, nhãn, mọi id nhắc tới có thật, mọi nguồn thành issue hoặc có lý do (lá ≤ 16 giờ chỉ kiểm được ở P3, khi đã có giờ) | `data/backlog.json` 15 epic / 65 story / 353 lá, 50 chỗ hở |
| Đăng lên GitHub | `create-issues.mjs` (agent viết) | GraphQL `createIssue` kèm `parentIssueId` + `projectV2Ids` + `labelIds`, set field Item type / Owner, ghi số issue ngược vào dữ liệu sau mỗi item; pha hai đổi id trong thân thành `#số` và tạo quan hệ blocked-by gốc | 433 issue có sub-issue gốc, 325 quan hệ blocked-by |

### Chấm SWP và dùng Agent ghi SWP lên Project (P3)

- **Chấm:** `/tkm:estimate-swp https://github.com/users/huongnv-0154/projects/2 --level high --no-push-kpi`. Agent chạy quy trình của skill, kèm các lệch đã khai ở mục 2: kiểm trước mọi lệnh đọc bằng `tool_policy.py`; đọc Project bằng một truy vấn GraphQL chỉ đọc; `selection.py` chọn 353 lá và 80 container (container lấy tổng con); `orchestration.py` chia 5 batch. Prompt cho worker: "chỉ đọc rubric của skill và gói batch của mình, trả đúng JSON của hợp đồng, Scope và Complexity chấm độc lập, SWP tra từ ma trận, lý do tiếng Việt nêu căn cứ của cả hai trục". 5 worker Sonnet chấm hết 353 issue; 5 worker Opus chấm lại 39 issue rủi ro (cùng prompt, khác model); validator của skill kiểm từng dòng.
- **Kiểm issue mẫu:** skill chọn 5 đại diện. Trước khi trả lời skill, agent chạy `decision-review` mức standard (DR-05): một Challenger Sonnet phản biện từng điểm, agent trả lời bằng thân issue và rubric; ra 3 sửa (chỉ áp cho chính issue đó). User xác nhận cả 5 bằng một câu hỏi; agent trả lời các vòng hỏi của skill theo đúng kết quả đó (skill vốn hỏi từng issue một). Skill hiệu chỉnh và xuất `swp-report/report.html`.
- **Ghi SWP lên Project bằng Agent** (skill chỉ đọc, không ghi): agent viết hai script rồi chạy theo thứ tự
  1. `node scripts/extract-swp.mjs swp-report/report.html` — đọc payload kiểm toán nhúng trong HTML → `data/swp-scores.final.json` (lá = SWP đã chốt, container = tổng con, kiểm lại phép cộng);
  2. `node scripts/set-field.mjs --field "Story Point" --from data/swp-scores.final.json --value-key finalSWP --dry-run` — in 433 thay đổi để xem trước; chạy lại không có `--dry-run` để ghi (mutation `updateProjectV2ItemFieldValue`, kiểm hết giá trị trước lần ghi đầu, hãm tốc và chờ khi chạm hạn mức GitHub);
  3. `snapshot-project.mjs` → `extract-swp.mjs … --check` và `check-project.mjs --require-points` — Story Point trên Project bằng payload HTML ở cả 433 item, cha bằng tổng con.

### Quy giờ (P3)

`decision-review` mức quick (DR-06). Agent chọn 6 issue lá ở 6 ô khác nhau của ma trận Scope × Complexity, trải 4 loại vai (FE, BE, QA-Auto, Infra), ước giờ trực tiếp theo từng bước (code, test, review); k = 46 giờ / 31 SWP ≈ 1,5 giờ/SWP. `derive-hours.mjs` áp giờ = SWP × 1,5 cho lá, cha = tổng con, dừng nếu lá nào vượt 16 giờ; ghi field Estimated time bằng `set-field.mjs --value-key hours`. Cách chọn và lý do ở estimate.md mục 2.

### Báo cáo tiến độ (P4)

| Bước | Skill / agent | Ra gì |
|---|---|---|
| Chọn phạm vi | `plan-sprint.mjs` + `data/sprint-config.json` (27 giờ/vai, ghim chuỗi IdP + môi trường) | Sprint 1: 45 issue / 139 SWP; Sprint 2 sơ bộ |
| Giả lập | `simulate-sprint.mjs` (mô hình năng lực theo vai, hệ số tập trung 0,8, kịch bản 3 lệch trong `data/sprint-1-scenario.json`), `decision-review` (DR-07) | Log từng ngày, burndown, Done 70% SWP |
| Đưa lên Project | `apply-sprint-log.mjs` + `set-field.mjs` | Field Sprint 82 issue, Status 40, 82 comment "Giả lập Sprint 1 · ngày N" trên 41 issue, gán 40 issue, đóng 28 issue Done |
| Rủi ro | `tkm:predict-risks --level low` (góc nhìn kiến trúc, bảo mật, phản biện) | Rủi ro trễ có issue, mốc, hành động, vai, ngày; từ P6 bảng có 6 dòng, dòng đầu lấy từ dự báo M-03 (bảng dưới) |
| Báo cáo + cổng | `render-burndown-svg.mjs`, `render-tables.mjs`, `check-progress.mjs` | progress-report.md, ảnh burndown, cổng G4 |

Comment và issue đóng trên GitHub là **lịch sử giả lập** của Sprint 1 ở tương lai (2026-11-30 → 12-11); comment nào cũng ghi rõ điều đó.

### Sửa theo cross review (P6)

| Bước | Skill / agent | Ra gì |
|---|---|---|
| Dự báo tới M-03 | `project-milestone-capacity.mjs` (tất định, không gọi mạng) → `data/milestone-projection.json`; `check-progress.mjs` chặn số MD và ngày ở dòng rủi ro lệch dự báo | Bảng dự báo trong progress-report §3 và dòng rủi ro đầu tiên |
| Độ nhạy hệ số tập trung | `simulate-sprint.mjs` → `data/sprint-1-sensitivity.json` | Done 78% ở 90%, 70% ở 80%; ở 100% không chạy được (progress-report, ghi chú kỹ thuật) |
| Vệ sinh issue | `fix-issue-hygiene.mjs`, mặc định dry-run → `data/issue-hygiene-fixes.json` | Dry-run lập kế hoạch 38 issue + 1 comment; user duyệt rồi mới chạy `--apply` (2026-10-15: ghi 39 mục, chạy lại dry-run còn 0) |
| Project public | user quyết; `check-public-access.mjs` | GET không đăng nhập: repo, Project, báo cáo HTML đều 200 (README) |

## 2. Review output AI

### Ai review, ở bước nào

| Lớp | Ai / gì | Khi nào | Làm gì |
|---|---|---|---|
| Cổng tự động | script `check-*` + validator của skill + `render-tables --check` | mỗi lần sinh hay ghi dữ liệu | chặn sai cấu trúc, sai phép cộng, bảng cũ hơn dữ liệu |
| Kiểm thử | tester (Sonnet) | sau khi làm xong mỗi phase | chạy lệnh thật, ghi exit code; có đọc lại GitHub để so với dữ liệu |
| Review code + dữ liệu | reviewer (Opus) → re-review (Sonnet) | mỗi phase | verdict có điểm; cổng bằng chứng chỉ cho commit khi SEALED |
| Review tài liệu | doc reviewer (Sonnet) + script kiểm trích dẫn | mỗi file nộp | tính lại mọi con số từ nguồn, trích dẫn hai phía |
| Phản biện quyết định | `decision-review`, Challenger khác model | mỗi quyết định có đánh đổi (DR-01…DR-08) | hỏi nguồn, hỏi lý do, ra phán quyết |
| Cross review | model khác (Fable 5.1), sau đó Codex | trước khi nộp | đọc bài theo một brief chung (đề nguyên văn, checklist theo đề, luật chỉ đọc), không xem review nội bộ; mỗi phát hiện kèm file:dòng và bằng chứng |
| Người | user | chốt mốc LAB-4, chính sách chép gói, mọi lần đẩy nội dung lên GitHub, xác nhận 5 điểm SWP, Project public hay không | quyết định cuối |

### Phát hiện gì, xử lý thế nào (chọn lọc)

| Phase | Phát hiện | Ai phát hiện | Xử lý |
|---|---|---|---|
| P0 | Agent lấy mốc LAB-4 theo hạn nộp (commit cũ) | **user** | Đổi sang bản nộp thật `c3cf20d`, kiểm diff = 0 |
| P0 | Chép gói LAB-4 (repo private) sang repo public — gói có câu RFP nguyên văn và khuôn công ty | cơ chế chặn của Claude Code + agent quét lại | Hỏi user → không chép, chỉ trỏ mã / file |
| P1 | GAP-41: đề xuất giữ cứng một cách hiểu mốc "đã nhận" | Challenger (DR-02) | Tham số hoá phạm vi mốc và hành động, thêm timeout POD (PR-S-01, PR-A-06) |
| P1 | PREMISE v1 có cột DB không có trong LAB-4, bản sửa bỏ sót phía phân bổ | doc reviewer | Sửa hết, khai 2 cột mới, thêm PR-S-04 |
| P2a | Script gộp đổi mã nguồn máy móc → issue nạp file nhiệt độ bị "chặn" bởi câu hỏi di trú | agent đọc thống kê | Tách "chặn" và "câu hỏi liên quan"; chỉ 6 issue bị câu hỏi khách chặn (DR-04) |
| P2a | Hàng đợi mail làm hai lần ở hai epic; 3 issue đi ngược giả định PREMISE | reviewer Opus (7/10) | Sửa dữ liệu + thêm luật vào cổng → 9/10 |
| P2b | Một issue còn id backlog chưa đổi thành `#số` | reviewer đọc 433 issue thật | Sửa dữ liệu + cập nhật thân issue |
| P3 | Điểm #360 cao vì "đồng thời" chỉ là một ràng buộc unique; #246, #9 thiếu bậc trạng thái | Challenger (DR-05); user xác nhận | 3 sửa chỉ áp cho chính issue |
| P3 | estimate.md: "FG-12 giảm ít nhất" sai; BrSE có 48 issue chứ không phải 42 | doc reviewer | Sửa, re-review PASS |
| P3 | Script quy giờ ghi file ngay cả khi có lá vượt 16 giờ; `--check` so với file trung gian | reviewer Opus (8/10) | Dừng trước khi ghi; `--check` so với nguồn gốc → 9/10 |
| P4 | Kế hoạch bỏ quên tenant IdP trên đường găng | agent so với đường găng LAB-1 | Ghim chuỗi IdP + môi trường |
| P4 | Giả lập lần đầu Done 88% (chỉ có sự kiện chặn, 100% giờ cho issue; script hiện tại không tái lập được số này nên progress-report không dùng) — quá đẹp | agent | Thêm hệ số tập trung 0,8, công khai là giả định kèm độ nhạy (PR-A-13) |
| P4 | Cổng G4 vẫn PASS khi xoá vai, đổi mốc thành M-99; quá tải tính gộp che quá tải theo vai | reviewer Opus thử phá trên bản sao | Cổng kiểm vai từng mệnh đề + danh sách mốc LAB-1; tính tải theo vai (136–167%) |
| P6 | PREMISE lệch gói LAB-4 ở 2 dòng (PR-S-06, PR-A-08) và chưa khai mâu thuẫn 回収照合; báo cáo tiến độ thiếu dự báo tới M-03, còn mã nội bộ; 9 issue ghi phụ thuộc bằng mã spec, 28 issue Done chưa tick DoD; Project private trái luật đề | cross review Fable 5.1 (0 critical · 5 major · 22 minor) | Sửa PREMISE theo gói LAB-4; thêm dự báo M-03 theo nhân sự LAB-1 — tách theo vai thì Backend, QA tự động thiếu người, thành rủi ro số 1; dời chi tiết nội bộ xuống ghi chú kỹ thuật; sửa thân 38 issue + 1 comment bằng `fix-issue-hygiene.mjs` (dry-run trước, ghi sau khi user duyệt); khi kiểm lại thấy migration `customers.notification_email` chưa có issue → thêm một dòng Phạm vi vào #284; Project chuyển public |

### Quyết định đã review (DR)

PREMISE.md trỏ mã `DR-0n` về đây.

| Mã | Quyết định | Mức · domain | Phán quyết |
|---|---|---|---|
| DR-01 | Bố cục repo, mốc LAB-4 `c3cf20d`, không chép gói LAB-4 | note · bid | User quyết |
| DR-02 | GAP-41: kiểm đảo ngày lúc xuất hàng | standard · ba | Chưa đủ dữ liệu → tham số hoá, mặc định theo LAB-4, hỏi khách |
| DR-03 | Luật chia task + 15 epic | quick · ba | Sửa có điều kiện: tách E-13 nền tích hợp, việc dự án ngoài backlog trừ PJ.85–90 |
| DR-04 | Gộp backlog: trần item, xử lý 47 chỗ hở lúc gộp (thành 50 sau job bổ sung), câu hỏi có chặn không | quick · ba | Sửa có điều kiện: trần 450, chỉ 6 issue bị chặn |
| DR-05 | 5 issue đại diện SWP | standard · bid | Sửa có điều kiện: 3 sửa chỉ issue đó; user xác nhận |
| DR-06 | Quy giờ k = 1,5 giờ/SWP | quick · bid | Sửa có điều kiện: nêu rõ phần không tính |
| DR-07 | Phạm vi + kịch bản giả lập Sprint 1 | quick · tech | Sửa có điều kiện: công khai hệ số tập trung, thay "tách sub" bằng "mở lại sau lỗi hồi quy" |
| DR-08 | Go / no-go nộp bài | quick · qa | Giữ (go): cổng kiểm và review đều đạt; Project private là quyết định của user (sau cross review, user đổi Project sang public ngày 2026-10-15); kết luận estimate mục 4 vẫn đứng khi k lệch +33% |

### Chỗ lệch quy trình đã khai

- Worker chấm SWP của skill quy định không dùng tool; agent cho mỗi worker đọc đúng một file rubric và một file batch, ghi một file kết quả, để khỏi chép khoảng 500 nghìn ký tự nội dung issue qua prompt. Một worker còn tự chạy Bash để tra ô ma trận (lý do chấm vẫn viết riêng từng issue). Cả hai đã ghi trong phần lưu ý của báo cáo HTML.
- Skill hỏi user từng issue mẫu (mức rồi điểm); ở đây user xác nhận cả 5 trong một câu hỏi sau khi xem phán quyết DR-05.
- Hệ số giờ k = 1,5 do AI ước trên 6 issue, chưa có giờ thật của đội; Sprint 1 giả lập lấy giờ ước làm giờ thực nên không kiểm được k.

## 3. Điểm đặc biệt

**Chỗ hiệu quả**

- **Mọi bảng sinh từ dữ liệu.** Bảng trong 4 trên 6 file nộp (README, task-breakdown, estimate, progress-report) sinh từ `data/` bằng script, có chế độ `--check`; PREMISE và AI-report viết tay. Review chỉ cần đối chiếu dữ liệu một lần, sửa dữ liệu thì bảng tự khớp.
- **Backlog lớn mà vẫn nhất quán.** 5 subagent viết song song theo một hướng dẫn chung (thêm 1 job bổ sung), cổng tự động chặn sai luật; 433 issue lên GitHub kèm sub-issue và blocked-by gốc, chạy lại không tạo trùng.
- **Review khác model bắt lỗi thật ở mọi phase:** P2a 7 → 9/10, P3 8 → 9/10, P4 8 → 9/10. Thử phá cổng trên bản sao (đổi mốc, xoá vai) cho thấy cổng PASS sai — kiểu lỗi mà chạy cổng bình thường không bao giờ lộ.
- **User ít phải làm tay.** Khoảng 35 phút cho cả LAB-5: chốt plan, mốc LAB-4, chính sách chép gói, duyệt đẩy lên GitHub, xác nhận 5 điểm SWP. Mọi quyết định có đánh đổi đều có brief phản biện để đọc nhanh.

**Chỗ chưa tốt, cần cải thiện khi làm thật**

- **Thời gian.** Cả LAB-5 (plan + P0–P6): agent khoảng 13 giờ (P0–P5 11,8 giờ, sửa theo cross review 1,2 giờ), máy chạy nền thêm 2,1 giờ, user khoảng 35 phút (tạo issue ~10,6 giây/issue vì mỗi issue cần nhiều mutation và có hãm tốc để tránh hạn mức GitHub; ghi một field cho cả Project là 433 lượt). Khi làm thật nên ghi field theo lô và dùng Project template.
- **Công sức.** User chỉ chốt quyết định và duyệt (khoảng 35 phút cho cả LAB-5) nhưng phải duyệt từng lần đẩy lên GitHub, nên mỗi phase dừng chờ một lần. Khi làm thật nên duyệt một lần cho cả nhóm thao tác đã xem trước bằng `--dry-run`.
- **Token.** Mỗi subagent tốn sẵn khoảng 55 nghìn token ngữ cảnh trước khi làm gì. Theo số harness báo: P3 dùng khoảng 2,6 triệu token ở subagent (10 worker chấm SWP chiếm 1,4 triệu, mỗi worker batch 70 issue 168–202 nghìn), P4 khoảng 1,1 triệu (tester ~180 nghìn, reviewer Opus ~150 nghìn mỗi lượt). Thay đổi nhỏ không nên đi đủ vòng tester + reviewer + re-review; nên gộp kiểm tài liệu và kiểm code khi cùng một phase.
- **Skill chấm SWP.** Bảng discipline của skill không có loại cho việc hỏi khách / BrSE nên 39 câu hỏi khách nhận "Unknown", độ tin cậy thấp; tập issue rủi ro mà assessor 2 chấm lại vì thế chủ yếu là câu hỏi khách, còn issue 10 SWP lớn nhất chỉ có một assessor. Worker không tool không hợp với batch lớn.
- **Giả lập sprint.** Giờ thực tế bằng giờ ước, chỉ một lần sửa có giờ thêm, nên burndown phản ánh hệ số tập trung và 3 sự kiện chứ chưa phản ánh sai số ước lượng. Comment giả lập trên repo public dễ gây hiểu nhầm dù đã ghi rõ.
- **Độ hạt chưa đều.** Cross review chỉ ra 8 lá 13,5–15 giờ (gộp RPC + route cùng vai) và một số lá 1,5 giờ tách khỏi story nhỏ, cùng 13 câu hỏi khách tách một dòng một issue. Bài này không tách / gộp lại vì đổi số issue sẽ lệch báo cáo SWP đã chấm; khi làm thật nên gom hoặc tách lúc xếp sprint (task-breakdown.md mục 1).
- **Lỗi nhỏ còn để lại ở script.** Giả lập đặt Blocked cả issue chưa bắt đầu đang chờ phụ thuộc; cổng tiến độ chưa bắt issue ngoài kế hoạch bị gán sprint; cổng nộp chỉ chống chép RFP qua trích 「…」 dài và chưa bỏ qua tiêu đề nằm trong khối code. Không làm sai số trong file nộp (tester và reviewer kiểm trên dữ liệu cuối), nhưng cần sửa trước khi dùng lại script cho dự án khác.
- **Giới hạn GitHub.** API không đặt được nhóm view theo Parent issue; tên field `Type` bị giữ chỗ; Project của user không có Insights nên phải tự vẽ burndown.

**Ý tưởng**

- Thêm vào skill chấm SWP một bước "ghi lại lên tracker" có xem trước và xác nhận, thay cho việc mỗi người tự viết script ghi field.
- Giả lập sprint lấy giờ thực tế từ phân phối sai số ước lượng của các dự án thật (dữ liệu KPI nội bộ) thay vì giờ ước, khi đó mới kiểm được hệ số k.
- Biến "thử phá cổng trên bản sao" thành bước bắt buộc mỗi khi viết một cổng kiểm mới.
