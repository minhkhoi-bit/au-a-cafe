/**
 * ============================================================
 * TẬP TIN JS: ĐIỀU PHỐI TRANG QUẢN TRỊ (ADMIN CONTROLLER)
 * Chạy duy nhất trên admin.html
 * ============================================================
 */

// 1. Kiểm tra xác thực — bảo vệ trang, chuyển về customer.html nếu chưa đăng nhập quyền nhân viên
function checkAdminAuth() {
  if (typeof firebase === 'undefined' || !window.db) {
    window.location.href = '../2.customer/customer.html';
    return Promise.resolve(false);
  }
  return new Promise(resolve => {
    let version = 0;
    firebase.auth().onAuthStateChanged(async user => {
      const currentVersion = ++version;
      let allowed = false;
      try {
        if (user) allowed = (await window.db.collection('admins').doc(user.uid).get({ source: 'server' })).exists;
      } catch (error) { console.warn('Không thể xác minh quyền quản trị:', error); }
      if (currentVersion !== version) return;
      if (!allowed) window.location.href = '../2.customer/customer.html';
      else {
        const name = document.getElementById('adminStaffName');
        if (name) name.textContent = UserModel.getCurrentUser()?.fullName || user.email;
      }
      resolve(allowed);
    }, () => { window.location.href = '../2.customer/customer.html'; resolve(false); });
  });
}

// 5. Đăng xuất — xoá phiên đăng nhập và chuyển về trang khách
function initAdminLogout() {
  const ownerLogoutBtn = document.getElementById('ownerLogoutBtn');
  if (ownerLogoutBtn) {
    ownerLogoutBtn.addEventListener('click', async () => {
      if (typeof UserModel !== 'undefined') {
        await UserModel.logout();
      }
      window.location.href = '../2.customer/customer.html';
    });
  }
}

// 7. Đồng bộ Realtime qua sự kiện 'storage' (khi customer.html thay đổi dữ liệu)
function initAdminMultiTabSync() {
  window.addEventListener('storage', (e) => {
    const watchedKeys = ['bookingsData', 'menuData', 'shopSettings'];
    if (watchedKeys.includes(e.key)) {
      if (typeof OwnerController !== 'undefined') {
        const activeTab = OwnerController.activeTab;
        if (activeTab === 'overview') {
          OwnerController.loadOverview();
        } else if (activeTab === 'bookings' && e.key === 'bookingsData') {
          OwnerController.loadBookings();
        } else if (activeTab === 'menu' && e.key === 'menuData') {
          OwnerController.loadMenu();
        } else if (activeTab === 'settings' && e.key === 'shopSettings') {
          OwnerController.loadSettings();
        }
      }

      if (e.key === 'shopSettings' && typeof OwnerView !== 'undefined') {
        const settings = ShopSettingsModel.get();
        if (OwnerView.elements.shopLogoText) OwnerView.elements.shopLogoText.textContent = settings.name;
        if (OwnerView.elements.pageTitle) OwnerView.elements.pageTitle.textContent = `Bàn Quản Trị | ${settings.name}`;
        document.querySelectorAll('.dynamic-shop-name').forEach(el => el.textContent = settings.name);
      }
    }
  });
}

// 8. Khởi động trang Quản Trị
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof UserModel !== 'undefined') await UserModel.init();
  if (!await checkAdminAuth()) return;

  initStorage();
  OwnerController.init();
  OwnerController.loadAll();

  initTheme();
  initAdminLogout();
  initModalCloseHandlers();
  initAdminMultiTabSync();
});

