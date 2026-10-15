# Yuki cold-chain — LAB-5: backlog, GitHub Project và báo cáo tiến độ

- Dự án: 食品コールドチェーン業務支援システム（ユキ物流株式会社）
- Mã học viên: `huongnv-0154` (tài khoản GitHub, dùng thay mã học viên)
- Đề: Product B — chuỗi kho lạnh thực phẩm

## Tổng quan

- **Mốc LAB-4:** backlog break từ gói detail design LAB-4 bản đã nộp ngày **2026-10-13** (commit `c3cf20d` của repo LAB-3/4). Gói LAB-4 không chép vào repo này; spec được trỏ bằng mã và đường dẫn file của gói (luật repo public: không chép đoạn RFP hay đề gốc).
- **PREMISE.md có thay đổi:** 6 dòng thêm / sửa spec (PR-S-01…06, lớn nhất là kiểm đảo ngày xuất hàng GAP-41, bản sửa ở `premise-revisions/`), 12 giả định bổ sung (PR-A-01…13, trừ PR-A-08 là mã trỏ quy ước LAB-4), 4 hướng đã chốt (PR-D-01…04).
- **Backlog:** 15 epic (12 nhóm chức năng FG-01…FG-12 của LAB-1, thêm E-13 外部連携基盤, E-14 環境・運用基盤, E-15 顧客確認) → 65 story → 353 issue lá, tổng **433 issue**, dùng sub-issue gốc của GitHub. Hạng mục chịu giới hạn giờ lái xe tải từ 2024 mang nhãn `constraint:driver-hours-2024` (task-breakdown.md mục 3).
- **Ước lượng:** 1437 SWP chấm bằng skill `estimate-swp` (đã kiểm 5 issue mẫu), quy ra 2155,5 giờ ≈ 269,4 MD theo 1,5 giờ/SWP (estimate.md).
- **Sprint giả lập đã chạy:** Sprint 1 (2026-11-30 → 2026-12-11): 45 issue / 139 SWP theo kế hoạch; cuối sprint Done 90 / 129 SWP (70% phạm vi cuối, sau khi chuyển một issue sang Sprint 2); Sprint 2 đã xếp sơ bộ (progress-report.md).

## Link

| Gì | Link |
|---|---|
| Repo | https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog |
| GitHub Project | https://github.com/users/huongnv-0154/projects/2 — view Board, Backlog, Sprint 1 |
| Báo cáo HTML của skill chấm SWP | [swp-report/report.html](swp-report/report.html) — tải file về mở bằng trình duyệt (một file, không cần mạng) |

<!-- GENERATED:incognito-check -->
Đã mở thử không đăng nhập (như cửa sổ ẩn danh — GET không cookie, không token), 2026-10-15 01:49 UTC: Repo 200 ✓ · GitHub Project 200 ✓ · Báo cáo HTML (raw) 200 ✓.
<!-- /GENERATED -->

## Cấu trúc repo

| File / thư mục | Nội dung |
|---|---|
| `README.md` | File này: tổng quan, link, cấu trúc, Spec → epic |
| `PREMISE.md` | Khác biệt so với LAB-4: spec thêm / sửa, giả định bổ sung, hướng đã chốt |
| `task-breakdown.md` | Nguyên tắc chia task, Spec → issue, hạng mục chịu ràng buộc giờ lái, chỗ hở / mâu thuẫn của spec LAB-4 |
| `estimate.md` | Issue mẫu skill chọn để kiểm, cách quy ra giờ, tổng theo epic, so với estimate LAB-1 |
| `progress-report.md` | Báo cáo tiến độ Sprint 1 giả lập: trạng thái, burndown, dự báo tới M-03, rủi ro trễ; cuối file là ghi chú kỹ thuật về mô hình giả lập |
| `AI-report.md` | Skill và prompt cho từng việc, cách review output AI, điểm đặc biệt |
| `premise-revisions/` | Bản sửa thiết kế lớn được PREMISE trỏ tới (kiểm đảo ngày xuất hàng) |
| `swp-report/` | Báo cáo HTML của skill `estimate-swp` (payload kiểm toán nhúng trong file) |
| `data/` | Dữ liệu sinh và kiểm các bảng: nguồn LAB-4 đã gắn epic, backlog 433 item, chỗ hở, ảnh chụp Project, điểm SWP, giờ, kế hoạch và log Sprint 1, độ nhạy Sprint 1, dự báo tới M-03, kế hoạch sửa vệ sinh issue |
| `scripts/` | Script Node (không dependency) dựng Project, tạo issue, ghi field, giả lập sprint, dự báo mốc, sinh bảng, các cổng kiểm và kế hoạch sửa vệ sinh issue (mặc định chỉ đọc GitHub, kế hoạch ghi ra file tạm `.tmp.json`; chỉ `--apply` mới ghi GitHub và file kế hoạch chính) |
| `images/` | Ảnh burndown Sprint 1 (SVG) |
| `skills/` | Bản sao hai skill tự viết: `takumi-lab-playbook` (điều phối các lab; `references/lab5-pipeline.md` là bảng phase ↔ cổng ↔ script của repo này) và `decision-review` (phản biện quyết định, sinh các brief DR-01…DR-08) |
| `.gitignore` | Bỏ `plans/` (sổ ghi chép nội bộ, brief, bằng chứng kiểm), file tạm `data/*.tmp.json`, file `*.local.*`, `node_modules/` |

