# Báo cáo tiến độ — Sprint 1 (giả lập)

- Iteration: **Sprint 1** — field Iteration `Sprint` trên [GitHub Project](https://github.com/users/huongnv-0154/projects/2), 2026-11-30 → 2026-12-11 (10 ngày làm việc). Sprint 2 (2026-12-14) đã xếp sơ bộ.
- Khoảng thời gian giả lập: trọn Sprint 1. Báo cáo viết **tại thời điểm kết thúc Sprint 1 (2026-12-11)**, lập ngày 2026-10-14, cập nhật 2026-10-15; diễn biến từng ngày ghi ở comment "Giả lập Sprint 1 · ngày N (ngày)" trên từng issue. Trạng thái trên GitHub là trạng thái cuối sprint; chuyển trạng thái giữa sprint (ví dụ #181 mở lại) chỉ ghi ở comment của issue.
- Kế hoạch: 45 issue · 139 SWP · 208,5 giờ, chọn theo năng lực 27 giờ/người mỗi sprint cho 9 vai nhận issue, ưu tiên chuỗi đường găng. Kế hoạch nhân sự tháng 12/2026 trong bản đề xuất (LAB-1) chỉ khoảng 3,4 người toàn thời gian (kể cả PM), nên mỗi vai làm bán thời gian. Cuối sprint: 44 issue · 129 SWP sau khi chuyển #253 sang Sprint 2.

## 1. Trạng thái

<!-- GENERATED:status-summary sprint=Sprint_1 -->
| Trạng thái | Số issue | Tổng SWP | Ghi chú |
|---|---|---|---|
| Todo | 5 | 14 | #34, #270, #351, #368, #388 |
| In Progress | 6 | 18 | #89, #203, #292, #372, #384, #408 |
| Blocked | 5 | 7 | 5 câu hỏi khách E-15 chờ trả lời · #43, #44, #45, #52, #53 |
| Done | 28 | 90 |  |
| **Tổng** | **44** | **129** |  |
<!-- /GENERATED -->

Done 28 issue · 90 SWP = 70% phạm vi cuối. Năm issue Blocked đều là câu hỏi đã gửi khách (nhóm E-15), đang chờ khách trả lời, không phải việc của đội bị kẹt. Issue In Progress và Todo còn lại sẽ được đưa vào Sprint 2 khi lập lại kế hoạch ngày 2026-12-14 (mục 3).

## 2. Burndown

![Burndown Sprint 1 — SWP còn lại theo ngày, kế hoạch và kịch bản mô phỏng](images/burndown-sprint-1.svg)

<!-- GENERATED:burndown -->
| Ngày | Ngày lịch | Kế hoạch còn lại (SWP) | Mô phỏng còn lại (SWP) | Chênh | Phạm vi (SWP) |
|---|---|---|---|---|---|
| 0 (đầu sprint) | — | 139 | 139 | 0 | 139 |
| 1 | 2026-11-30 | 125,1 | 139 | +13,9 | 139 |
| 2 | 2026-12-01 | 111,2 | 137 | +25,8 | 139 |
| 3 | 2026-12-02 | 97,3 | 118 | +20,7 | 139 |
| 4 | 2026-12-03 | 83,4 | 118 | +34,6 | 139 |
| 5 | 2026-12-04 | 69,5 | 91 | +21,5 | 139 |
| 6 | 2026-12-07 | 55,6 | 89 | +33,4 | 139 |
| 7 | 2026-12-08 | 41,7 | 83 | +41,3 | 139 |
| 8 | 2026-12-09 | 27,8 | 70 | +42,2 | 139 |
| 9 | 2026-12-10 | 13,9 | 54 | +40,1 | 129 |
| 10 | 2026-12-11 | 0 | 39 | +39 | 129 |
<!-- /GENERATED -->

Kịch bản mô phỏng lệch kế hoạch ở bốn chỗ:

1. **Ngày 1–2 gần như đứng yên.** Các việc lớn chạy song song từ ngày 1 — dựng 4 môi trường (#392, 9 giờ) và spike JWT cho PoC SSO (#369, 9 giờ) — chưa việc nào xong trước ngày 5. Burndown chỉ giảm khi issue Done, nên việc lớn ở đầu sprint làm đường đi ngang.
2. **Ngày 3–5 tenant Entra thử của khách chưa cấp**: #384 (tạo tenant, app registration) và #368 (spike PoC điểm 1–3) Blocked. Infra và BE-1 chuyển sang việc khác nên đường vẫn giảm, nhưng chuỗi PoC SSO trễ: #384 tới ngày 8 mới bắt đầu, #368 hết sprint vẫn chưa bắt đầu.
3. **Ngày 6 mở lại #181** (chặn ô 受入数量 trống): E2E hồi quy của QA thấy số lượng 0 bị coi như ô trống. Sửa mất thêm khoảng nửa số giờ ước (2,5 giờ), #181 Done lại ngày 7; đường gần như phẳng ngày 6.
4. **Ngày 9 chuyển #253 sang Sprint 2** (PWA offline, 10 SWP, 15 giờ): còn dở, không kịp ngày 10. Phạm vi giảm 139 → 129 SWP; sprint giữ mục tiêu cho chuỗi IdP và môi trường.

Kết thúc còn 39 SWP. Nguyên nhân lớn nhất không phải ba sự kiện trên mà là cách lập kế hoạch: kế hoạch lập theo giờ danh nghĩa (27 giờ/người), trong khi mỗi người chỉ dành khoảng 80% giờ cho issue; phần còn lại cho họp sprint, trao đổi và chờ phụ thuộc — những việc không nằm trong giờ của issue. Bài học cho Sprint 2: lập kế hoạch theo 80% năng lực (mục 3).

Đường kế hoạch giữ theo phạm vi ban đầu 139 SWP; từ ngày 9 phạm vi còn 129 SWP (đường chấm), nên khoảng cách giữa mô phỏng và kế hoạch ở ngày 9–10 có 10 SWP là do bớt phạm vi chứ không phải làm chậm.

QA kiểm thủ công gần như chưa có việc trong backlog; phần năng lực này chuyển sang chuẩn bị UAT và phụ viết ca kiểm tự động (mục 3). Năm câu hỏi E-15 được hỏi lại đúng ngày đã hẹn (ngày 6–10), khách vẫn chưa trả lời.

## 3. Rủi ro trễ

Mốc theo lịch tổng của bản đề xuất: **M-03** xong phát triển và test nội bộ (2027-04-02), **M-06** xong UAT (2027-05-14). Dòng rủi ro đầu tiên lấy từ dự báo dưới đây; các dòng còn lại rút từ rà kế hoạch Sprint 2 theo ba góc nhìn: kiến trúc, bảo mật, phản biện.

<!-- GENERATED:milestone-projection -->
**Dự báo tới M-03 (2027-04-02).** Sau Sprint 1 còn 1986,5 giờ việc (248,3 MD, 1 MD = 8 giờ). Năng lực từ 2026-12-14 tới M-03 theo kế hoạch nhân sự của bản đề xuất, trừ PM (72 ngày làm việc theo lịch Nhật): 2301,9 giờ nếu dành 100% giờ cho issue, 1841,5 giờ nếu dành 80% giờ cho issue (như Sprint 1).

Dồn chung mọi vai thì dư 39,4 MD ở 100% (xong khoảng 2027-03-18), thiếu 18,1 MD ở 80% (xong khoảng 2027-04-12).

Tách theo vai thì không kịp ngay cả ở 100%: Backend thiếu 21,6 MD (xong khoảng 2027-05-07), QA tự động thiếu 21,7 MD (chưa xong khi hết kế hoạch nhân sự 2027-06-30, còn thiếu 1,9 MD). Ở 80%: Backend chưa xong khi hết kế hoạch nhân sự 2027-06-30, còn thiếu 9,4 MD, QA tự động chưa xong khi hết kế hoạch nhân sự 2027-06-30, còn thiếu 11,3 MD, Infra xong khoảng 2027-04-06. Phần dư nhiều nhất nằm ở QA thủ công và Frontend, không chuyển ngay sang Backend và QA tự động được. Kế hoạch nhân sự của bản đề xuất kết thúc 2027-06-30 nên dự báo dừng ở đó.

Nếu phần code phải xong trước khi pha phát triển của bản đề xuất kết thúc (2027-03-05, 53 ngày làm việc), Backend thiếu 46,7 MD ở 100%, thiếu 62,8 MD ở 80%; Frontend dư 16,3 MD ở 100%, dư 5,9 MD ở 80%.

Giả định chính: kế hoạch nhân sự của bản đề xuất còn gánh cả diễn tập chuyển đổi dữ liệu và giai đoạn test, nên năng lực thật cho backlog thấp hơn các số trên — phần thiếu thực tế còn lớn hơn.
<!-- /GENERATED -->

Kế hoạch Sprint 1 và Sprint 2 chia đều 27 giờ cho mỗi vai; dự báo trên dùng cơ cấu vai của kế hoạch nhân sự đề xuất, trong đó Backend có nhiều giờ nhất. Mức quá tải theo vai ở dòng thứ ba là của kế hoạch Sprint 2 hiện tại; khi lập lại Sprint 2 sẽ chia giờ theo cơ cấu vai đó và cấp thêm người như dòng đầu.

| Rủi ro | Issue | Ảnh hưởng tới mốc nào | Hành động | Ai làm, khi nào |
|---|---|---|---|---|
| Không kịp M-03 nếu giữ nhân sự theo kế hoạch đề xuất: tách theo vai, Backend thiếu 21,6 MD và QA tự động thiếu 21,7 MD ngay cả khi dành 100% giờ cho issue (ở 80%: thiếu 42,7 và 27,1 MD); phần dư nằm ở QA thủ công và Frontend | #373, #376, #407, #240, #375, #379 | M-03 — Backend xong khoảng 2027-05-07; QA tự động chưa xong khi hết kế hoạch nhân sự 2027-06-30, còn thiếu 1,9 MD (ở 80%: cả hai chưa xong khi hết kế hoạch, Backend còn thiếu 9,4 MD, QA tự động còn thiếu 11,3 MD); kéo theo M-06 | Trình khách ba phương án: (1) thêm 1 Backend và 1 QA tự động toàn thời gian từ 2027-01-04 — mỗi người khoảng 61 ngày làm việc tới M-03, đủ bù phần thiếu ở 80% tới M-03 (nếu code Backend phải xong trước khi pha phát triển kết thúc thì phần thiếu lớn hơn — xem dự báo trên — cần thêm người sớm hơn hoặc nhiều hơn); (2) chuyển một phần chức năng ngoài đường găng sang sau M-03; (3) dời M-03. Trong lúc chờ, QA-1 nhận một phần ca kiểm tự động | PM trình ở họp tuần với khách 2026-12-16; PM chốt phương án trước 2026-12-25 (thêm người do phía đội phát triển quyết, giảm phạm vi hoặc dời mốc do khách quyết); QA-1 nhận ca kiểm tự động từ 2026-12-14 |
| Chuỗi PoC SSO trễ một sprint: tenant cấp trễ, spike điểm 1–3 chưa chạy; code đăng nhập SSO (#127) chưa xếp sprint nào | #384, #368 | M-03 — đăng nhập SSO đứng đầu đường găng của bản đề xuất (FG-11 → FG-10 → FG-03 → …) | Xong #384 trước pipeline; chạy #368 ngày đầu Sprint 2; xếp thêm báo cáo PoC (#370, chưa xếp sprint) vào Sprint 2 khi lập lại kế hoạch và quyết định tiếp / dừng SSO trước khi code đăng nhập SSO (#127); điểm 1–3 trượt thì dùng phương án dự phòng đã thiết kế (#433) | Infra + BE-1, 2026-12-14 → 12-18; BrSE chốt quyết định trước 2026-12-25 |
| Sprint 2 quá tải theo vai (theo cách chia hiện tại 27 giờ mỗi vai; sẽ đổi khi lập lại Sprint 2 theo cơ cấu vai đề xuất): kế hoạch lập theo giờ danh nghĩa (27 giờ/người) cộng 39,5 giờ còn dở của Sprint 1, trong khi mỗi người làm được khoảng 21,6 giờ (80% × 27) → 7 vai giao hàng ở 136–167% (BE-1 36 giờ, QA-Auto 32,4 giờ); QA-1 không có việc, BrSE 81% | #396, #397, #275, #235, #302, #306, #354, #358, #362, #366 | M-03 — trễ dồn sang các sprint sau | Lập lại Sprint 2 theo 21,6 giờ mỗi vai, issue dở của Sprint 1 trước; dời 8 issue Design (#275 … #366) sang Sprint 3 vì không nằm trên đường găng; vai nào còn vượt thì dời tiếp issue không nằm trên đường găng (FG-04, FG-07); QA-1 (gần như không có việc ở Sprint 1) nhận chuẩn bị kiểm thủ công / UAT | PM, buổi lập kế hoạch Sprint 2 ngày 2026-12-14 |
| 5 câu hỏi khách chưa trả lời, chặn phần hoàn thiện nhập hàng (ngày sản xuất, người duyệt ticket nhiệt, nhãn lô) và tồn kho (lý do đổi trạng thái lô, lô HOLD) | #43, #44, #45, #52, #53 | M-03 (hoàn thiện FG-02, FG-03); nghiệm thu chức năng ở M-06 | Đã hỏi lại một lần trong Sprint 1 (ngày 6–10), vẫn chưa có trả lời: hỏi lần hai đầu Sprint 2; quá 2026-12-18 chưa trả lời thì làm theo giả định đã chốt ở thiết kế (có tham số để đổi khi khách trả lời) và ghi lại thành giả định của dự án | BrSE hỏi lần hai 2026-12-14; PM đưa vào buổi họp tuần với khách 2026-12-16 |
| #253 chuyển sang Sprint 2 làm FE-2 quá tải: phần còn lại của PWA offline (4,6 giờ) cộng 5 việc FE của FG-03, FG-05, FG-07 = 30,1 giờ, so với khoảng 21,6 giờ làm được | #253, #217, #254, #85, #259, #58 | M-03 — POD offline nằm trên luồng giao hàng FG-05 | FE-2 làm #253 trước; ngày 2026-12-18 chưa xong thì tách phần mã hoá IndexedDB thành issue riêng và chấm SWP lại; dời #58 (FG-07, không nằm trên đường găng) sang Sprint 3; BE-2 hỗ trợ phần đồng bộ | FE-2 + BE-2, 2026-12-14 → 12-18 |
| Infra dồn việc: pipeline build / deploy và migration 21 giờ, cộng 3,9 giờ còn dở của #384, #388 | #384, #388, #396, #397 | M-06 — môi trường test / UAT; M-03 | Thứ tự #384 → #396 → #397; #388 (1,5 giờ) giao BE-2 nếu Infra hết giờ ngày 2026-12-22 | Infra; PM xem lại ở daily 2026-12-22 |

Ngoài bảng:

- Một số việc lộ ra sau khi lập backlog (rà prototype và rà thiết kế: kiểm 960 giờ làm thêm mỗi năm, ngày hiệu lực của vị trí và đối tác, dữ liệu vị trí khi chụp POD, 4 lỗi prototype) chưa nằm trong ước lượng: PM tạo issue và ước lượng ở buổi tinh chỉnh đầu Sprint 2 (2026-12-14); phần thiếu năng lực ở dòng rủi ro đầu sẽ lớn thêm tương ứng (danh sách ở estimate.md mục 4).
- Góc nhìn bảo mật yêu cầu route worker nội bộ #377 chỉ merge khi bộ assert phủ định quyền job_worker (#372) đã Done — ghi vào điều kiện hoàn thành của #377 khi lập lại Sprint 2.
- Lỗi hồi quy #181 tới tay QA mới lộ, sửa muộn tốn hơn sửa sớm: QA-Auto thêm ca "受入数量 = 0" vào bộ kiểm của #34 ngày 2026-12-14; cổng CI #399 (unit + E2E smoke trước khi merge) xong trong Sprint 2, trước 2026-12-25.

## Ghi chú kỹ thuật (cho người review bài, không gửi khách)

Phần này giữ chi tiết mô hình và nguồn số liệu; thân báo cáo phía trên không cần đến nó để đọc.

<!-- GENERATED:snapshot-time -->
Bảng §1 sinh từ snapshot Project lúc 2026-10-14T13:37Z.
<!-- /GENERATED -->

- Chọn issue Sprint 1: `scripts/plan-sprint.mjs` theo năng lực 27 giờ/người/sprint và chuỗi đường găng (PREMISE PR-A-02, PR-A-03, PR-A-13; DR-07). Giả lập: `scripts/simulate-sprint.mjs` với ba sự kiện khai trước trong `data/sprint-1-scenario.json`; tenant cấp trễ theo PR-A-04. Câu hỏi E-15 Blocked khi chờ khách là theo DoD của E-15 (PR-A-04).
- Hệ số 0,8 (phần giờ dành cho issue) là giả định của mô hình, chưa đo được trên đội thật (PR-A-13). Độ nhạy, lưu kèm lệnh ở `data/sprint-1-sensitivity.json` (luôn đủ ba sự kiện, script không bật / tắt từng sự kiện): 90% → Done 78% (100 / 129 SWP); 80% → Done 70% (90 / 129 SWP); 100% → không chạy được vì #253 Done trước ngày 9 nên không chuyển sprint được. Hai số 88% và 65% ở bản trước (chỉ giữ sự kiện tenant trễ) không tái lập được bằng tuỳ chọn hiện có của script nên đã bỏ.
- Giờ thực tế trong giả lập bằng giờ ước (trừ phần sửa của #181), nên Sprint 1 chưa kiểm được hệ số giờ k = 1,5 của estimate.md mục 2.
- Giờ rảnh theo người ở Sprint 1 (`data/sprint-1-log.json`, idleHoursByRole): QA-1 17,1 giờ (backlog gần như không có việc kiểm thủ công, estimate.md mục 4), BE-1 3,6 giờ ngày 9–10 vì #368 phải chờ #384, FE-2 2,2 giờ ngày 10 vì #253 đã chuyển sprint.
- Rủi ro §3 (trừ dòng dự báo) rút bằng `tkm:predict-risks`, 3 góc nhìn: kiến trúc, bảo mật, phản biện. Dòng câu hỏi khách: giả định có tham số theo PR-D-04, ghi vào PREMISE.
- Dự báo §3: `scripts/project-milestone-capacity.mjs` → `data/milestone-projection.json` (tất định). Nhân sự theo tháng chép từ bảng 要員計画 của LAB-1 schedule.md vào `data/sprint-config.json` (`lab1Staffing`, có ghi nguồn); ngày lễ Nhật ghi cứng trong script. Việc còn lại = mọi lá trong `data/hours.final.json`: lá Done tính 0, lá Sprint 1 chưa xong tính hoursLeft, lá khác đủ giờ. Không dùng phép chiếu phẳng 139 SWP/sprint vì nhân sự LAB-1 tăng dần từ 68,8 MD (tháng 12) lên 95,4 MD (tháng 3).
- Phương án thêm người: 2027-01-04 → 2027-04-02 có 61 ngày làm việc; ở 80% mỗi người được 48,8 MD, lớn hơn phần thiếu của Backend (42,7 MD) và QA tự động (27,1 MD).
