# Break task — từ thiết kế LAB-4 tới backlog trên GitHub Project

## 1. Nguyên tắc chia task

Nguồn break: gói LAB-4 tại commit `c3cf20d` ± [PREMISE.md](PREMISE.md). Mỗi issue ghi nguồn bằng mã trong gói LAB-4 (`L5-xxx` của bảng chênh lệch, `SPEC-YC-xxx`, mã yêu cầu, `ADR-00xx`) kèm đường dẫn file trong gói, và dòng PREMISE nếu có. Issue tóm tắt việc phải làm; không chép lại spec.

### 1.1 Ba cấp trên Project

| Cấp | `Item type` | Là gì | Luật |
|---|---|---|---|
| Epic | Epic | Một nhóm chức năng FG của LAB-1, hoặc một trong ba epic nền E-13 / E-14 / E-15 | Không có cha; phải có ít nhất một con |
| Issue | User Story | Một kết quả nghiệp vụ nhìn thấy được (một màn, một luật, một giao diện), gom ≥ 2 việc lá | Cha là Epic; phải có con |
| Issue / sub-issue | Task | Việc lá, làm và kiểm xong trong một lần | Cha là Epic (việc nhỏ đứng riêng) hoặc User Story; không có con |

Quan hệ cha – con dùng sub-issue có sẵn của GitHub (`Parent issue`, `Sub-issues progress` hiện trên Project). Story Point và giờ của cha bằng tổng của con; điểm chỉ chấm ở việc lá.

### 1.2 Độ hạt — chia tới đâu thì dừng

- Việc lá **≤ 16 giờ** (tối đa 2 ngày công), mục tiêu 4–12 giờ, **một vai chính** (field `Owner`).
- Tách sub-issue khi một việc chạm **≥ 2 lớp** (UI · API/RPC · DB/migration · test · tài liệu) **hoặc ≥ 2 vai**. Ví dụ: một màn chỉ thiết kế = User Story, con gồm DB + RPC (BE), màn (FE), test E2E (QA-Auto).
- Dừng tách khi việc lá thuộc một lớp, một vai, ≤ 16 giờ và có điều kiện xong kiểm được. Không tách nhỏ hơn mức đó chỉ để có thêm issue.
- Task `L5-xxx` của bảng chênh lệch giữ nguyên một việc. Task gộp (`L5-001` → `L5-013`, `L5-007` → `L5-021`) không thành issue riêng. Task ghi "không phải task" (`L5-037`, `L5-038`) không thành issue.
- Mỗi feature đã dựng ở prototype có **một Task kiểm hồi quy E2E** cho các màn đã dựng, thay cho issue "đưa lên production" chung chung (DR-03).

### 1.3 Định nghĩa xong (DoD) theo loại issue

| Loại | Xong khi |
|---|---|
| Code (màn, luật, RPC, migration) | Đạt các AC của Screen Spec / Function Spec / Tech Design được trỏ; unit test cho domain + assert SQL cho RPC/migration; migration chạy qua dev → test; review code xong; spec được cập nhật nếu code khác spec. Trường chuỗi và ngày giờ theo PR-A-08 |
| Tích hợp (FG-10, E-13) | Như code, cộng: contract test với môi trường thử của bên kia; thử lại / outbox chạy theo giả định LAB-4 A-4; log có correlation ID |
| Môi trường, vận hành (E-14) | Cấu hình có ở đủ các môi trường liên quan, kiểm được bằng script hoặc checklist; runbook cập nhật; không còn chức năng chỉ dành cho prototype ở production |
| Làm rõ với khách (E-15) | Câu hỏi đã gửi (giả lập); khi khách trả lời: ghi câu trả lời vào spec hoặc PREMISE, đổi tham số nếu cần, đóng issue; còn chờ thì để Blocked kèm ngày hỏi lại |
| Kiểm hồi quy E2E | Kịch bản E2E phủ luồng chính của mọi màn đã dựng trong feature theo AC của Screen Spec, chạy được trong CI |

### 1.4 Câu hỏi khách và ràng buộc đặc thù

- Issue code làm theo giả định LAB-4 (giá trị là tham số). Câu hỏi khách là issue E-15 riêng, thân issue liệt kê issue bị ảnh hưởng. Issue code chỉ chuyển Blocked khi không có giả định nào dùng được (PR-D-04).
- Issue chịu giới hạn giờ lái xe tải từ năm 2024 mang nhãn `constraint:driver-hours-2024`, gom trong FG-06 (mục 3).
- Nhãn trên mỗi issue: `type:*`, `team:*`, `epic:E-xx`, `src:*` (nguồn), và `graded:*` nếu issue chạm luật nằm trên luồng chấm (nhiệt độ phân cấp, đảo ngày).

