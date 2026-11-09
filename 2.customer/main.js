/**
 * ============================================================
 * TẬP TIN JS: ĐIỀU PHỐI TRANG KHÁCH HÀNG (CUSTOMER MAIN)
 * Chạy duy nhất trên customer.html
 * ============================================================
 */

// Đồng bộ Realtime khi thay đổi dữ liệu qua localStorage (giữa các tab)
function initMultiTabSync() {
  window.addEventListener('storage', (e) => {
    if (e.key === 'branchData' || e.key === 'selectedBranchId') {
      CustomerController.loadBranches();
    }
    if (e.key === 'menuData') {
      if (typeof CustomerController.loadMenu === 'function') {
        CustomerController.loadMenu();
      }
      // Đồng bộ Featured khi dữ liệu menu thay đổi từ tab khác
      if (typeof CustomerController.loadFeatured === 'function') {
        CustomerController.loadFeatured();
      }
      CustomerController.loadFavorites();
    }
    if (e.key === 'favoritesData') {
      CustomerController.loadMenu();
      CustomerController.loadFeatured();
      CustomerController.loadFavorites();
    }
    if (e.key === 'bookingsData' || e.key === 'myBookingIds') {
      if (typeof CustomerController.loadBookings === 'function') {
        CustomerController.loadBookings();
      }
    }
  });
}

// Khởi động trang Khách Hàng sau khi cây DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Khởi tạo kho dữ liệu lưu trữ
  initStorage();
  await UserModel.init();

  // 2. Khởi động Controller điều phối theo mô hình MVC
  CustomerController.init();
  window.addEventListener('authChanged', () => {
    CustomerController.loadAuth();
    CustomerController.loadBookings();
    CustomerController.loadFavorites();
  });

  // 3. Đăng ký các sự kiện dùng chung (đóng modal backdrop/ESC & realtime đa tab)
  initModalCloseHandlers();
  initMultiTabSync();
});
