# Dự Án Web: Cafè (Hệ Thống Hai Góc Nhìn: Khách Hàng & Chủ Quán)
**Môn học:** Lập trình Web cơ bản  
**Kiến trúc:** Chuẩn mô hình **MVC (Model - View - Controller)** trên nền tảng Vanilla JavaScript  
**Công nghệ:** HTML, CSS, JavaScript, localStorage, Firebase Authentication và Cloud Firestore.

---

## 1. Cấu trúc thư mục theo chuẩn Kiến trúc MVC (Model - View - Controller)
Toàn bộ mã nguồn dự án đã được tái cấu trúc triệt để theo đúng nguyên lý tách biệt trách nhiệm (Separation of Concerns) của mô hình MVC:

```text
DuAnWeb-LapTrinhWeb/
├── 1.admin/                      # GIAO DIỆN & ĐIỀU PHỐI QUẢN TRỊ (ADMIN/OWNER)
│   ├── admin.html                # Bàn quản trị của chủ quán
│   ├── owner.css                 # Giao diện Sidebar, Bảng điều khiển, Quản lý đặt bàn, CRUD menu
│   ├── owner.view.js             # [VIEW] Thao tác DOM, tạo HTML table/grid và bắt sự kiện admin
│   ├── owner.controller.js       # [CONTROLLER] Điều phối giữa OwnerView và các Models
│   └── admin.js                  # Khởi chạy trang admin, Dark mode, bảo vệ phiên đăng nhập
│
├── 2.customer/                   # GIAO DIỆN & ĐIỀU PHỐI KHÁCH HÀNG (CUSTOMER)
│   ├── customer.html             # Trang chủ, xem thực đơn, form đặt bàn, lịch sử
│   ├── customer.css              # Giao diện Hero banner, Menu card, Form đặt bàn
│   ├── customer.view.js          # [VIEW] Thao tác DOM, form validation UI, render thẻ món ăn
│   ├── customer.controller.js    # [CONTROLLER] Tiếp nhận action người dùng, gọi Model & update View
│   └── main.js                   # Khởi chạy trang khách, Dark mode, Mobile menu, Realtime multi-tab
│
├── 3.css/                        # TẦNG STYLESHEET CHUNG
│   ├── theme.css                 # Quản lý CSS Variables (màu sắc, dark mode palette, typography)
│   ├── base.css                  # Reset CSS, Typography, Container, Header/Navbar, Footer
│   ├── components.css            # Buttons, Badges, Modals, Action Buttons, Toast
│   └── responsive.css            # Media Queries tối ưu Responsive (Mobile, Tablet, Desktop)
│
└── 4.js/                         # TẦNG DỮ LIỆU & TIỆN ÍCH CHUNG
    ├── helpers.js                # Tiện ích: escapeHtml (chống XSS), formatCurrency, formatDateVN, showToast
    ├── storage.js                # Tầng lưu trữ an toàn localStorage & bộ dữ liệu mặc định ban đầu
    └── models/                   # [MODELS] QUẢN LÝ DỮ LIỆU & NGHIỆP VỤ (KHÔNG CHẠM VÀO DOM)
        ├── user.model.js         # Model Tài khoản: login, registerCustomer, getCurrentUser, logout
        ├── menu.model.js         # Model Thực đơn: getAll, getById, add, update, delete, toggleAvailability
        ├── booking.model.js      # Model Đặt bàn: create, filter, updateStatus, delete, getStatistics
        └── settings.model.js     # Model Cấu hình quán: get, update, getAvailableTimeSlots
```

---

## 2. Chi tiết 3 tầng MVC trong dự án

###  1. Lớp Model (`4.js/models/`)
- **Nhiệm vụ:** Quản lý cấu trúc dữ liệu, các thao tác CRUD và logic tính toán dữ liệu thuần túy.
- **Tính độc lập:** Các file Model **hoàn toàn không đụng đến DOM** (`document`, `innerHTML` hay `querySelector`).
  - [`user.model.js`](4.js/models/user.model.js): Đăng ký, đăng nhập và xác định quyền qua Firebase.
  - [`menu.model.js`](4.js/models/menu.model.js): Quản lý danh sách món và trạng thái bán.
  - [`booking.model.js`](4.js/models/booking.model.js): Quản lý, lọc và thống kê đặt bàn.
  - [`settings.model.js`](4.js/models/settings.model.js): Quản lý cấu hình quán và khung giờ đặt bàn.

