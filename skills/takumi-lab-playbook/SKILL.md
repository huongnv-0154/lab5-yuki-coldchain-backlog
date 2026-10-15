---
name: takumi-lab-playbook
description: >
  Điều phối bài lab bidding Takumi (LAB-1 Hearing → LAB-5), đề Product B (chuỗi kho lạnh thực phẩm),
  người dùng đóng vai SDM trước một khách hàng Nhật hư cấu. Chuyển 9 sản phẩm nộp của đề bài thành
  một pipeline skill tkm có thứ tự thi hành đúng theo dependency thật của họ pm-*/ba-*, gắn cổng kiểm
  (gate) giữa các bước, tự chèn khai báo vai trò khi gọi skill con, và giữ chuỗi truy vết
  FG → F → Story → Screen → WBS không đứt.
  ALWAYS activate khi người dùng nhắc: lab bidding, LAB-1, LAB-2..LAB-5, phase Hearing, Product B,
  kho lạnh, takumi-lab-playbook, "bài lab", "9 sản phẩm nộp".
  SKIP: bid thật cho khách hàng thật (dùng tkm:bid-run); mọi việc lập trình.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - Skill
argument-hint: "[lab1|lab5|status|next] [--step E<n>]"
metadata:
  author: huongnv-0154
  version: "0.1.0"
---

> Bản sao công khai trong repo LAB-5: đã lược thông tin riêng của RFP (barem, trang, mã mục). Các đường dẫn `~/.claude/skills/...` là skill/tài liệu nội bộ trên máy tác giả, không nằm trong repo này; các thư mục `client-docs/`, `project/`, `submit/`, `plans/...` trong bảng "Ủy quyền thư mục" là cây làm việc LAB-1 của tác giả, cũng không có trong repo này.

> **Chạy độc lập vs phụ thuộc kit riêng.** Chạy độc lập được: `references/lab5-pipeline.md` (bảng phase ↔ cổng ↔ script của repo này), dùng cùng các script trong `scripts/`. Phụ thuộc kit riêng của chủ repo, nên **không chạy ngoài máy tác giả**: `~/.claude/skills/bid-pack/…`, `bids/product-b/`, các lệnh LAB-1 (`lab1`, G7 `check-consistency.py`). Đọc phần đó như tài liệu tham khảo.

# Takumi Lab Playbook

Điều phối bài thực hành bidding. Không tự làm thay việc của skill con — nó quyết định **gọi cái gì,
theo thứ tự nào, với vai gì, và chỉ cho đi tiếp khi nào**.

## Bối cảnh cố định

| | |
|---|---|
| Đề | **Product B — chuỗi kho lạnh thực phẩm**, khách hàng Nhật hư cấu |
| Vai người dùng | SDM, xuyên suốt LAB-1 → LAB-5 |
| Ngân sách | 12h trải 2 tuần (bước 1–6 tuần đầu, 7–9 tuần sau), **một lần nộp duy nhất** |
| Ngôn ngữ file | **JA** (mặc định repo). Hội thoại với người dùng: **tiếng Việt** |
| Đơn giá | mặc định ¥40.000/MD |
| Người đọc cuối | học viên **không làm cùng đề**, review chéo ở LAB-2 → cấm viết tắt riêng |

## Ủy quyền thư mục (đã được người dùng cho phép rõ ràng)

Hook global cấm tạo `.md` ngoài `plans/` và `docs/`. Người dùng **đã cho phép tường minh** cây
`project/` cho bài lab này (phiên 2026-09-12). Họ `pm-*`/`ba-*` ghi vào `project/` theo
`_shared/extras/pm-skills/project-layout.md` và **không chấp nhận đường dẫn biến thể** — đừng
đổi hướng chúng sang `plans/` hay `docs/`.

| Đường dẫn | Nội dung |
|---|---|
| `client-docs/` | tài liệu khách gửi (RFP, nghiệp vụ, ràng buộc, số liệu). **Không** để trong `plans/` — `index-docs` bỏ qua `plans/` |
| `project/` | deliverable do pm-*/ba-* quản lý |
| `plans/project-management/screens/` | workspace wireframe của `WF` |
| `plans/business-analysis/ba-memory.md` | ghi chú làm việc của BA |
| `submit/` | 9 file nộp sau khi convert sang xlsx/pptx |