Bảng nằm giữa cặp chú thích HTML `GENERATED` trong các file nộp được sinh từ `data/` bằng `node scripts/render-tables.mjs`; `--check` báo lệch nếu bảng cũ hơn dữ liệu.

## Spec → epic

<!-- GENERATED:spec-to-epic -->
| Spec (file LAB-4 tại `c3cf20d` hoặc dòng PREMISE) | Epic trên Project | Ghi chú |
|---|---|---|
| bảng chênh lệch `specs/_common/deviation-table.md` (task L5) ×2 · `architecture/adr/` ADR-0006 | [#1](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/1) — FG-01 マスタ管理 | 12 issue lá · 50 SWP |
| bảng chênh lệch `specs/_common/deviation-table.md` (task L5) ×9 · `specs/receiving/` ×3 · `specs/system-design/api-design/receiving/` ×2 · `specs/system-design/database-design/receiving/` ×1 · LAB-3 `feature-list.md` (chức năng F) ×1 · PREMISE PR-S-05 | [#17](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/17) — FG-02 入荷・検品・ロット生成 | 31 issue lá · 107 SWP |
| bảng chênh lệch `specs/_common/deviation-table.md` (task L5) ×5 · `specs/inventory/` ×1 · `specs/system-design/api-design/inventory/` ×1 | [#18](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/18) — FG-03 在庫・ロケーション・隔離 | 13 issue lá · 47 SWP |
| bảng chênh lệch `specs/_common/deviation-table.md` (task L5) ×14 · `specs/system-design/api-design/order-shipping/` ×2 · `specs/_common/traceability.md` (mã yêu cầu) ×1 · PREMISE PR-S-01, PR-S-02, PR-S-03 | [#19](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/19) — FG-04 受注・アロケーション・ピッキング | 23 issue lá · 91 SWP |
| bảng chênh lệch `specs/_common/deviation-table.md` (task L5) ×9 · `specs/delivery/` ×3 · `specs/system-design/api-design/delivery/` ×1 · `specs/system-design/database-design/delivery/` ×1 · LAB-3 `feature-list.md` (chức năng F) ×1 · `architecture/adr/` ADR-0010 · PREMISE PR-S-01, PR-S-05 | [#20](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/20) — FG-05 配送・POD・クレーム | 21 issue lá · 90 SWP |
| bảng chênh lệch `specs/_common/deviation-table.md` (task L5) ×4 · `specs/dispatch/` ×4 · `specs/system-design/api-design/dispatch/` ×3 · `specs/system-design/database-design/dispatch/` ×2 · `specs/_common/traceability.md` (mã yêu cầu) ×3 · LAB-3 `feature-list.md` (chức năng F) ×1 · PREMISE PR-S-04 | [#21](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/21) — FG-06 ルート計画・拘束時間 | 18 issue lá · 78 SWP; ràng buộc đặc thù: giới hạn giờ lái xe tải từ 2024 — 21 issue mang nhãn `constraint:driver-hours-2024` (task-breakdown.md mục 3) |
| bảng chênh lệch `specs/_common/deviation-table.md` (task L5) ×4 · `specs/temperature-quality/` ×3 · `architecture/target-architecture.md` ×1 · PREMISE PR-S-05 | [#22](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/22) — FG-07 温度監視・逸脱・HACCP | 19 issue lá · 80 SWP |
| bảng chênh lệch `specs/_common/deviation-table.md` (task L5) ×2 · `specs/trace-recall/` ×6 · `specs/system-design/api-design/trace-recall/` ×11 · `specs/system-design/database-design/trace-recall/` ×1 · `specs/_common/traceability.md` (mã yêu cầu) ×4 · LAB-3 `feature-list.md` (chức năng F) ×2 | [#23](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/23) — FG-08 トレーサビリティ・回収 | 21 issue lá · 104 SWP |
| bảng chênh lệch `specs/_common/deviation-table.md` (task L5) ×2 · `specs/report-audit/` ×4 · `specs/administration/` ×1 · `specs/_common/RETENTION_FUNC.md` ×1 · `specs/system-design/api-design/report-audit/` ×4 · `specs/system-design/database-design/report-audit/` ×1 · `specs/system-design/database-design/` ×2 · `specs/_common/traceability.md` (mã yêu cầu) ×1 · LAB-3 `feature-list.md` (chức năng F) ×2 · `architecture/adr/` ADR-0012 | [#24](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/24) — FG-09 レポート・監査エクスポート | 25 issue lá · 137 SWP |
| bảng chênh lệch `specs/_common/deviation-table.md` (task L5) ×3 · `specs/administration/` ×4 · `specs/system-design/api-design/administration/` ×1 · `specs/system-design/database-design/administration/` ×1 · `specs/_common/traceability.md` (mã yêu cầu) ×4 · LAB-3 `feature-list.md` (chức năng F) ×4 · `architecture/target-architecture.md` ×4 | [#25](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/25) — FG-10 外部インターフェース | 23 issue lá · 114 SWP |
| bảng chênh lệch `specs/_common/deviation-table.md` (task L5) ×5 · `specs/administration/` ×1 · `specs/system-design/api-design/administration/` ×1 · `specs/_common/traceability.md` (mã yêu cầu) ×5 · LAB-3 `feature-list.md` (chức năng F) ×2 · `architecture/target-architecture.md` ×5 · `architecture/adr/` ADR-0002, ADR-0004, ADR-0009 | [#26](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/26) — FG-11 認証・権限・監査ログ | 20 issue lá · 83 SWP |
| bảng chênh lệch `specs/_common/deviation-table.md` (task L5) ×1 · `specs/administration/` ×5 · `specs/system-design/api-design/administration/` ×2 · `specs/system-design/database-design/administration/` ×1 · `specs/_common/traceability.md` (mã yêu cầu) ×1 · LAB-3 `feature-list.md` (chức năng F) ×4 | [#27](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/27) — FG-12 データ移行・カットオーバー | 23 issue lá · 106 SWP |
| `specs/administration/` ×2 · `architecture/adr/` ADR-0007, ADR-0008 | [#28](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/28) — E-13 外部連携基盤 | 26 issue lá · 108 SWP |
| bảng chênh lệch `specs/_common/deviation-table.md` (task L5) ×1 · `specs/_common/ATTACHMENT_FUNC.md` ×1 · `specs/system-design/api-design/` ×1 · `specs/_common/traceability.md` (mã yêu cầu) ×10 · `architecture/target-architecture.md` ×12 · `architecture/adr/` ADR-0001, ADR-0011, ADR-0013, ADR-0014 | [#29](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/29) — E-14 環境・運用基盤 | 36 issue lá · 160 SWP |
| bảng chênh lệch `specs/_common/deviation-table.md` (task L5) ×10 · `architecture/target-architecture.md` ×5 · PREMISE PR-S-01, PR-S-04 | [#30](https://github.com/huongnv-0154/lab5-yuki-coldchain-backlog/issues/30) — E-15 顧客確認 | 42 issue lá · 82 SWP; ràng buộc đặc thù: giới hạn giờ lái xe tải từ 2024 — 1 issue mang nhãn `constraint:driver-hours-2024` (task-breakdown.md mục 3); câu hỏi gửi khách, không có spec riêng — nguồn là chỗ để ngỏ của gói LAB-4 |
<!-- /GENERATED -->

×n = số mục nguồn trong file / thư mục đó gắn vào epic. Phần spec chưa thành issue và lý do nằm ở task-breakdown.md mục 2.
