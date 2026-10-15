---
name: decision-review
description: >
  Phản biện một quyết định do AI hoặc skill khác đề xuất/chốt: Challenger hỏi nguồn và lý do, Defender
  trả lời bằng bằng chứng, Judge chấm theo framework rồi ra decision brief. Người dùng không cần tham gia
  giữa chừng, chỉ đọc brief để quyết. 4 mức: note (1 dòng, việc nhỏ dễ rút lại), quick (mặc định, session
  chính tự phản biện), standard (thêm 1 Challenger độc lập khác model — tự chạy khi chạm phân quyền,
  ADR/validator, test flaky, dữ liệu thật, cam kết với khách), deep (nhiều vòng + Judge độc lập).
  Chỉ dùng input có sẵn trong session (người dùng, AI/skill khác, file được nêu đích danh), không tự đi tìm.
  4 domain: bid (mặc định — go/no-go, estimate, đơn giá, phạm vi cam kết), tech, ba (BA/BrSE — diễn giải
  yêu cầu, chốt spec, change request, Q&A khách), qa (phạm vi test, release, hoãn bug, test flaky).
  ALWAYS activate khi: "review quyết định", "phản biện quyết định", "decision review", "có nên chốt",
  "chốt spec này được chưa", "có nên release", "hoãn bug này được không",
  "check lại quyết định này", "cho 2 AI cãi nhau", "go/no-go", "quyết định này ổn không", "/decision-review".
  SKIP: quyết định chưa hình thành, còn đang tìm phương án (dùng tkm:brainstorm); soi rủi ro kỹ thuật
  của một thay đổi code (dùng tkm:predict-risks); review code (dùng tkm:review-code).
argument-hint: "[quyết định | đường dẫn file] [--level note|quick|standard|deep] [--domain bid|tech|ba|qa] [--rounds N] [--same-model] [--grill] [--html]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Agent
  - SendMessage
  - ToolSearch
  - AskUserQuestion
---

# Decision Review

> Bản sao để nộp LAB-5 của skill global `~/.claude/skills/decision-review` (ngày 2026-10-15). Dùng được độc lập trong Claude Code; các skill `tkm:` nhắc tới là tuỳ chọn.

Phản biện **một** quyết định rồi ra phán quyết để người dùng tự quyết. Người dùng chỉ đọc brief cuối.

Tham khảo ý tưởng (không copy nội dung): `tjboudreaux/cc-thinking-skills` (socratic, steel-manning,
reversibility — MIT), `Hainrixz/abogado-del-diablo` (pre-mortem nhiều góc — MIT).

## Chọn mức

Mỗi subagent có sàn ~55k token ngữ cảnh (system prompt + tool + rule) trước khi làm gì. Vì vậy số agent
quyết định chi phí, không phải số vòng.

| Mức | Cách chạy | Ước lượng | Độ độc lập | Dùng khi |
|-----|-----------|-----------|------------|----------|
| `note` | 1 dòng ghi vào file phiên, không Challenger/Judge | ~0 token thêm | — | Chỉ khi đủ cả 3: rút lại được trong <15 phút; không có tín hiệu nâng mức; người dùng/AI chưa nêu phản biện nào. Người dùng ghi `--level note`, hoặc skill đề xuất trong câu trả lời ngắn (không tự chọn khi người dùng đã ghi mức khác) |
| `quick` (mặc định) | Session chính đóng cả 3 vai — [quick-mode](references/quick-mode.md) | ~1 phút, ~10–20k token | Thấp | Quyết định lab, nội bộ, dễ rút lại; chốt nhanh |
| `standard` | 1 Challenger subagent khác model, 1 lượt; session chính trả lời + chấm | ~2–3 phút, ~70–90k | Vừa | Cần một mắt độc lập nhưng không cần tranh luận dài |
| `deep` | Defender + Challenger nhiều vòng + Judge độc lập — [deep-mode](references/deep-mode.md) | ~10 phút, ~0,5–1M | Cao | One-way door của bid thật, kiến trúc khó rút lại |

### Tín hiệu nâng mức

- chạm phân quyền / vai trò / RLS;
- sửa hoặc tạo ngoại lệ cho ADR, validator, cổng kiểm;
- để lại (defer) test đang fail/flaky hoặc bug severity cao; hạ tiêu chí exit để release/vào UAT;
- chốt diễn giải yêu cầu với khách, hoặc nhận change request;
- xoá / ghi đè dữ liệu thật;
- cam kết với khách hoặc số tiền của bid thật;
- one-way door.

Có tín hiệu mà người dùng không ghi `--level` → **tự chạy standard**, không hỏi. Câu trả lời mở đầu bằng
một dòng: "Chạy standard vì <tín hiệu>". Người dùng đã ghi `--level` → theo người dùng.

## Cờ

