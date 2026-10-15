# Framework — domain bid (mặc định)

Cho quyết định trong gói thầu, nhất là thầu outsource cho khách Nhật: go/no-go, estimate, đơn giá,
phạm vi cam kết, hình thức hợp đồng, win theme, phân bổ nhân sự, câu trả lời Q&A gửi khách.

## Định tuyến: chọn 2–3 framework

| Loại quyết định | Framework chính | Framework phụ |
|-----------------|-----------------|---------------|
| Go/No-Go, có nên dự thầu | B1 Scorecard | B5 Pre-mortem kép |
| Con số estimate, buffer, MD | B2 Reference-class | B5 Pre-mortem kép, B7 Ranh giới phạm vi |
| Đơn giá, tổng giá, discount | B3 Cam kết một chiều | B6 Steel-man đối thủ |
| Phạm vi, 前提条件, 対象外, hình thức hợp đồng | B7 Ranh giới phạm vi | B3 Cam kết một chiều |
| Win theme, cấu trúc proposal, thông điệp | B4 Góc nhìn người chấm | B6 Steel-man đối thủ |
| Câu trả lời/câu hỏi gửi khách (Q&A, hearing) | B4 Góc nhìn người chấm | B3 Cam kết một chiều |

Không khớp loại nào → B5 + B3 là cặp mặc định an toàn.

---

## B1 Scorecard Go/No-Go

Chấm 1–5 từng trục, kèm nhãn bằng chứng: xác suất thắng · giá trị chiến lược (khách mới, domain mới,
reference) · năng lực delivery (người, skill, thời điểm) · biên lợi nhuận dự kiến · rủi ro (pháp lý,
kỹ thuật, khách khó) · chi phí làm thầu so với giá trị.

- Câu hỏi mồi: "Xác suất thắng dựa trên cái gì: quan hệ, lần thầu trước, hay cảm giác?" · "Nếu thắng,
  ai delivery, họ đang rảnh không?" · "Chi phí làm bộ hồ sơ này là bao nhiêu MD?"
- Judge: trục nào ≤2 mà không có kế hoạch giảm thiểu → không được GIỮ quyết định "Go".

## B2 Reference-class (kiểm estimate)

So estimate với dự án tương tự đã làm, không chỉ đếm từ dưới lên.

- Truy vết: mỗi dòng effort ↔ một chức năng/màn hình/yêu cầu trong RFP hoặc function list. Dòng mồ côi
  và yêu cầu không có dòng effort đều là phản biện.
- Buffer: có lý do cụ thể (rủi ro nào, bao nhiêu %), hay chỉ là "+20% cho chắc"?
- Giả định: estimate dựa trên giả định nào chưa được khách xác nhận? Có ghi vào 前提条件 chưa?
- Câu hỏi mồi: "Dự án tương tự gần nhất tốn bao nhiêu, lệch estimate bao nhiêu %?" · "Phần nào đội chưa
  từng làm?" · "Nếu năng suất thấp hơn 30% thì lỗ bao nhiêu?"
- Judge: yêu cầu RFP chưa có dòng effort → tối thiểu SỬA CÓ ĐIỀU KIỆN.

## B3 Cam kết một chiều (reversibility cho thầu)

Tách thứ đã gửi khách (khó rút: đơn giá, tổng giá, deadline, SLA, phạm vi trong 契約) khỏi thứ nội bộ
(dễ đổi: phân bổ người, công cụ, lịch nội bộ).

- Một chiều → đòi bằng chứng cao gấp bội, phải có phương án thoát (điều khoản 変更管理, 前提条件).
- Câu hỏi mồi: "Gửi đi rồi mà sai thì sửa bằng cách nào, tốn gì, mất uy tín không?" · "Có điều khoản
  nào cho phép điều chỉnh khi 前提 thay đổi?"
- Judge: cam kết một chiều dựa chủ yếu trên ASSUMPTION → không được GIỮ.

## B4 Góc nhìn người chấm (evaluator lens)

Đọc quyết định bằng mắt người chấm thầu phía khách, không phải mắt người viết.

- Bám 評価基準 và 要件 trong RFP: quyết định này làm điểm tăng hay giảm ở tiêu chí nào?
- Tín hiệu tin cậy với khách Nhật: số liệu có căn cứ, rủi ro nói trước, không hứa quá mức, cam kết rõ
  ràng. Hứa hẹn mơ hồ hay giá thấp bất thường làm mất điểm tin cậy.
- Câu hỏi mồi: "Tiêu chí chấm nào trong RFP liên quan quyết định này?" · "Người chấm đọc câu này có hỏi
  lại 'căn cứ đâu?' không?" · "Luật chơi khách đã nêu có bị vi phạm không?"
- Judge: vi phạm yêu cầu bắt buộc hoặc luật chơi RFP → BÁC.

## B5 Pre-mortem kép

Hai kịch bản thất bại, mỗi cái 3 nguyên nhân cụ thể:
1. **Mất thầu** — vì sao khách chọn người khác?
2. **Thắng nhưng lỗ / vỡ tiến độ** (winner's curse) — vì sao 6 tháng sau dự án cháy?

- Câu hỏi mồi: "Nguyên nhân nào trong 6 cái trên quyết định hiện tại chưa chặn?"
- Judge: nguyên nhân nào xác suất cao, hậu quả lớn mà chưa có biện pháp → phản biện major trở lên.

## B6 Steel-man đối thủ

Dựng đề xuất mạnh nhất mà đối thủ (công ty offshore khác, vendor nội địa Nhật, SaaS có sẵn) có thể đưa.

- Câu hỏi mồi: "Đối thủ mạnh nhất sẽ chào giá/phương án nào? Quyết định của mình thua ở đâu?" · "Khách
  có lựa chọn không làm gì hoặc mua SaaS không?"
- Judge: thua rõ ở tiêu chí có trọng số cao mà không có điểm bù → SỬA CÓ ĐIỀU KIỆN.

## B7 Ranh giới phạm vi

- 対象範囲 / 対象外 đã viết rõ chưa? Vùng xám nào sẽ thành tranh chấp?
- Hình thức hợp đồng (請負 hay 準委任) có khớp độ chắc chắn của yêu cầu không? Yêu cầu còn mơ hồ mà
  chọn 請負 là rủi ro.
- 契約不適合責任, hỗ trợ sau bàn giao, data migration, môi trường, tài liệu: ai làm, có tính tiền không?
- Câu hỏi mồi: "Hạng mục nào khách có thể hiểu là 'đương nhiên có' mà mình chưa tính?"
- Judge: vùng xám có thể phát sinh >10% effort mà chưa ghi 前提 hoặc 対象外 → SỬA CÓ ĐIỀU KIỆN.
