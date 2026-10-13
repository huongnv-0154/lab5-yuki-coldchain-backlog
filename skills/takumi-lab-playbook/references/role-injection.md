# Chèn vai — bảng tra và khối prompt

Đa số người học đổi vai của **mình** nhưng để AI ở nguyên vai "trợ lý". Kết quả là một cuộc
phỏng vấn một chiều. Mỗi bước cần **ba vai**.

## Khối prompt tự chèn

Prepend nguyên khối này khi dispatch sang skill con:

```
Vai tôi: {role_a}. Vai bạn: {role_b} — KHÔNG phải trợ lý.
Đầu vào cho phép: {allowed_inputs}. Ngoài danh sách này thì không đọc.
Trước khi trả lời: nêu 3 điều đáng nghi trong đầu vào.
Nhãn bắt buộc mỗi kết luận: EXTRACTED | INFERRED | AMBIGUOUS (theo tkm:confidence).
Sau khi trả lời: {role_c} phản biện chính output vừa tạo.
Ngôn ngữ file: JA. Ngôn ngữ hội thoại: VI.
```

`allowed_inputs` là cách cổng G5 được thi hành: ở E10 nó **không bao gồm `client-docs/`**.

## Bảng tra

| E | (a) Người dùng | (b) AI đóng | (c) Phản biện |
|---|---|---|---|
| E1 | BrSE | **Người Nhật bản địa ngành kho lạnh** — giải nghĩa theo tập quán thương mại, không theo từ điển | chỗ nào đang hiểu theo common sense mà spec nói khác? |
| E2 | BrSE | **Kiểm toán viên nghiệp vụ** — giả định tài liệu có chỗ gài | mục checklist nào bị bỏ qua vì "chắc là bình thường"? |
| E3 | SDM soạn câu hỏi | **Khách Nhật đang bận** — trả lời cụt, né, hoặc "お任せします" | câu nào khách trả lời được ngay? câu nào chặn báo giá? đáp án khác đi thì MD lệch bao nhiêu? |
| E4 | SDM | **Facilitator** (skill đã tự đóng vai này) | ý nào là của tôi, ý nào là `[AI案]`? tỉ lệ có quá lệch về AI không? |
| E5 | BA | **Kiến trúc sư hệ thống** | module bắt buộc nào bị bỏ? FG nào rỗng F? |
| E6 | BA | **Người vận hành kho thật** | business rule nào viết ra mà ca đêm không ai làm nổi? |
| E7 | PM | **PM đối thủ đang soi để dìm giá** | Epic nào gộp quá thô? Story nào không vừa một sprint? |
| E8 | PO | **Thủ kho đeo găng trong kho −25°C** | story nào không ai thực sự làm trong ca thật? |
| E9 | UI/UX | **Người dùng lần đầu, đang vội** | option nào chỉ khác màu chứ không khác cách làm việc? |
| E10 | PM | **PM đối thủ** | cho 3 con số: optimistic / realistic / pessimistic + tiền đề nào làm nó nhảy |
| E12 | SDM | **CFO duyệt ngân sách** | đội hình này có ai ngồi không tháng nào không? |
| E13 | SDM | **Người review chéo LAB-2 đang tìm lỗ** | rủi ro nào chỉ là câu chữ chung chung, không gắn được vào F/SCR nào? |
| E14 | SDM thuyết trình | **Khách Nhật ngồi nghe, không đọc trước** | slide nào là bảng số nội bộ dán vào? cắt |

## Quy tắc

- **Vai (b) không bao giờ là "trợ lý".** Nếu không nghĩ ra vai đối trọng thì bước đó chưa đáng chạy.
- `AskUserQuestion` chỉ chạy ở luồng chính. Không đưa bước có phỏng vấn (E3–E9) vào sub-agent nền.
- Nhãn `INFERRED` → phải thành **tiền đề giả định** trong ⑥.
  Nhãn `AMBIGUOUS` → phải thành **câu hỏi** trong ① hoặc `BQ-xxx`.
  Không có nhãn nào được im lặng biến mất giữa hai bước.
