# LAB-1 — phần riêng của bài lab

**Thứ tự thi hành, gate, cảnh báo về skill con:** `~/.claude/skills/bid-pack/references/pipeline.md`.
File này chỉ ghi những gì **chỉ bài lab mới có**.

## Ánh xạ bước ↔ sản phẩm nộp

`Ph` = phase (`H` Hearing = bước 1–2 của đề · `B` Bidding = bước 3–9) · `Đề` = số bước trong đề bài ·
`Nộp` = số hiệu sản phẩm nộp ①–⑨.

| E | Ph | Đề | Nộp |
|---|---|---|---|
| E0 | H | — | — |
| E1 | H | 1 | — |
| E2 | H | 1 | — |
| E3 | H | 2 | ① |
| E4 | H | 2 | ① |
| E5 | B | 3+4 | ②③ |
| E6 | B | 4 | ③ |
| E7 | B | 7 | (khung) |
| E8 | B | 6 | ⑤ |
| E9 | B | 5 | ④ |
| E9b | B | 5 | ④ |
| E10 | B | 7 | ⑥ |
| E11 | B | 7 | ⑥ |
| E12 | B | 8 | ⑥ |
| E12b | B | — | — |
| E13 | B | 7 | ⑦ |
| E14 | B | 9 | ⑧ |
| E15 | B | 9 | ⑨ |
| E16 | B | — | — |

**Bid thật không có bảng này** — danh sách nộp suy từ mục thủ tục nộp thầu của chính RFP (`tkm:bid-run` ②).

## Ba bước bỏ qua có chủ đích

| E | Skill | Vì sao bỏ ở lab |
|---|---|---|
| E0 | `tkm:audio-transcribe` | Khách hư cấu, không có ghi âm. **Bid thật thì chạy.** Vẫn ghi "N/A" vào ⑨ |
| E9b | `tkm:pm-design-wireframe` | Tuỳ chọn, chỉ chạy nếu còn giờ |
| E12b | chuỗi `iac-*` | Đề không yêu cầu chi phí hạ tầng từ Terraform |

## Cầu nối format — 9 sản phẩm nộp

| Nộp | Nguồn | Đích |
|---|---|---|
| ① | `client-qa.xlsx` + `qa.md` + `BQ-xxx` | `submit/01-questions.xlsx` |
| ② | `function-list.md` §1 | `submit/02-function-list.xlsx` |
| ③ | `function-list.md` §2 + `functions/` | `submit/03-feature-list.xlsx` |
| ④ | `ia-spec.json` 画面一覧 | `submit/04-screen-list.xlsx` |
| ⑤ | `stories/story-*.md` | `submit/05-user-stories.xlsx` |
| ⑥ | estimate xlsx + `schedule.md` §3 | `submit/06-estimate-wbs.xlsx` |
| ⑦ | `risk-list.md` | `submit/07-risks.xlsx` |
| ⑧ | — | `submit/08-proposal.pptx` |
| ⑨ | journal | `submit/09-quick-report.md` |

**⑨ Quick Report là artifact của lab** — báo cáo cách dùng AI cho người chấm.
Bid thật **không nộp cái này cho khách**; nhật ký lỗi vẫn giữ nhưng là tài liệu nội bộ.

## Bàn giao sang LAB-3 (prototype)

LAB-1 **không** dựng prototype. Nhưng E9 phải xuất `ia-spec.json` ở dạng LAB-3 dùng lại được, vì
`tkm:uiux-build-prototype` cần **hai** đầu vào:

| Đầu vào | Sinh ở | Trạng thái sau LAB-1 |
|---|---|---|
| `ia-spec.json` | `tkm:uiux-design-information-architecture` | ✅ có, từ E9 |
| `um-spec.json` | `tkm:uiux-model-users` (ペルソナ / エンパシーマップ / カスタマージャーニー) | ❌ **chưa có** — chạy ở đầu LAB-3 |

Đừng nhầm `uiux-model-users` với E8. Chúng ra hai thứ khác nhau:
`pm-create-stories` ra **story gắn WBS ID** (`story-{WBS ID}-*.md`) — thứ estimate và schedule cần, và là
sản phẩm nộp ⑤. `uiux-model-users` ra **persona + journey + story mapping** (backbone × release slices) —
thứ prototype cần. LAB-1 lấy cái trước; LAB-3 bổ sung cái sau.

Hệ quả: đừng xoá hay dọn `ia-spec.json` khi đóng gói `submit/`. Nó là artifact liên-lab.

## Ngân sách 12h

**Tuần 1 — Hearing + đầu Bidding (~7h):** E1 `0.5` · E2 `1.0` · E3 `1.0` · E4 `1.5` · E5 `1.5` · E6 `1.0` · E7 `0.5`
**Tuần 2 — Bidding (~5h):** E8 `0.5` · E9 `1.0` · E10 `1.0` · E11+E12 `0.5` · E13 `1.0` · E14 `0.75` · E15 `0.25`

E9b và E12b là tuỳ chọn — chỉ chạy nếu còn giờ. E4 là bước đắt nhất và **không rút ngắn được bằng cách
để AI nghĩ hộ**: skill tự coi session 80% ý AI là session hỏng.

## Quy tắc ⑨ (chạy suốt pipeline)

Mở `plans/reports/ai-errors.md` từ **giờ đầu**. Mỗi lần bắt AI sai, ghi ngay một dòng:
`[thời điểm] [skill] [sai gì] [phát hiện bằng cách nào] [sửa sao]`.
Viết lại từ trí nhớ sau 2 tuần là mất sạch chi tiết — file này dễ chấm nhất và hay bị làm dối nhất.
