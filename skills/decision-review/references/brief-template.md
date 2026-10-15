# Mẫu decision brief

Một phiên một file. Mỗi quyết định là một mục `## D<n>`; heading bên trong mục hạ một cấp (`###`, `####`).

## File phiên (tạo ở lần review đầu tiên)

```markdown
# Decision review — phiên <YYYY-MM-DD HH:mm>

| # | Quyết định | Domain · Mức | Phán quyết | Độ tin cậy | Cần xác nhận | Kết quả |
|---|------------|--------------|------------|------------|--------------|---------|
| D1 | <tên ngắn> | bid · quick | SỬA CÓ ĐIỀU KIỆN | 0.75 | 2 | chờ |
| D2 | <tên ngắn> | tech · note | NOTE | — | 0 | chờ |

<mục D1, D2… nối tiếp bên dưới>
```

Mỗi lần review thêm: append mục mới ở cuối + thêm một dòng vào bảng trên.

Cột `Kết quả`: mặc định `chờ`. Giá trị `đúng` | `sai` | `lật`, kèm lý do ngắn và nguồn
(`hội thoại — <lượt>` hoặc `path:line`). Chỉ ô này được sửa sau khi đã ghi.

## Mẫu một dòng cho `note`

```markdown
## D<n> — <tên> · note — <quyết định> · Lý do: <…> · Rút lại: <cách, thời gian>
```

Dòng mục lục ghi phán quyết `NOTE`.

## Mẫu compact cho một mục (quick / standard, ≤40 dòng)

```markdown
## D<n> — <tên ngắn>
> <YYYY-MM-DD HH:mm> · <bid|tech|ba|qa> · Mức <quick|standard> · Framework <mã>

### Phán quyết: <GIỮ | SỬA CÓ ĐIỀU KIỆN | BÁC | CHƯA ĐỦ DỮ LIỆU> — độ tin cậy <0.x>
<1–2 câu vì sao.>

| ID | Mức | Phản biện (nhãn) | Trả lời (nhãn) | Trạng thái |
|----|-----|------------------|----------------|------------|

**Việc cần làm:** <gạch đầu dòng, làm được ngay>
**Cần bạn xác nhận:** <câu hỏi — ảnh hưởng tới phán quyết> | "Không có"
**Điều kiện xem lại:** <sự kiện quan sát được>
**Đề xuất nâng mức:** <lý do> | (bỏ dòng nếu không cần)
```

## Mẫu đầy đủ cho một mục (deep)

Người đọc là người ra quyết định cuối, đọc lướt trong 2 phút. Phần trên cùng phải đủ để quyết; phần
dưới để kiểm khi cần.

```markdown
## D<n> — <tên ngắn của quyết định>

> Ngày: <YYYY-MM-DD> · Domain: <bid|tech|ba|qa> · Framework: <B2, B5…> · Số vòng: <n>/<max>
> Model: Defender <model> · Challenger <model> · Judge <model>

### Phán quyết: <GIỮ | SỬA CÓ ĐIỀU KIỆN | BÁC | CHƯA ĐỦ DỮ LIỆU> — độ tin cậy <0.x>

<1–2 câu vì sao.>

**Quyết định được review:** <nguyên văn từ Decision Card>
**Đề xuất bởi:** <skill/agent/người>

### Việc cần làm
- <Nếu SỬA: từng thay đổi bắt buộc, làm được ngay.>
- <Nếu CHƯA ĐỦ DỮ LIỆU: trả lời A → phán quyết X; trả lời B → phán quyết Y.>

### Cần bạn xác nhận
| # | Câu hỏi | Vì sao chỉ bạn trả lời được | Ảnh hưởng tới phán quyết |
|---|---------|-----------------------------|--------------------------|

### 3 điểm quyết định
1. **<O-id> <tiêu đề>** — Challenger: … · Defender: … · Bằng chứng: … → <kết luận>
2. …
3. …

### Điều kiện xem lại
- Nếu <sự kiện quan sát được> → mở lại quyết định.

### Kết quả theo framework
- **<Bx tên>:** <≤5 dòng>

### Sổ phản biện
<bảng cuối cùng>

<details>
<summary>Diễn biến tranh luận (<n> vòng)</summary>

#### Vòng 1
**Challenger:** …
**Defender:** …

</details>

### Hạn chế của lần review này
- <Evidence thiếu, file không đọc được, framework không phủ được khía cạnh nào.>
```

Quy tắc viết:
- Tiếng Việt tự nhiên, câu ngắn. Trích dẫn tài liệu giữ nguyên ngôn ngữ gốc.
- Mỗi khẳng định trong 3 phần đầu phải truy được về một dòng trong sổ phản biện.
- Không có mục nào cần xác nhận thì ghi "Không có" chứ không bỏ trống section.
