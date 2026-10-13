# Bản sửa — kiểm đảo ngày (BR-DATE-01) lúc phân bổ và lúc xuất hàng (GAP-41)

Dòng PREMISE: [PR-S-01](../PREMISE.md#1-spec-thêm--bỏ--sửa-so-với-lab-4) · hướng chốt: [PR-D-01](../PREMISE.md#3-hướng-đã-chốt).
Sửa trên nền LAB-4 (commit `c3cf20d`), sửa giả định LAB-4 A-15. Tài liệu bị sửa, trong gói LAB-4:

| Tài liệu | Mục |
|---|---|
| `specs/delivery/technical-design/DLV_SHIPPING_CHECK_TECH.md` | 5.3 |
| `specs/delivery/function-specifications/SHIPPING_PRECHECK_FUNC.md` | 3.3 |
| `specs/order-shipping/technical-design/ORD_DATE_REVERSAL_TECH.md` | 5.7 |
| `specs/system-design/database-design/order-shipping/ORDERS_ALLOCATION_DELIVERY_DB.md` | `deliveries`, `shipping_checks`, view `in_transit_lots` (T8) |
| `specs/system-design/api-design/delivery/SHIPPING_CHECKS_POST_API.md` | Body, lỗi |
| `specs/delivery/screen-specification/YC_SHIPPING_PRECHECK_SPEC.md` | Mục nhập liệu, thông báo |

Phần không nhắc dưới đây giữ nguyên LAB-4: kiểm 6 `SHIP_DATE_REVERSAL`, advisory lock theo (khách, SKU), không mở deviation, đường ra "huỷ soạn rồi phân bổ lại" (L5-065).

## Vì sao sửa

LAB-4 chốt cứng hai điều mà khách chưa xác nhận (giả định LAB-4 A-15):
1. "Lần giao đã nhận" gồm cả chuyến đã xuất nhưng chưa có POD, ở cả bước phân bổ (`ORD_DATE_REVERSAL_TECH` 5.7) lẫn bước xuất (`DLV_SHIPPING_CHECK_TECH` 5.3).
2. Vi phạm lúc xuất thì chặn, không chỉ cảnh báo.

RFP không định nghĩa "đã nhận", và phần mô tả luật với phụ lục R-06 dùng hai mức khác nhau (cảnh báo / chặn). Nếu khách chọn cách hiểu còn lại thì phải sửa code. Thêm nữa, một chuyến mất POD sẽ giữ mốc mãi, làm kẹt mọi đơn sau cùng khách × SKU. Bảng `deliveries` lại không có cột thời điểm xuất (chỉ có `delivered_at` lúc giao xong), nên chưa đặt được giới hạn thời gian.

## Thay đổi

| # | Chỗ | LAB-4 | Bản sửa |
|---|---|---|---|
| 1 | Phạm vi mốc (phân bổ 5.7 và xuất 5.3 dùng chung) | Cố định: `COMPLETED` gần nhất + `PENDING` (đã xuất, chưa POD) của đơn khác | Tham số `date_reversal_reference` ∈ {`COMPLETED_ONLY`, `COMPLETED_AND_IN_TRANSIT`}, mặc định `COMPLETED_AND_IN_TRANSIT` |
| 2 | Hành động khi vi phạm lúc xuất | Chặn (`YC422 SHIP_DATE_REVERSAL`) | Tham số `date_reversal_action` ∈ {`BLOCK`, `WARN_WITH_REASON`}, mặc định `BLOCK`. Ở `WARN_WITH_REASON`, PASS chỉ được khi người kiểm nhập lý do: body `POST /api/shipping-checks` thêm `dateReversalReason`, thiếu thì vẫn trả `YC422`. Màn kiểm xuất hiện ô lý do khi có vi phạm. Lý do và người xác nhận ghi vào `audit_events`. Bước phân bổ giữ nguyên hành động của LAB-4 (nhánh hợp đồng loại lô) |
| 3 | Thời điểm xuất | Không lưu | Thêm cột `deliveries.dispatched_at timestamptz`, ghi khi PASS tạo dòng `deliveries` (`PENDING`) |
| 4 | Chuyến chưa POD quá lâu | Không có giới hạn | Tham số `in_transit_max_hours`, mặc định 24. View `in_transit_lots` bỏ chuyến có `dispatched_at` cũ hơn giới hạn. Màn kiểm xuất và kết quả phân bổ cảnh báo khi có chuyến bị bỏ vì quá hạn |
| 5 | Nơi lưu tham số | — | `rule_versions`, `rule_key = date_reversal`, có ngày hiệu lực (cùng cách giả định LAB-4 A-14 và ADR-0006). Thêm cột `shipping_checks.date_reversal_rule_version_id` (FK `rule_versions`) để lần kiểm nhớ phiên bản tham số đã dùng |

Khách chưa đặt quy tắc cửa sổ giao (UNSET): không đổi. Ở bước phân bổ, đơn UNSET không tự phân bổ mà chuyển review nghiệp vụ (`ALLOCATION_FUNC`). Tới bước xuất, đơn này được kiểm như mọi đơn khác.

## Kiểm chứng (AC của issue L5-068; L5-046 dùng cùng mốc)

- Assert SQL cho ca GAP-41 với đủ bốn tổ hợp tham số (1) × (2):
  - `COMPLETED_AND_IN_TRANSIT` + `BLOCK` → `YC422`.
  - `COMPLETED_ONLY` → cho qua.
  - `WARN_WITH_REASON` không có lý do → `YC422`; có lý do → qua, kèm một dòng `audit_events`.
- Chuyến `PENDING` có `dispatched_at` cũ hơn `in_transit_max_hours`: không còn làm mốc, ở cả phân bổ lẫn xuất, và có cảnh báo.
- `shipping_checks` của lần PASS có `date_reversal_rule_version_id` khớp phiên bản đang hiệu lực.
- Hai đơn PASS song song cùng (khách, SKU): đơn sau thấy chuyến của đơn trước (khoá như LAB-4).