> **Thứ tự thi hành E0–E16, các gate G1–G7, ba cảnh báo về skill con, bẫy `--lang` ở E3:**
> tất cả nằm ở `~/.claude/skills/bid-pack/references/pipeline.md` — dùng chung với bid thật.
> File này chỉ ghi phần **riêng của bài lab**.
>
> Làm thầu thật cho khách hàng thật thì dùng `tkm:bid-run`, không dùng skill này.

## Hai phase, một pipeline liền mạch

Khoá học chia đôi, nhưng đây là **một bài nộp duy nhất** — không có mốc bàn giao giữa hai phase.

| Phase | Bước đề bài | Slot thi hành | Việc |
|---|---|---|---|
| **Hearing** | 1–2 | **E0–E4** | Đọc tài liệu, săn bẫy nghiệp vụ, soạn câu hỏi gửi khách |
| **Bidding** | 3–9 | **E5–E16** | Function/feature/screen/story list → estimate/WBS → cost → rủi ro → slide |

Phase Bidding **tiêu thụ** output của Hearing, không chạy lại. Cụ thể: `qa.md` + `BQ-xxx` sinh ở
E3–E4 là đầu vào cho tiền đề giả định của estimate ở E10, và cho rủi ro ở E13 — đừng hỏi lại từ đầu.

## Thứ tự thi hành ≠ thứ tự nộp — đọc kỹ

Đề bài đánh số 9 bước theo **logic suy luận**. Kit có **dependency cứng khác**:

- `pm-create-stories` **dừng hẳn** nếu `schedule.md` §3 rỗng → WBS phải có TRƯỚC user story.
- `pm-design-wireframe` lấy `stories/` §5–§9 làm đầu vào chính → story nên có trước màn hình.
- `ba-analyze-requirement` **dừng hẳn** nếu `function-list.md` chưa có dòng thật.

Cách hoà giải, **giữ nguyên ràng buộc cốt lõi của đề** ("không ước lượng trước rồi mới nghĩ ra list"):

> Ở bước **E7** chỉ dựng **khung WBS** (Epic/Story suy ra từ FG/F của `function-list.md`), để cột effort
> `TBD`. **Con số** chỉ sinh ở **E10** bằng `tkm:estimate`, rồi nạp ngược lại `schedule.md` Block B.
> Khung đến từ function list, số đến từ khung — chuỗi suy luận của đề còn nguyên.

Đọc [`references/lab1-pipeline.md`](references/lab1-pipeline.md) để có bảng ánh xạ E0–E16 ↔ sản phẩm nộp đầy đủ.

## Cổng kiểm (gate)

Không qua cổng thì không sang bước sau. Khi chặn, nói rõ **thiếu gì** và **skill nào sở hữu** nó.

| Gate | Sau bước | Điều kiện qua |
|---|---|---|
| G1 | E2 | **Mọi lỗi bị loại mà RFP nêu đều có phán quyết riêng + dẫn chứng trang**; `glossary.md` có ≥1 mục `[慣行]`; mọi kết luận gắn nhãn `EXTRACTED / INFERRED / AMBIGUOUS` |
| G2 | E4 | mọi `AMBIGUOUS` đã thành câu hỏi trong `qa.md` hoặc `BQ-xxx`; mọi câu `critical` có **`estimate_impact`** định lượng |
| G3 | E6 | `function-list.md` §1 (FG) và §2 (F) không còn dòng template; mỗi `F-xxx` thuộc đúng 1 `FG-xx`; **mỗi F truy vết được tới một mã yêu cầu của RFP** (compliance matrix) |
| G4 | E9 | mọi `F-xxx` trong phạm vi đều truy ra được ≥1 màn hình trong `ia-spec.json` (画面一覧); không màn hình nào mồ côi |
| G5 | trước E10 | `tkm:estimate` chỉ được đọc `project/` + `estimate-config.yaml`. **Không đọc `client-docs/`** — vi phạm là ước lượng thẳng từ RFP |
| G6 | trước E13 | mọi `INFERRED` có trong tiền đề giả định của ⑥; mọi `BQ`/`qa.md` chưa trả lời có trong ⑦; **mọi con số trong ⑥ trỏ được tới mã fixture/NFR** (không dùng số tròn không căn cứ) |