###  2. Lớp View (`customer.view.js` & `owner.view.js`)
- **Nhiệm vụ:** Nhận dữ liệu từ Controller và tạo ra mã HTML giao diện; đăng ký lắng nghe sự kiện từ người dùng (click, submit, change) và chuyển giao cho Controller xử lý qua các callback.
- **Tính độc lập:** View **không được gọi trực tiếp `localStorage` hay sửa đổi dữ liệu gốc**.
  - [`customer.view.js`](2.customer/customer.view.js): Hiển thị giao diện khách hàng.
  - [`owner.view.js`](1.admin/owner.view.js): Hiển thị giao diện quản trị.

###  3. Lớp Controller (`customer.controller.js` & `owner.controller.js`)
- **Nhiệm vụ:** Đóng vai trò là "nhạc trưởng" trung gian:
  1. Lắng nghe hành động của người dùng từ View.
  2. Kiểm tra tính hợp lệ dữ liệu (Validation).
  3. Gọi Model tương ứng để cập nhật dữ liệu.
  4. Lấy dữ liệu mới nhất từ Model truyền ngược lại cho View cập nhật giao diện.

---

## 3. Hệ thống Xác Thực & Phân Quyền (Authentication & Roles)
- Bật phương thức **Email/Password** trong Firebase Authentication. Khách đăng ký và đăng nhập bằng email, mật khẩu; hồ sơ lưu tại `users/{uid}`.
- Để tạo admin, tạo tài khoản trong Firebase Authentication, lấy UID rồi tạo document `admins/{uid}` trong Firestore bằng Firebase Console hoặc Admin SDK. Không tạo document này từ client.
- Đăng nhập bằng email của admin ở trang khách, sau đó mở `1.admin/admin.html`. Trang quản trị kiểm tra phiên Firebase và document `admins/{uid}`.
- Cấu hình Firestore Security Rules theo [`firestore.rules`](firestore.rules) trước khi sử dụng; file trong dự án không tự được triển khai.

---

## 4. Hệ thống Hai Góc Nhìn (Two-Perspective System)
1. **Góc nhìn Khách hàng (`customer.html`):**
   - Khám phá thực đơn phân loại mượt mà (Cà phê, Trà, Bánh), tự động gắn nhãn "Hết hàng" nếu món đang tắt bán.
   - Form đặt bàn tự động tính khung giờ nhận khách khả dụng theo cấu hình của quán (loại bỏ giờ đã qua nếu chọn ngày hôm nay).
   - "Lịch sử đặt bàn của bạn": Sử dụng `myBookingIds` và `userId` để hiển thị chính xác các lượt đặt của chính khách đó, kèm huy hiệu màu theo dõi trạng thái xác nhận từ chủ quán theo thời gian thực.

2. **Góc nhìn Chủ quán / Nhân viên (`admin.html`):**
   - Kiểm tra phiên Firebase và tài liệu `admins/{uid}` trước khi khởi động.
   - Có nút **"Đăng xuất"** để chuyển lại góc nhìn khách.
   - **4 Tab Quản Trị:**
     1. **Tổng quan:** 4 thẻ thống kê tự động (đặt bàn hôm nay, đơn chờ xác nhận, tổng khách hôm nay, món đang bán) + danh sách 5 đơn mới nhất.
     2. **Quản lý đặt bàn:** Bảng tra cứu toàn diện (họ tên, email, ngày, giờ, số khách, khu vực, ghi chú, trạng thái). Hỗ trợ tìm kiếm theo tên và lọc theo ngày/trạng thái. Nút "Xác nhận", "Hủy", "Xóa".
     3. **Quản lý menu:** Thêm món mới, sửa giá/mô tả/ảnh, xóa món, công tắc bật/tắt "Đang mở bán" hoặc "Hết hàng". Cập nhật trực tiếp sang góc nhìn khách.
     4. **Cài đặt quán:** Điều chỉnh tên quán, giờ mở cửa/đóng cửa, số khách tối đa mỗi lượt đặt, hotline, địa chỉ. Dữ liệu lưu và tự động cập nhật lên toàn bộ giao diện khách.

3. **Cơ chế Đồng Bộ Đa Tab (Realtime Multi-tab):**
   - Lắng nghe sự kiện `storage` của trình duyệt. Bạn có thể mở 2 tab song song (1 tab Khách hàng, 1 tab Chủ quán) để quan sát dữ liệu thay đổi và cập nhật tức thì mà không cần load lại trang.
