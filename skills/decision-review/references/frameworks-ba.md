# Framework — domain ba (BA / BrSE)

Cho quyết định về yêu cầu và cầu nối với khách, nhất là khách Nhật: diễn giải yêu cầu mơ hồ, chốt spec,
xử lý change request, ưu tiên chức năng, câu hỏi/câu trả lời gửi khách, cập nhật tài liệu yêu cầu.

## Định tuyến: chọn 2–3 framework

| Loại quyết định | Framework chính | Framework phụ |
|-----------------|-----------------|---------------|
| Diễn giải yêu cầu mơ hồ, chốt spec | A2 Hiểu lệch (認識齟齬) | A1 Truy vết nguồn |
| Change request, thêm/bớt phạm vi | A3 Tác động thay đổi | B3 Cam kết một chiều (frameworks-bid) |
| Ưu tiên, cắt chức năng, chia phase | A4 Ưu tiên giá trị × chi phí | A5 Luồng nghiệp vụ |
| Thiết kế luồng, vai trò, ngoại lệ | A5 Luồng nghiệp vụ | A1 Truy vết nguồn |
| Câu hỏi / câu trả lời gửi khách (Q&A, 議事録) | A2 Hiểu lệch | B3 Cam kết một chiều |

Không khớp loại nào → A1 + A2 là cặp mặc định an toàn.

---

## A1 Truy vết nguồn

Mọi quyết định diễn giải yêu cầu phải truy về lời của khách: RFP, 要件定義書, 議事録, email, câu trả lời Q&A.

- Câu hỏi mồi: "Câu này của khách nằm ở đâu, nguyên văn là gì?" · "Đây là khách nói hay mình suy ra?" ·
  "Có tài liệu nào của khách nói ngược lại không?"
- Judge: quyết định dựa trên yêu cầu không truy được về nguồn của khách → tối thiểu SỬA CÓ ĐIỀU KIỆN
  (thêm câu 確認 gửi khách).

## A2 Hiểu lệch (認識齟齬)

Tách "khách nói" khỏi "mình hiểu". Hai bên hiểu khác nhau mà không ai phát hiện là lỗi đắt nhất của BrSE.

- Kiểm: thuật ngữ có trong glossary chưa, một từ có hai nghĩa không (vd 在庫 là tồn kho sổ sách hay tồn
  thực tế); ví dụ cụ thể (dữ liệu, màn hình) đã được khách xác nhận chưa; 前提 ngầm nào chưa nói ra.
- Câu hỏi mồi: "Nếu khách hiểu theo nghĩa thứ hai thì quyết định còn đúng không?" · "Đã có ví dụ cụ thể
  được khách xác nhận bằng văn bản chưa?"
- Judge: diễn giải có ≥2 cách hiểu hợp lý mà chưa được khách xác nhận → CHƯA ĐỦ DỮ LIỆU, kèm câu 確認.

## A3 Tác động thay đổi (変更管理)

- Thay đổi này đụng những chức năng, màn hình, dữ liệu, test nào? Effort và lịch đổi bao nhiêu?
- Ai trả chi phí: nằm trong phạm vi đã báo giá hay là 追加 (tính thêm)? Hợp đồng 請負 hay 準委任?
- Câu hỏi mồi: "Có ghi vào sổ change request và được khách đồng ý bằng văn bản chưa?" · "Nhận miệng
  thì sau này ai chịu effort?"
- Judge: nhận thay đổi ngoài phạm vi mà không có ghi nhận chi phí/lịch → SỬA CÓ ĐIỀU KIỆN.

## A4 Ưu tiên giá trị × chi phí

Xếp theo giá trị nghiệp vụ và chi phí làm, dùng MoSCoW hoặc ma trận 2×2.

- Câu hỏi mồi: "Ai quyết Must, dựa trên gì?" · "Cắt chức năng này thì luồng nghiệp vụ nào gãy?" ·
  "Chi phí làm sau có tăng không?"
- Judge: Must do phía mình tự đặt mà khách chưa xác nhận → không được GIỮ.

## A5 Luồng nghiệp vụ (業務フロー)

Đặt quyết định vào luồng nghiệp vụ thật của người dùng cuối, từng vai trò.

- Kiểm: luồng bình thường và luồng ngoại lệ (hủy, sửa, trả lại, quá hạn); vai trò nào làm bước nào;
  bước thủ công ngoài hệ thống.
- Câu hỏi mồi: "Người dùng làm gì ngay trước và ngay sau bước này?" · "Trường hợp ngoại lệ nào chưa có
  đường đi?"
- Judge: luồng ngoại lệ phổ biến không có đường xử lý → phản biện major trở lên.
