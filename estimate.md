# Estimate — SWP và giờ ước lượng

Báo cáo HTML của skill chấm SWP: [swp-report/report.html](swp-report/report.html) — skill `estimate-swp`, mức `high`, nguồn là chính [GitHub Project](https://github.com/users/huongnv-0154/projects/2), 353 issue lá được chấm, 80 container (15 epic, 65 story) lấy tổng của con, calibration `calibrated`. Mở file bằng trình duyệt, không cần mạng.

Tổng: **1437 SWP · 2155,5 giờ ≈ 269,4 MD** (chỉ issue trong backlog; không gồm UAT, đào tạo, hypercare, quản trị dự án, buffer lịch — xem mục 2 và 4).

## 1. Issue mẫu skill chọn để kiểm

Skill tự chọn 5 issue bằng luật cố định: nhỏ nhất, trung vị, lớn nhất, xa trung vị nhất, và một issue mà hai assessor độc lập (sonnet, opus) chấm lệch nhau. Trước khi chốt, mình chạy một vòng phản biện (một Challenger khác model hỏi lại từng điểm; mình trả lời bằng thân issue và rubric), rồi xác nhận cả 5 điểm.

<!-- GENERATED:swp-representatives -->
| Issue | Skill chấm (Scope × Complexity → SWP) | Assessor 2 | Bạn chốt | Lý do |
|---|---|---|---|---|
| [#8](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/8) FG01-02.2 Form B YC_MASTER_SKU — Hiện lỗi SKU_ALREADY_EXISTS trên form | 1 × 1 → **1** (rất dễ) | — (không thuộc tập chấm lại) | Giữ: 1 × 1 → **1** (rất dễ) | Giữ: một form, map một mã lỗi sang thông báo, một test component — đúng S1 "một thành phần đơn giản", C1 "lỗi/validation thường"; issue cùng nhóm UI·bugfix cũng 1. |
| [#246](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/246) FG04-12.4 Assert SQL 4 tổ hợp + E2E | 3 × 1 → **4** (dễ) | — (không thuộc tập chấm lại) | Sửa: 3 × 2 → **5** (dễ) | Sửa 4 → 5: 4 tổ hợp tham số luật BR-DATE-01 (đã tham số hoá ở DR-02), fixture chuyến COMPLETED và DISPATCHED chưa POD cho hai đơn cùng khách × SKU, dòng audit và phiên bản luật — là thiết kế test cẩn thận (C2). Chỉ issue này: 12 issue khác cùng nhóm (13 kể cả #246), phần lớn là E2E hồi quy theo màn. |
| [#360](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/360) FG12-06.1 RPC record_migration_signoff + POST signoffs + query đối chiếu (SPEC-YC-240) | 5 × 3 → **10** (vừa) | — (không thuộc tập chấm lại) | Sửa: 5 × 2 → **8** (vừa) | Sửa 10 → 8: "đồng thời" chỉ là ràng buộc unique (23505) cộng kiểm lại bất biến dưới khoá — mẫu quen, không phải lập luận đồng thời đáng kể (C3); độ khó nằm ở 8 nhánh lỗi (C2). Scope giữ 5 (API + DB behavior). Chỉ issue này: nhóm cùng chữ ký trải 6–10. |
| [#227](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/227) FG07-02.3 RPC import_temp_readings + route — Xác minh tệp, chống trùng, ghi một transaction | 5 × 3 → **10** (vừa) | — (không thuộc tập chấm lại) | Giữ: 5 × 3 → **10** (vừa) | Giữ: một route + một RPC trong một transaction, một repo, một DB → Scope 5, không phải 8; khoá theo thiết bị rồi theo hash cho hai request song song là lập luận đồng thời thật (C3). Challenger đề xuất S8 (16 SWP) bị bác. |
| [#9](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/9) FG01-03.1 Spec — Màn quản lý rule_versions, API và DB đích (maker-checker) | 3 × 1 → **4** (dễ) | 5 | Sửa: 3 × 2 → **5** (dễ) | Sửa 4 → 5: mẫu BM-2-901 quy định hình thức, không giảm quyết định nội dung — phải chốt vai trò lập/duyệt, hiển thị source_verified, luồng 起票→承認 (C2); assessor 2 cũng chấm 5. Không có issue cùng nhóm. |
<!-- /GENERATED -->

Ba chỗ sửa chỉ áp cho chính issue đó, không lan sang issue cùng nhóm: nhóm cùng loại của #360 đang trải từ 6 đến 10 SWP, của #246 từ 3 đến 6 (12 issue khác cùng chữ ký scope / complexity và vai QA, 13 kể cả #246; báo cáo HTML giữ nguyên lời ghi lúc chốt là 11, đếm sai một), nên lan một bậc sẽ ghi đè các điểm vốn đã phân biệt đúng. Sau khi chốt, tổng vẫn 1437 SWP (+1, +1, −2).

Hai assessor được so trên 39 issue rủi ro (độ tin cậy thấp — chủ yếu câu hỏi khách E-15): 7 trùng, 24 lệch một bậc, 8 khác nhóm phân loại, không issue nào lệch từ hai bậc. Issue 10 SWP (#227, #360) không thuộc tập rủi ro nên chỉ có một assessor — đây là lý do mình phản biện kỹ hai issue này.

## 2. Cách quy ra giờ

**Cách chọn:** quy ước đổi SWP ra giờ bằng một hệ số k, không ước tay từng issue.

**Vì sao:** SWP đã qua kiểm ở mục 1 là thang chung cho cả 353 issue. Ước tay từng issue thì mỗi lần ước dùng một thang ngầm khác nhau, và tốn công gấp nhiều lần. Một hệ số k lại kiểm được: lấy vài issue ước trực tiếp, xem giờ/SWP có ổn định không.

**Quy tắc:**

- Giờ issue lá = SWP × k, k = **1,5 giờ/SWP**. SWP là số nguyên nên kết quả luôn là bội của 0,5 giờ.
- Giờ của story và epic = tổng giờ các con, không quy lại từ SWP.
- Áp cho mọi issue, kể cả câu hỏi khách E-15 (1 SWP → 1,5 giờ: soạn câu hỏi, gửi, theo dõi, phản ánh câu trả lời vào issue).

**Hiệu chuẩn k:** chọn 6 issue lá ở 6 ô khác nhau của ma trận Scope × Complexity, trải 4 vai, ước giờ trực tiếp theo từng bước. Giả định: một dev tầm trung đã quen stack (Next.js + Supabase/Postgres), có spec LAB-4; tính cả code, tự test và sửa sau review; không tính thời gian chờ issue chặn.

<!-- GENERATED:hours-calibration -->
| Issue | Vai | Scope × Complexity | SWP | Giờ ước | Giờ/SWP | Chia theo bước |
|---|---|---|---|---|---|---|
| [#36](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/36) FG02-06 | FE-1 | 1 × 1 | 1 | 2 | 2 | code kiểm ô trống trước khi đổi giờ 1h · test component 0,5h · review/sửa 0,5h |
| [#7](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/7) FG01-02.1 | BE-1 | 2 × 1 | 3 | 4 | 1,33 | kiểm tồn tại mã + RAISE YC422 trong RPC 1,5h · map route + cập nhật API spec 1h · assert SQL 2 ca + gọi RPC trực tiếp 1h · review 0,5h |
| [#16](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/16) FG01-05.4 | QA-Auto | 3 × 1 | 4 | 6 | 1,50 | seed ~3.600 SKU tổng hợp 1,5h · assert SQL phiên bản 1h · E2E 3 luồng (duyệt, lọc, retired) 3h · ổn định CI 0,5h |
| [#166](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/166) E14-12 | Infra | 3 × 2 | 5 | 8 | 1,60 | dựng 4 tình huống lỗi 3h · kiểm cảnh báo 3 kênh 2h · tra theo correlationId + đo thời gian 2h · ghi điểm hở runbook 1h |
| [#13](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/13) FG01-05.1 | BE-1 | 5 × 2 | 8 | 12 | 1,50 | migration tách bảng phiên bản + chuyển dữ liệu 5h · FK ở bảng giao dịch 2h · chỉ mục 1h · chạy dev → test, kiểm không mất dòng 2h · assert không chồng 発効日 2h |
| [#251](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/251) FG05-02.2 | BE-2 | 5 × 3 | 10 | 14 | 1,40 | RPC kiểm schema, SHA-256, khoá advisory 5h · nhánh SYNCED / CONFLICT / ROUTE_NOT_ACTIVE 3h · domain POD_OFFLINE_QUEUE 2h · unit test + assert SQL 4h |
| **Tổng** |  |  | **31** | **46** | **1,48 → k = 1,5** |  |
<!-- /GENERATED -->

Bộ hiệu chuẩn không có vai Design và BrSE, nên mình kiểm nhanh thêm: Design UI theo wireframe 2 SWP → 3 giờ, câu hỏi khách 1 SWP → 1,5 giờ — đều hợp lý. Giờ/SWP của 6 issue nằm trong khoảng 1,33–2,0. Lệch nhiều nhất là #36 (+33% so với k), dưới ngưỡng 50% đã đặt để tách k theo loại việc, nên giữ một k chung. Issue 1 SWP bị tính thấp khoảng 0,5 giờ mỗi cái (phí review, CI cố định) — 31 issue × 0,5 giờ ≈ 15,5 giờ, dưới 1% tổng, chấp nhận. k cũng khớp luật chia task: issue lá lớn nhất 10 SWP → 15 giờ, không vượt 16 giờ (task-breakdown.md mục 1).

**Áp nhất quán:** giờ không gõ tay. `scripts/derive-hours.mjs` đọc SWP đã chốt (`data/swp-scores.final.json`, xuất từ payload nhúng trong HTML) và k (`data/hours-calibration.json`), ghi `data/hours.final.json`, dừng nếu có lá vượt 16 giờ. Agent ghi field `Estimated time` từ file đó, rồi `scripts/check-project.mjs --require-points --require-hours` kiểm mọi item có giờ, cha = tổng con, lá ≤ 16 giờ.

**Không tính:** giờ chỉ gồm việc nằm trong issue. Không gồm UAT, đào tạo, hypercare, diễn tập di trú + cutover, quản trị dự án và buffer lịch — đó là việc dự án ngoài backlog (PREMISE PR-D-02), so riêng ở mục 4.

**Lưu ý:** báo cáo HTML có khung đổi SWP ↔ giờ cho người đọc tự chỉnh hệ số — chỉ để tham khảo; k ở đây là quy ước riêng của estimate này (PREMISE PR-A-05). Giờ hiệu chuẩn do AI ước, chưa có số thực tế của đội. Giả lập Sprint 1 lấy giờ ước làm giờ thực tế nên không kiểm được k (progress-report.md mục 2); phải có giờ đo của đội thật mới so được.

Độ nhạy của k: k hiệu chuẩn từ giờ do AI ước trên 6 issue, chưa có giờ thật của đội. Nếu k thật là 2,0 (lệch +33 %, bằng issue lệch nhiều nhất lúc hiệu chuẩn) thì tổng là khoảng 2874 giờ ≈ 359 MD — vẫn thấp hơn LAB-1 nhiều, nên kết luận ở mục 4 không đổi; còn dự báo tới mốc M-03 (progress-report.md mục 3) thì thiếu người nhiều hơn. k được xem lại khi có giờ thật của Sprint 1.

## 3. Tổng theo epic

<!-- GENERATED:estimate-by-epic -->
| Epic | Số issue (lá) | Tổng SWP | Tổng giờ | Ghi chú |
|---|---|---|---|---|
| FG-01 マスタ管理 | 12 | 50 | 75 | 3 story · 9,4 MD |
| FG-02 入荷・検品・ロット生成 | 31 | 107 | 160,5 | 6 story · 20,1 MD |
| FG-03 在庫・ロケーション・隔離 | 13 | 47 | 70,5 | 3 story · 8,8 MD |
| FG-04 受注・アロケーション・ピッキング | 23 | 91 | 136,5 | 5 story · 17,1 MD |
| FG-05 配送・POD・クレーム | 21 | 90 | 135 | 2 story · 16,9 MD |
| FG-06 ルート計画・拘束時間 | 18 | 78 | 117 | 4 story · 14,6 MD |
| FG-07 温度監視・逸脱・HACCP | 19 | 80 | 120 | 4 story · 15 MD |
| FG-08 トレーサビリティ・回収 | 21 | 104 | 156 | 4 story · 19,5 MD |
| FG-09 レポート・監査エクスポート | 25 | 137 | 205,5 | 4 story · 25,7 MD |
| FG-10 外部インターフェース | 23 | 114 | 171 | 5 story · 21,4 MD |
| FG-11 認証・権限・監査ログ | 20 | 83 | 124,5 | 4 story · 15,6 MD |
| FG-12 データ移行・カットオーバー | 23 | 106 | 159 | 5 story · 19,9 MD |
| E-13 外部連携基盤 | 26 | 108 | 162 | 7 story · 20,3 MD |
| E-14 環境・運用基盤 | 36 | 160 | 240 | 9 story · 30 MD |
| E-15 顧客確認 | 42 | 82 | 123 | 0 story · 15,4 MD |
| **Tổng** | **353** | **1437** | **2155,5** | **269,4 MD** |
<!-- /GENERATED -->

MD = giờ / 8, làm tròn 0,1 ở từng dòng; dòng Tổng quy từ tổng giờ (2155,5 / 8), nên cộng tay cột MD có thể lệch vài phần mười.

## 4. So với estimate LAB-1

LAB-1 tính 778,6 MD = chức năng FG-01…FG-12 496,3 MD + việc dự án (PJ) 282,3 MD, trong PJ có buffer lịch 20% là 129,8 MD. LAB-5 MD = giờ / 8.

<!-- GENERATED:estimate-vs-lab1 -->
| Phần | LAB-1 (MD) | LAB-5 (MD) | Chênh | Vì sao |
|---|---|---|---|---|
| FG-01 マスタ管理 | 29,6 | 9,4 | -20,2 | 8/8 chức năng đã chạy ở prototype; còn sửa L5, phiên bản SKU + 発効日 (PR-S-05) và màn rule_versions (ADR-0006) |
| FG-02 入荷・検品・ロット生成 | 33,9 | 20,1 | -13,8 | 6/7 đã chạy; nhãn lô F-070 ngoài prototype nên làm mới cả máy in và agent (PR-A-11); thêm cột nguồn receipts (PR-S-06) |
| FG-03 在庫・ロケーション・隔離 | 35,7 | 8,8 | -26,9 | 7/7 đã chạy; còn sửa L5 và màn chỉ có thiết kế |
| FG-04 受注・アロケーション・ピッキング | 79,4 | 17,1 | -62,3 | 9/9 đã chạy (phần lớn nhất của prototype); còn sửa L5, kiểm đảo ngày lúc xuất GAP-41 (PR-S-01, PR-S-02, PR-D-01, PR-A-06), máy quét SDK (PR-A-12) |
| FG-05 配送・POD・クレーム | 30,1 | 16,9 | -13,2 | 5/6 đã chạy, 1 mock; POD offline (PWA, đồng bộ, xung đột) làm thật |
| FG-06 ルート計画・拘束時間 | 43 | 14,6 | -28,4 | 4/5 đã chạy, 1 ngoài prototype; giới hạn giờ lái 2024 tách thành issue riêng (PR-S-04, PR-A-07) |
| FG-07 温度監視・逸脱・HACCP | 64,7 | 15 | -49,7 | 8/8 đã chạy; còn nạp file logger thật (IF-LOG-01) và sửa L5 |
| FG-08 トレーサビリティ・回収 | 45,7 | 19,5 | -26,2 | 2/4 đã chạy, 2 ngoài prototype → case thu hồi, thông báo, 3 lane truy xuất làm mới theo spec đích |
| FG-09 レポート・監査エクスポート | 34,2 | 25,7 | -8,5 | 2/4 đã chạy, 2 ngoài prototype → 8 mẫu 帳票, gói xuất audit, retention / purge làm mới; tỷ lệ còn lại cao nhất trong 12 FG |
| FG-10 外部インターフェース | 28,8 | 21,4 | -7,4 | 3 mock + 1 ngoài prototype → ERP, bản đồ, mail, archive làm thật; khung job chung tách sang E-13 (PR-A-11) |
| FG-11 認証・権限・監査ログ | 30,6 | 15,6 | -15 | 2 đã chạy, 2 mock → SSO Entra sau PoC (PR-D-03); nền tích hợp IdP tách sang E-13 |
| FG-12 データ移行・カットオーバー | 40,6 | 19,9 | -20,7 | 4/4 ngoài prototype → làm mới công cụ di trú; diễn tập và cutover thật (PJ.78–80) vẫn là việc dự án ngoài backlog |
| PJ ngoài chức năng ↔ E-13 + E-14 + E-15 | 282,3 | 65,6 | -216,7 | PJ của LAB-1 gồm buffer 20% (129,8), UAT (21), hypercare (26), đào tạo (14), diễn tập di trú + cutover (43), quản trị (12), danh sách ngoại lệ (2) — ngoài backlog (PR-D-02); chỉ PJ.85–90 (34,5) vào E-14; E-13 là nền tích hợp tách từ FG-10/11; E-15 là 42 câu hỏi khách (BrSE), việc mới |
| **Tổng** | **778,6** | **269,4** | **-509,2** | (a) prototype đã chạy 53 chức năng = 356/496,3 MD chức năng; (b) LAB-1 tính cả PM 57,4 + BrSE 37,2 + QA thủ công 64,2 MD trong FG, backlog chỉ có việc của issue; (c) việc dự án và buffer ở PJ nằm ngoài backlog; (d) PREMISE thêm việc (PR-S-05/06, PR-S-04, kiểm đảo ngày lúc xuất PR-S-01, PR-D-01) và tách nền E-13/E-14 |
<!-- /GENERATED -->

Cột LAB-5 làm tròn 0,1 ở từng dòng; dòng Tổng quy từ tổng giờ như mục 3, nên cộng tay cột LAB-5 ra 269,6 và cột Chênh ra −509,0 thay vì 269,4 và −509,2. LAB-1 trước buffer là 648,8 MD (778,6 − 129,8).

LAB-5 thấp hơn LAB-1 khoảng 509 MD vì bốn nguyên nhân, xếp theo độ lớn:

1. **Prototype đã chạy** (LAB-3/4): 53/70 chức năng đã dựng, tương đương 356/496,3 MD phần chức năng của LAB-1. "Đã dựng" nghĩa là phần chức năng đã chạy trên prototype; việc đưa lên production (hoá cứng, NFR, tích hợp thật) nằm ở E-13, E-14 và các task L5, đã có trong 1437 SWP. Con số này chưa trừ effort sửa các lỗi prototype tìm sau khi đăng issue (danh sách "Việc đã biết nằm ngoài 1437 SWP" ở cuối mục này). Backlog LAB-5 chỉ gồm phần còn lại theo detail design LAB-4: sửa theo bảng chênh lệch (task L5), làm thật phần mock (6 chức năng, 44,4 MD) và phần ngoài prototype (11 chức năng, 95,9 MD), cùng hồi quy E2E. Vì vậy các FG đã dựng hết (FG-01, 03, 04, 07) chỉ còn 21–32% so với LAB-1, còn FG-09 và FG-10 (phần lớn là mock hoặc ngoài prototype) còn khoảng 3/4.
2. **Việc dự án và buffer nằm ngoài backlog** (PREMISE PR-D-02): UAT, đào tạo, hypercare, diễn tập di trú + cutover, quản trị và buffer 20% của LAB-1 không thành issue. Chỉ PJ.85–90 (tải, threat model, SBOM, restore, accessibility, quan sát — 34,5 MD) vào E-14.
3. **Cách tính khác:** dòng FG của LAB-1 gồm cả PM 57,4 + BrSE 37,2 + QA thủ công 64,2 = 158,8 MD. Backlog chỉ có việc gắn với issue — PM chỉ đứng tên 15 epic, không có issue lá; BrSE có 48 issue (42 câu hỏi E-15 và 6 việc viết spec, chốt danh sách, gửi yêu cầu cho khách); QA thủ công chỉ có 1 issue (checklist WCAG), phần còn lại dồn vào UAT.
4. **PREMISE thêm việc:** 10 việc thiết kế đích có mà bảng chênh lệch bỏ sót (PR-S-05), cột nguồn cho receipts (PR-S-06), tách kiểm giờ lái nhiều ngày (PR-S-04), kiểm đảo ngày lúc xuất GAP-41 (PR-S-01, PR-D-01), và tách nền tích hợp / vận hành thành E-13, E-14 — phần này làm LAB-5 tăng lên, không giảm.

So cùng phạm vi: nếu cộng lại phần LAB-5 không tính (buffer 129,8 + việc dự án ngoài E-14 khoảng 118 MD) thì tổng xấp xỉ 517 MD, vẫn thấp hơn 778,6 MD chủ yếu vì phần đã dựng ở prototype.

**Việc đã biết nằm ngoài 1437 SWP.** Các việc dưới đây lộ ra sau khi đã đăng issue và chấm SWP: qua bài chấm prototype LAB-3 (2026-10-15) và kết quả chấm thiết kế LAB-4 (2026-10-19). Chưa tạo issue, chưa chấm SWP. PM tạo issue và chấm SWP ở buổi tinh chỉnh đầu Sprint 2 (2026-12-14); khi đó tổng SWP, giờ và phần thiếu năng lực ở dự báo tới M-03 (progress-report.md mục 3) tăng tương ứng.

- Lỗi hành vi prototype (bài chấm LAB-3), không phải chỗ hở spec: lập tuyến bỏ trống 作業時間 thì tuyến kẹt, không sửa / xoá được (thiết kế đích có banner 作業時間 chưa nhập và sửa bản nháp tuyến bằng `replace_route_stops`, một phần của [#98](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/98), nhưng chưa có issue cho lỗi kẹt); 受注一覧 vẫn ghi ピッキング済み sau khi POD xong; 拘束時間チェック結果 hiện giờ UTC, trái quy ước JST của LAB-4; dòng rỗng 「1 （）」 sau khi tạo tuyến, chưa lần ra nguồn.
- Chỗ hở spec từ bài chấm LAB-3: tự mở hồ sơ sai lệch khi kiểm hàng nhập ngoài dải (GAP-L5-54); cách làm tròn quy tắc 1/3, hỏi cùng [#78](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/78) (GAP-L5-55, mặc định ở PREMISE PR-A-15).
- Từ kết quả chấm LAB-4: kiểm 960 giờ 超勤 / năm và báo slot dựa vào làm thêm (PREMISE PR-S-07, mở rộng [#94](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/94)); 発効日 và vòng đời cho vị trí, khách, nhà cung cấp (GAP-L5-56); metadata POD — toạ độ hoặc lý do thiếu, sửa bằng chứng thành phiên bản mới (GAP-L5-57); rà nốt các dòng "thay đổi đích" khác trong DB design LAB-4 xem còn trường nào chưa có issue.
- Có thể đổi phạm vi issue đã có: mâu thuẫn thiết kế phiên bản SKU trong LAB-4 (GAP-L5-58, ảnh hưởng [#13](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/13), [#14](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/14)).

Ước thô lúc đối chiếu (chưa chấm bằng skill): ba việc từ kết quả chấm LAB-4 khoảng 42–51 SWP, tức khoảng 3 % của 1437 SWP; các lỗi prototype nhỏ hơn.