| Cờ | Mặc định | Ý nghĩa |
|----|----------|---------|
| `--level` | `quick` | Xem bảng trên. Không ghi mà gặp tín hiệu nâng mức → tự chạy `standard` |
| `--domain bid\|tech\|ba\|qa` | `bid` | Bộ framework: [bid](references/frameworks-bid.md) · [tech](references/frameworks-tech.md) · [ba](references/frameworks-ba.md) (BA/BrSE) · [qa](references/frameworks-qa.md). Không ghi cờ mà quyết định rõ ràng thuộc domain khác → tự đổi, nói một dòng. Quyết định chạm 2 domain → chọn domain chính, được mượn 1 framework của domain kia |
| `--rounds N` | `3` | Chỉ cho `deep`. Trần 8 |
| `--same-model` | tắt | `standard`/`deep`: mặc định Challenger chạy model khác session; cờ này tắt cross-model. Gọi model khác bị lỗi (model bị chặn, không có) → tự quay về cùng model, ghi "cross-model không khả dụng" vào phần hạn chế của brief |
| `--grill` | tắt | Người dùng vào vai Defender, trả lời qua AskUserQuestion (mọi mức). Luật hỏi ở mục "Luật `--grill`" |
| `--html` | tắt | Xuất brief thành Artifact (load `artifact-design` trước) |

## Luật cứng

1. **Subagent không hỏi được người dùng.** Thiếu thông tin chỉ con người biết → `NEEDS-HUMAN`, không đoán.
2. **Mọi lập luận gắn nhãn** theo `tkm:confidence`: `[EXTRACTED: path:line | hội thoại — <ai, lượt nào>]`, `[INFERRED]`,
   `[ASSUMPTION]`. Không nhãn = không được tính.
3. **Challenger chỉ rút phản biện khi có bằng chứng EXTRACTED đối chiếu được với digest.** Lời lẽ thuyết
   phục không đủ.
4. **Judge chấm theo tiêu chí in sẵn trong file framework**, không theo bên nào nói hay hơn.
5. Không ai sửa file của dự án. Chỉ session chính ghi report.
6. Số liệu, cam kết, điều kiện trong tài liệu gốc trích nguyên văn, kể cả tiếng Nhật.
7. **Không đi tìm input.** Chỉ dùng những gì có trong session (xem Bước 1).
8. **Nhãn gắn theo từng câu khẳng định, không theo cả ô.** DEFENDED chỉ khi mọi câu mà trả lời dựa vào
   đều EXTRACTED. Câu về trạng thái file/code/dữ liệu, "tiền lệ", "đã có", "đã làm", "giống lần trước"
   phải là `path:line` của file có trong session; lời của chính bên đề xuất (hội thoại — người/AI đề
   xuất) không tính là EXTRACTED cho loại câu này. Thiếu → câu đó là ASSUMPTION, mục thành NEEDS-HUMAN
   (hoặc OPEN nếu là phản biện của Challenger).

## Luật `--grill`

Người dùng thay Defender. Session chính hỏi lần lượt từng câu của Challenger:
- **Mỗi lần một câu** qua AskUserQuestion, không gộp nhiều câu.
- 2–4 phương án trả lời cụ thể, một phương án gắn "(Recommended)" kèm lý do một dòng; luôn có đường "Other".
- Câu trả lời ghi ngay vào sổ phản biện, nhãn `[EXTRACTED: người dùng, <ngày>]` hoặc `NEEDS-HUMAN` nếu
  người dùng cũng chưa biết.
- Câu sau được chọn dựa trên câu trả lời trước; bỏ câu đã trở nên thừa.
- Người dùng nói "đủ rồi", "proceed", "chốt đi" → dừng hỏi, chuyển sang Judge ngay.

## Bước 1 — Decision Card + evidence digest (mọi mức)

Nguồn quyết định: đối số người dùng → file được chỉ đến → quyết định gần nhất trong hội thoại. Không xác
định được → hỏi người dùng một câu rồi mới chạy. Quyết định dính nhiều ý → tách, review từng cái.

```
DECISION CARD
- Quyết định: <một câu, khẳng định, đo được nếu có thể>
- Người/skill đề xuất: <…>
- Lý do gốc: <tóm tắt, trích nếu có>
- Phương án đã bỏ: <nếu biết>
- Ràng buộc đã biết: <deadline, luật chơi khách, quyết định đã chốt trước>
- Domain: bid | tech | ba | qa · Framework: <2–3 mã + lý do một dòng>
```

**Input chỉ lấy từ session nơi skill được gọi.** Không quét thư mục, không tìm tài liệu mới, không web
search, không tự xuống code. Nguồn hợp lệ:
- đối số người dùng truyền vào skill;
- nội dung đã có trong hội thoại: tin nhắn người dùng, output của AI hoặc skill khác (quyết định, lý do,
  số liệu, bảng, trích dẫn);
- file mà người dùng hoặc AI **đã nêu đích danh** trong hội thoại/đối số — chỉ đọc đúng đoạn được nhắc.

**Evidence digest** = trích từ các nguồn trên, gom **một lần** rồi dùng lại cho mọi vai:
- ≤60 dòng, mỗi dòng có nguồn: `hội thoại — <ai nói, lượt nào>` hoặc `path:line` (file được nêu).
- `standard`/`deep`: dán digest **nguyên văn** vào prompt agent. Agent không có nguồn nào khác.
- Thiếu thông tin → Defender ghi `NEEDS-HUMAN`, không đi tìm. Thiếu tới mức không dựng nổi Decision Card
  (không rõ quyết định là gì) → hỏi người dùng một câu.
