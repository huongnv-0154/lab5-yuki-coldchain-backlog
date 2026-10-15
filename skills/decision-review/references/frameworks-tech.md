# Framework — domain tech

Cho quyết định kỹ thuật: kiến trúc, chọn thư viện/framework, hạ tầng, data model, phương án migrate,
build vs buy, cách chia phase.

## Định tuyến: chọn 2–3 framework

| Loại quyết định | Framework chính | Framework phụ |
|-----------------|-----------------|---------------|
| Kiến trúc, data model, API contract | T1 Reversibility | T3 Second-order, T2 Pre-mortem |
| Chọn thư viện, framework, SaaS | T4 Steel-man phương án bỏ | T5 Decision matrix |
| Build vs buy | T5 Decision matrix | T3 Second-order |
| Hạ tầng, migrate, rollout | T2 Pre-mortem | T1 Reversibility |
| Cắt phạm vi, thứ tự phase, "để sau" | T3 Second-order | T6 Cost of delay |

Không khớp loại nào → T1 + T2 là cặp mặc định an toàn.

---

## T1 Reversibility (one-way / two-way door)

- Sai thì rút lại tốn bao nhiêu: thời gian, migrate data, client đã phụ thuộc, hợp đồng vendor?
- Two-way door → đừng review quá sâu, đề xuất quyết nhanh và đặt điểm đo. One-way door → đòi bằng chứng
  mạnh và phương án thoát.
- Câu hỏi mồi: "Nếu 3 tháng sau thấy sai, lộ trình quay đầu là gì?" · "Có ai bên ngoài sẽ phụ thuộc vào
  quyết định này (API public, schema, format file)?"
- Judge: one-way door dựa chủ yếu trên ASSUMPTION → không được GIỮ.

## T2 Pre-mortem

Giả sử quyết định đã thất bại sau 6 tháng. Viết 3–5 nguyên nhân cụ thể: tải thật, dữ liệu bẩn, người
bảo trì rời đi, vendor đổi giá, bảo mật.

- Câu hỏi mồi: "Nguyên nhân nào đã có biện pháp, cái nào chưa?" · "Dấu hiệu sớm nào báo trước?"
- Judge: nguyên nhân xác suất cao, hậu quả lớn, chưa chặn → phản biện major trở lên.

## T3 Second-order

Hệ quả bậc hai và vòng phản hồi: quyết định này làm gì với đội, codebase, chi phí vận hành sau 6–12
tháng?

- Câu hỏi mồi: "Ai phải gánh thêm việc vì quyết định này?" · "Nó tạo tiền lệ gì cho các quyết định
  sau?" · "Chi phí vận hành tăng theo số user/data thế nào?"
- Judge: hệ quả bậc hai tiêu cực lớn hơn lợi ích bậc một mà không được nhắc → SỬA CÓ ĐIỀU KIỆN.

## T4 Steel-man phương án bỏ

Dựng lập luận mạnh nhất cho phương án đã bị loại, như người ủng hộ nó thật sự sẽ nói.

- Câu hỏi mồi: "Vì sao bỏ B? Lý do đó có bằng chứng hay chỉ là quen tay?" · "Với ràng buộc nào thì B
  thắng? Ràng buộc đó có đang đúng không?"
- Hỏi nguồn: lý do bỏ B dựa trên docs chính thức, changelog, issue tracker, license hay chỉ kinh nghiệm?
- Judge: B thắng ở tiêu chí quan trọng nhất mà lý do bỏ B chỉ là ASSUMPTION → SỬA CÓ ĐIỀU KIỆN.

## T5 Decision matrix có trọng số

Tiêu chí + trọng số phải chốt **trước** khi chấm điểm, để tránh chọn trọng số theo đáp án.

- Tiêu chí gợi ý: hợp stack hiện tại · chi phí (license, hạ tầng, người) · độ trưởng thành và cộng đồng ·
  hiệu năng · bảo mật và license · năng lực đội · khả năng thay thế về sau.
- Câu hỏi mồi: "Trọng số này ai đặt, dựa trên gì?" · "Đổi trọng số tiêu chí lớn nhất ±20% thì thứ hạng
  có lật không?" (kiểm độ nhạy)
- Judge: thứ hạng lật khi trọng số dao động nhỏ → phán quyết phải nói rõ tiêu chí nào là then chốt.

## T6 Cost of delay

- Hoãn quyết định (hoặc hoãn phần việc) thì mất gì mỗi tuần, được gì (thêm thông tin)?
- Câu hỏi mồi: "Thông tin nào sẽ có sau 2 tuần nữa mà làm đổi quyết định?" · "Hoãn thì ai bị chặn?"
- Judge: thông tin quyết định sẽ có sớm, chi phí chờ thấp → đề xuất hoãn có thời hạn.