### 1.5 Mười lăm epic

| Epic | Tên | Phạm vi | LAB-1 | Thư mục spec LAB-4 |
|---|---|---|---|---|
| E-01 | FG-01 マスタ管理 | Master SKU, đối tác, vị trí, quy tắc hợp đồng, chính sách nhiệt, duyệt master | FG-01 | `master-data` |
| E-02 | FG-02 入荷・検品・ロット生成 | Lịch nhập, kiểm hàng nhập, sinh lô, nhãn lô | FG-02 | `receiving` |
| E-03 | FG-03 在庫・ロケーション・隔離 | Tồn, cất hàng, di chuyển, kiểm kê, cách ly | FG-03 | `inventory` |
| E-04 | FG-04 受注・アロケーション・ピッキング | Đơn hàng, phân bổ (FEFO, hạn, cửa sổ giao, đảo ngày), soạn hàng | FG-04 | `order-shipping` |
| E-05 | FG-05 配送・POD・クレーム | Kiểm xuất, bốc hàng, POD (cả offline), khiếu nại | FG-05 | `delivery` |
| E-06 | FG-06 ルート計画・拘束時間 | Tuyến, công bố / 改版, kiểm giờ lái 2024 | FG-06 | `dispatch` |
| E-07 | FG-07 温度監視・逸脱・HACCP | Nhập file logger, cảnh báo, case lệch nhiệt, HACCP | FG-07 | `temperature-quality` |
| E-08 | FG-08 トレーサビリティ・回収 | Truy xuất, case và thông báo thu hồi | FG-08 | `trace-recall` |
| E-09 | FG-09 レポート・監査エクスポート | Báo cáo, gói bằng chứng audit, 帳票, thời hạn lưu giữ và purge hai pha (F-069, ADR-0012) | FG-09 | `report-audit` |
| E-10 | FG-10 外部インターフェース | Phần nghiệp vụ của ERP CSV, bản đồ, mail thông báo, archive | FG-10 | `administration` (ERP, mail, archive), `dispatch` (bản đồ) |
| E-11 | FG-11 認証・権限・監査ログ | SSO/OIDC, phiên, MFA, RBAC/RLS, ma trận vai trò × màn, audit chỉ thêm | FG-11 | `administration` |
| E-12 | FG-12 データ移行・カットオーバー | Profiling, lineage, đối chiếu rehearsal, vận hành song song | FG-12 | `administration` |
| E-13 | 外部連携基盤 | Nền chung của 6 giao diện ngoài: outbox, worker nền, thử lại, tài khoản môi trường thử, PoC IdP và `job_worker`, contract test | trải trong FG-10 / FG-11 | `architecture/` (ADR-0007, 0008, 0009) |
| E-14 | 環境・運用基盤 | 4 môi trường, CI/CD, migration, quan sát (log, correlation ID), backup/PITR, kho tệp đính kèm dùng chung (ADR-0011), hiệu năng, kiểm bảo mật (threat model, SBOM), kiểm NFR, gỡ phần chỉ dành cho prototype | PJ.85–90 + phần NFR rải trong các FG | `architecture/target-architecture.md` |
| E-15 | 顧客確認 | Câu hỏi làm rõ gửi khách và việc xác minh nguồn bên ngoài | — | bảng chênh lệch, câu hỏi mở của kiến trúc |

Mã nhãn `epic:E-01…E-12` ứng với FG-01…FG-12. Việc dự án ngoài thiết kế (PJ.78–84, PJ.91–92 của LAB-1) không thành issue (PR-D-02).

## 2. Spec → issue

〔TODO-P2: bảng Spec · Epic · Issue/sub-issue · Phần spec chưa thành issue và vì sao〕

## 3. Hạng mục chịu ràng buộc đặc thù

〔TODO-P2: bảng Ràng buộc · Issue · Vì sao tách riêng (giới hạn giờ lái xe tải từ 2024)〕

## 4. Chỗ hở / mâu thuẫn của spec LAB-4 phát hiện khi break

〔TODO-P2: bảng Spec · Chỗ hở/mâu thuẫn · Xử lý〕
