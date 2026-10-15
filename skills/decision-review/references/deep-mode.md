# Mức deep — 2 agent tranh luận nhiều vòng + Judge độc lập

Chỉ đọc file này khi chạy `--level deep`. Tốn nhất (~7–8 lượt agent, mỗi lượt có sàn ~55k token ngữ cảnh,
~10 phút). Dành cho quyết định one-way door của bid thật hoặc kiến trúc khó rút lại.

## Spawn

Load `SendMessage` qua ToolSearch trước. Không có `SendMessage` (bản Claude Code cũ) → báo người dùng một
dòng rồi chạy `standard` thay thế, không cố giả lập nhiều vòng.

- Spawn Defender và Challenger song song: Agent tool, `subagent_type: general-purpose`,
  `run_in_background: false`, prompt từ [roles-and-prompts](roles-and-prompts.md).
- Cross-model (mặc định): Defender dùng model session, Challenger truyền `model` khác (ưu tiên model
  mạnh nhất còn lại). `--same-model` → không truyền `model`. Spawn với model khác bị lỗi → spawn lại
  không truyền `model`, ghi "cross-model không khả dụng" vào phần hạn chế của brief.
- Truyền: Decision Card, framework, **evidence digest nguyên văn** (không chỉ đường dẫn), môi trường.
  Không truyền lịch sử hội thoại.
- `--grill`: bỏ Defender; session chính hỏi người dùng theo mục "Luật `--grill`" trong SKILL.md.

## Vòng tranh luận

Session chính giữ sổ phản biện (format trong roles-and-prompts).

Cơ chế: SendMessage `to: <agentId>` đánh thức agent với nguyên ngữ cảnh cũ. Câu trả lời về sau thành
hand-back message, không nằm trong kết quả SendMessage → chờ message rồi mới đi tiếp. Không poll.
Kết quả lượt spawn đầu cũng có thể về theo đường hand-back.

Mỗi vòng: Challenger trả phản biện + câu hỏi + trạng thái cũ → session chính cập nhật sổ, chuyển câu hỏi
cho Defender → Defender trả lời có nhãn (DEFENDED / CONCEDED / NEEDS-HUMAN) → cập nhật sổ.

Khi chuyển tiếp, chỉ gửi **phần mới** (câu hỏi, câu trả lời) kèm bảng trạng thái rút gọn, không dán lại
toàn bộ lượt trước — agent đã giữ ngữ cảnh cũ.

**Dừng** khi: hết `--rounds` (mặc định 3, trần 8) · một vòng không có phản biện mới critical/major và
không đổi trạng thái · mọi mục đã đóng · Challenger báo "HẾT PHẢN BIỆN ĐÁNG KỂ" và không còn critical mở.

Vòng 1 không có mục critical/major → nghi đồng thuận giả: gửi Challenger thêm một lượt pre-mortem bắt
buộc trước khi dừng.

## Judge

Spawn agent mới (không tiếp nối agent cũ), prompt Judge. Đầu vào: Decision Card, framework, sổ phản biện
cuối, evidence digest. Judge đối chiếu ≥2 trích dẫn EXTRACTED quan trọng với digest. Brief theo mẫu đầy đủ
trong [brief-template](brief-template.md).