## Chèn vai tự động

Mỗi lần dispatch sang skill con, **prepend khối vai** lấy từ
[`references/role-injection.md`](references/role-injection.md). Người dùng không phải gõ lại.

## Luật chơi khách đã nêu — đọc TRƯỚC mọi thứ khác

RFP thường viết sẵn barem chấm, mẫu bảng giá, mẫu câu hỏi, cổng nghiệm thu và các lỗi bị loại.
Đọc phần đó trước mọi thứ khác và ghi thành tài liệu nội bộ của sản phẩm (`bids/<id>/rfp-rules.md`
trên máy người làm — không công khai). Dồn giờ vào các bước mà barem chấm nặng nhất; bước nào barem
chấm nhẹ thì đừng đánh bóng.

## Bẫy nghiệp vụ Nhật

Bước E2 là pass riêng, **không gộp vào E1**. Checklist theo sản phẩm ở tài liệu nội bộ
`bids/<id>/jp-business-traps.md` (không công khai). Bẫy bắt được phải chảy vào
**ba nơi**: `glossary.md`, câu hỏi ①, và rủi ro ⑦.

## Lệnh

| Lệnh | Việc |
|---|---|
| `lab1` | chạy pipeline LAB-1 từ bước dở dang |
| `lab5` | chạy LAB-5 theo [`references/lab5-pipeline.md`](references/lab5-pipeline.md): phase P0–P5, mỗi phase một phiên `/tkm:takumi … --auto` |
| `status` | quét `project/` + `plans/`, báo bước nào xong, gate nào đang chặn |
| `next` | chỉ chạy bước kế tiếp rồi dừng ở gate |
| `--step E<n>` | chạy đúng một bước |

`status` xác định tiến độ bằng **nội dung file**, không bằng sự tồn tại của file — skeleton rỗng
tính là chưa làm (theo quy ước của chính kit: xét cột `Function name`, không xét cột ID).

## G7 — cổng nhất quán (thuộc `tkm:bid-pack`)

Công cụ **không** nằm trong skill này nữa. Playbook chỉ gọi:

```bash
python3 ~/.claude/skills/bid-pack/scripts/check-consistency.py --profile product-b -v
```

- 11 invariant và xuất xứ từng mục: `bid-pack/references/invariants.md`
- Phần riêng của RFP Product B: `~/.claude/skills/bids/product-b/profile.json`
- Thiếu profile → `INV-0` FAIL, **không pass im lặng**

Lý do tách: cổng này dùng cho mọi gói thầu, không riêng lab. Giữ trong playbook thì bid thật
không dùng lại được, mà chép sang chỗ khác thì lại sinh đúng kiểu trùng lặp đã đẻ ra 8 lỗi đếm lệch.

## Tài liệu theo sản phẩm (L2)

Nội dung riêng của RFP **không** nằm trong skill này. Product B ở `~/.claude/skills/bids/product-b/` (nội bộ, không có trong repo):

| File | Nội dung |
|---|---|
| `profile.json` | Mẫu bảng giá, mẫu câu số, quy tắc cứng, metadata RFP — nuôi cổng G7 |
| `rfp-rules.md` | Quy tắc thủ tục khách đặt ra: barem chấm, lỗi bị loại, các phần đề xuất, cổng nghiệm thu |
| `jp-business-traps.md` | Bẫy nghiệp vụ kho lạnh Nhật |
| `qa_data.py` | Nội dung bộ câu hỏi gửi khách |

Làm lab cho sản phẩm khác: thêm `bids/<id>/` rồi truyền `--profile <id>`. **Không sửa gì trong `bid-pack/scripts/`.**
