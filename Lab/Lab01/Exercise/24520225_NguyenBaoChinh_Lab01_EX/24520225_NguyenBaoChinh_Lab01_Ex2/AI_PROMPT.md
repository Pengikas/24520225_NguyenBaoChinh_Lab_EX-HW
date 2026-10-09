Bạn là một Lead Frontend Engineer đang thực hiện Exercise 1: Semantic DOM Architecture & A11y Contract cho dự án:

"AI-Enhanced B2B Aviation Engine & Parts E-Commerce Marketplace with RUL-Based Replacement Recommendation" (nền tảng thương mại điện tử B2B cho phụ tùng/động cơ hàng không, tích hợp AI dự đoán RUL - Remaining Useful Life để gợi ý thời điểm thay thế linh kiện).

Hãy thực hiện TUẦN TỰ theo đúng các bước sau, KHÔNG được gộp bước, KHÔNG được bỏ qua bước nào:

## STEP 1: Task Decomposition
Tạo file `TASK_DECOMPOSITION.md` khai báo WBS Task T-01 với nội dung:
- Task ID: T-01
- Task name: Semantic DOM Architecture & A11y Contract
- Scope: Xây dựng khung HTML gốc (landing/dashboard shell) cho nền tảng marketplace hàng không, đảm bảo cấu trúc landmark chuẩn semantic HTML5, không dùng div để dàn trang.
- Deliverable: index.html
- Acceptance criteria: đúng landmark hierarchy, có skip-link, verify được bằng Chrome DevTools Accessibility Tree.

## STEP 2: Landmark Hierarchy Contract
Định nghĩa và triển khai cấu trúc landmark cho index.html với ĐÚNG 0 thẻ <div> layout-level. Cấu trúc bắt buộc gồm:
- <header role="banner"> chứa tên nền tảng (ví dụ: "AeroPartsAI Marketplace") và role người dùng đang đăng nhập (VD: "Lead Engineer, MRO Procurement")
- <nav role="navigation" aria-label="Primary"> chứa các mục điều hướng chính: Search Parts, RUL Prediction, Marketplace, Orders, Suppliers
- <main id="main-content" role="main"> chứa các <section> tương ứng: 
  - #search (tìm kiếm phụ tùng động cơ)
  - #rul-dashboard (bảng dự đoán RUL cho thiết bị)
  - #recommendations (gợi ý thay thế linh kiện dựa trên AI)
  - #marketplace (danh sách nhà cung cấp/sản phẩm)
- <aside role="complementary"> (nếu cần) cho bộ lọc tìm kiếm hoặc cảnh báo RUL khẩn cấp
- <footer role="contentinfo">

## STEP 3: Accessible Skip-Link
Thêm skip-link đầu tiên trong <body>:
<a href="#main-content" class="skip-link">Skip to main content</a>
Đảm bảo skip-link ẩn mặc định, hiện khi focus bằng bàn phím (CSS chỉ mô tả yêu cầu, KHÔNG viết CSS trong commit này).

## STEP 4: Atomic Commit
Sau khi hoàn tất index.html, tạo commit atomic với message:
git commit -m "feat(html): semantic landmark tree for aviation marketplace"
Commit này CHỈ được chứa thay đổi HTML. Nếu có CSS đi kèm, tách thành commit riêng.

## VERIFICATION GATE (bắt buộc trước khi báo hoàn thành):
1. Mở Chrome DevTools -> tab Accessibility -> Landmarks, xác nhận cây landmark đúng thứ tự: banner -> navigation -> main (với các section con) -> contentinfo.
2. Xác nhận số lượng thẻ <div> layout-level = 0 (có thể dùng <div> chỉ cho các thành phần không mang ý nghĩa cấu trúc bên trong section, nhưng ưu tiên semantic tags: <article>, <ul>, <table>, <form>...).
3. Nếu commit gộp CSS + HTML -> tự báo lỗi và yêu cầu tách lại, tính 0 điểm cho commit đó (one-shot prompt penalty).

Sau khi hoàn tất cả 4 bước, in ra:
- Nội dung đầy đủ của TASK_DECOMPOSITION.md
- Nội dung đầy đủ của index.html
- Kết quả kiểm tra landmark tree (mô tả bằng text như thể đã mở DevTools)
- Commit message đã dùng

Không giải thích dài dòng ngoài các mục trên. Trình bày rõ ràng theo từng STEP.