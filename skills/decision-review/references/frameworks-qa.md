# Framework — domain qa

Cho quyết định về kiểm thử và chất lượng: phạm vi test, cắt test, tiêu chí để release/UAT, hoãn bug,
xử lý test flaky, chọn tự động hóa, mức nghiêm trọng của bug.

## Định tuyến: chọn 2–3 framework

| Loại quyết định | Framework chính | Framework phụ |
|-----------------|-----------------|---------------|
| Phạm vi test, cắt test vì thiếu thời gian | Q1 Risk-based | Q2 Tiêu chí exit |
| Release, vào UAT, go/no-go chất lượng | Q2 Tiêu chí exit | Q3 Hoãn bug |
| Hoãn bug, known issue, test flaky | Q3 Hoãn bug | Q4 Bằng chứng test |
| "Test đã xanh nên ổn" | Q4 Bằng chứng test | Q1 Risk-based |
| Tự động hóa cái gì, manual cái gì | Q5 ROI tự động hóa | Q1 Risk-based |

Không khớp loại nào → Q1 + Q4 là cặp mặc định an toàn.

---

## Q1 Risk-based

Rủi ro = xác suất lỗi × tác động nếu lỗi lọt ra. Phần không test phải nằm ở vùng rủi ro thấp.

- Câu hỏi mồi: "Phần bị cắt có chạm tiền, phân quyền, dữ liệu thật, luồng chính không?" · "Lần trước lỗi
  hay nằm ở đâu?" · "Lỗi lọt ra thì ai phát hiện đầu tiên: mình, khách hay người dùng cuối?"
- Judge: cắt test ở vùng tác động cao mà không có biện pháp bù → phản biện major trở lên.

## Q2 Tiêu chí exit

Tiêu chí ra (pass rate, số bug mở theo severity, coverage các luồng chính) phải được định nghĩa **trước**
khi xem kết quả, để không hạ tiêu chí cho vừa kết quả.

- Câu hỏi mồi: "Tiêu chí này được chốt khi nào, ai đồng ý?" · "Hạ tiêu chí thì khách có biết không?" ·
  "Còn bug severity cao nào mở?"
- Judge: tiêu chí bị hạ sau khi thấy kết quả, hoặc khách chưa đồng ý → không được GIỮ.

## Q3 Hoãn bug / known issue / flaky

- Kiểm: severity và priority thật; có workaround không; ai chấp nhận rủi ro (khách đồng ý bằng văn bản?);
  có ticket và hạn sửa không; bug có thể lộ ra ở UAT hay production không.
- Test flaky: cách ly (quarantine) có hạn, sửa, hay xóa? Flaky làm cổng kiểm chập chờn thì mọi kết quả
  xanh sau đó kém tin cậy.
- Câu hỏi mồi: "Hoãn tới bao giờ, ai theo dõi?" · "Flaky này có che một lỗi thật không?"
- Judge: hoãn bug severity cao hoặc flaky trên luồng chính mà không có hạn và người chịu trách nhiệm →
  SỬA CÓ ĐIỀU KIỆN.

## Q4 Bằng chứng test (test oracle)

Test xanh chỉ chứng minh điều test thật sự kiểm. Hỏi test đó sẽ đỏ khi nào.

- Kiểm: test có chạy trên dữ liệu giống thật (seed, id thật) không; có kiểm kết quả hay chỉ kiểm không
  lỗi; đã từng thấy test đó đỏ (mutation, cố tình làm hỏng) chưa; có ít nhất một lần chạy end-to-end thật.
- Câu hỏi mồi: "Nếu code sai ở chỗ X thì test nào đỏ?" · "Test chạy với dữ liệu gì?"
- Judge: kết luận "đã ổn" chỉ dựa trên số test xanh, không có lần chạy thật hay bằng chứng test từng đỏ →
  CHƯA ĐỦ DỮ LIỆU.

## Q5 ROI tự động hóa

- So chi phí viết + bảo trì test tự động với số lần chạy và giá trị bắt lỗi. Phần hay đổi UI thì tự động
  hóa đắt; phần chạy lại mỗi release thì đáng.
- Câu hỏi mồi: "Test này chạy bao nhiêu lần trước khi dự án kết thúc?" · "Ai bảo trì khi UI đổi?"
- Judge: tự động hóa phần đổi liên tục, hoặc để manual phần chạy lại mỗi release, mà không có lý do →
  SỬA CÓ ĐIỀU KIỆN.