- Input chỉ có lập luận của bên đề xuất → ghi `[chỉ có lập luận của bên đề xuất]` vào phần hạn chế của
  brief. Challenger dồn vào giả định ngầm, mâu thuẫn nội tại, phương án bị bỏ qua, và điều gì phải đúng
  thì quyết định mới đứng.
- Muốn có thêm bằng chứng từ tài liệu/codebase → **trước** khi gọi skill, trong cùng session: chạy
  `tkm:ask-expert` nếu máy có, hoặc dán / nêu đích danh đoạn tài liệu, code liên quan. Output đó tự thành input.

## Bước 2 — Chọn framework

Đọc bảng định tuyến trong file framework của domain, rồi chỉ đọc mục của 2–3 framework đã chọn.

## Bước 3 — Chạy theo mức

- **quick** → làm theo [quick-mode](references/quick-mode.md).
- **standard** → (không có tool Agent → chạy quick, ghi "không có Agent, đã chạy quick" vào phần hạn chế)
  1. Spawn **một** Challenger (prompt Challenger trong [roles-and-prompts](references/roles-and-prompts.md)),
     `general-purpose`, `run_in_background: false`, truyền `model` khác session trừ khi `--same-model`.
     Đầu vào: Decision Card + digest + câu hỏi mồi. Một lượt duy nhất, không dùng tool, trả lời ≤30 dòng.
  2. Session chính viết phần Defender từ digest (luật như Defender trong quick-mode), rồi chấm như Judge
     theo tiêu chí framework. Không gửi lại cho Challenger.
- **deep** → làm theo [deep-mode](references/deep-mode.md).

Phán quyết là một trong 4:
- **GIỮ** — không còn phản biện critical/major mở.
- **SỬA CÓ ĐIỀU KIỆN** — giữ hướng, kèm thay đổi cụ thể bắt buộc.
- **BÁC** — có critical đã chứng minh, không vá được trong phạm vi quyết định.
- **CHƯA ĐỦ DỮ LIỆU** — phán quyết phụ thuộc mục NEEDS-HUMAN mức critical.

## Bước 4 — Brief

- `note`: mẫu một dòng trong [brief-template](references/brief-template.md).
- `quick`/`standard`: mẫu **compact** (≤40 dòng) trong [brief-template](references/brief-template.md).
- `deep`: mẫu đầy đủ, diễn biến đặt cuối trong `<details>`.

**Một phiên = một file.** Mọi quyết định review trong cùng một phiên ghi chung vào một file .md:
- Hội thoại chưa có file decision-review nào do skill này ghi → tạo mới
  `{reports_path}/decision-review-{YYMMDD-HHmm}-session.md` (timestamp lúc tạo; `{reports_path}` theo
  `## Naming` của hook, không có thì `plans/reports/`). Khung file theo mẫu "File phiên" trong brief-template.
- Đã có (đường dẫn nằm trong hội thoại) → **append** một mục `## D<n> — <tên ngắn>` vào cuối file và thêm
  một dòng vào bảng mục lục đầu file. Không tạo file mới, không sửa mục của quyết định trước. File đã có
  mà không theo mẫu "File phiên" (không có bảng mục lục, ghi theo format cũ) → không append, tạo file phiên
  mới như trên và giữ nguyên file cũ.
- Review lại một quyết định đã có trong file → thêm mục mới `D<n> (review lại D<k>)`, không ghi đè mục cũ.
- Không tìm file của phiên khác trên đĩa.
- Mỗi lần append D mới, soát các D cũ có Kết quả `chờ`: điều kiện xem lại đã xảy ra hoặc quyết định đã
  bị lật trong hội thoại → cập nhật ô Kết quả. Đây là ngoại lệ duy nhất cho luật không sửa mục cũ (chỉ
  sửa ô này).

Trả lời người dùng ngắn: phán quyết + độ tin cậy, 3 điểm quyết định, cần xác nhận,
link file, và dòng "Đề xuất nâng mức" nếu có. `--html` → publish Artifact.

Ngôn ngữ brief: tiếng Việt câu ngắn, tự nhiên (theo `response-style-vi` nếu có), trích dẫn giữ nguyên ngôn ngữ gốc.

## Liên quan

- Trước: `tkm:estimate`, `tkm:bidding-proposal`, `tkm:bid-run`, `tkm:brainstorm`, `tkm:create-plan`.
- `tkm:ask-expert` (không bắt buộc): chạy trước trong session nếu cần bằng chứng từ tài liệu/codebase.
- Mọi skill nhắc trong file này đều không bắt buộc cài; skill chạy đủ khi chỉ có Claude Code.
- Nhãn bằng chứng: `tkm:confidence` (không bắt buộc cài — 3 nhãn đã định nghĩa ở Luật cứng).
