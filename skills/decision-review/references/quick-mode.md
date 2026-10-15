# Mức quick — session chính tự phản biện, không spawn agent

Mặc định. Mục tiêu: ~1 phút, ~10–20k token. Đổi lại: cùng một model đóng cả 3 vai nên độ độc lập thấp
hơn standard/deep. Bù bằng kỷ luật thứ tự và luật cứng dưới đây.

## Luật riêng của quick

1. **Chỉ dùng evidence digest** dựng từ input trong session (Bước 1). Không grep, không đọc thêm file,
   không web search.
2. **Viết Challenger trước, trọn vẹn, rồi mới viết Defender.** Không sửa phần Challenger sau khi đã
   viết Defender.
3. Challenger: 3–5 phản biện, **mỗi framework đã chọn ít nhất 1 phản biện**, cộng 1 dòng pre-mortem
   ("6 tháng sau quyết định này sai vì…"). Có nhãn và mức critical/major/minor.
4. Defender: trả lời từng phản biện bằng digest. Không có trong digest → `NEEDS-HUMAN` hoặc `ASSUMPTION`,
   không suy diễn cho đẹp. Được nhận `CONCEDED`. Nhãn gắn theo từng câu khẳng định (luật 8 SKILL.md).
5. Judge: áp **tiêu chí Judge in sẵn trong file framework**, máy móc, không cân "bên nào hay hơn". Soát
   **mọi** mục DEFENDED theo luật 8 SKILL.md; mục có câu vi phạm → hạ về NEEDS-HUMAN.
6. Không ghi diễn biến dài. Mỗi phản biện + trả lời gói trong 1 dòng bảng.

## Các bước

1. Decision Card (ngắn) + evidence digest — xem Bước 1 của SKILL.md.
2. Đọc bảng định tuyến trong file framework, chỉ đọc mục 2 framework đã chọn.
3. Viết bảng Challenger → Defender → trạng thái trong một lượt suy nghĩ.
4. Phán quyết + brief gọn (mẫu compact trong [brief-template](brief-template.md)).

## Khi nào quick không đủ

Ghi cuối brief một dòng **"Đề xuất nâng mức"** nếu có một trong các điều sau:
- quyết định là one-way door (bid thật, kiến trúc, cam kết spec với khách) và phán quyết khác GIỮ;
- có phản biện critical chỉ dựa trên INFERRED/ASSUMPTION (cần mắt độc lập kiểm);
- digest không đủ để trả lời ≥2 phản biện major (gợi ý chạy `tkm:ask-expert` nếu có, hoặc dán tài liệu liên quan vào hội thoại, rồi review lại).

Tín hiệu nâng mức ở SKILL.md đã được xét trước khi chạy (có tín hiệu thì đã tự chạy standard). Các trường
hợp trên phát hiện giữa chừng → ghi "Đề xuất nâng mức" cuối brief, không tự chạy lại.
