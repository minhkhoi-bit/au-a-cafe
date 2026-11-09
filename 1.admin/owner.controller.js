/**
 * ============================================================
 * CONTROLLER: ĐIỀU PHỐI QUẢN TRỊ (OWNER / ADMIN CONTROLLER)
 * Nhạc trưởng kết nối OwnerView và các Models:
 * MenuModel, BookingModel, ShopSettingsModel
 * ============================================================
 */

const OwnerController = {
  activeTab: 'overview',

  init() {
    this.initTabs();
    this.initFilterEvents();
    this.initActionEvents();
    this.initMenuModalEvents();
    this.initSettingsEvents();
    this.loadAll();
  },

  loadAll() {
    this.loadOverview();
    this.loadBookings();
    this.loadMenu();
    this.loadSettings();
  },

  // 1. Tải dữ liệu Tab 1: Tổng quan
  loadOverview() {
    const stats = BookingModel.getStatistics();
    const activeCount = MenuModel.countActive();
    OwnerView.renderOverview(stats, activeCount);
  },

  // 2. Tải dữ liệu Tab 2: Quản lý Đặt bàn
  loadBookings() {
    const searchTerm = OwnerView.elements.ownerSearchCustomer ? OwnerView.elements.ownerSearchCustomer.value : '';
    const dateFilter = OwnerView.elements.ownerFilterDate ? OwnerView.elements.ownerFilterDate.value : 'all';
    const statusFilter = OwnerView.elements.ownerFilterStatus ? OwnerView.elements.ownerFilterStatus.value : 'all';

    const filteredBookings = BookingModel.filter({ searchTerm, dateFilter, statusFilter });
    OwnerView.renderBookingsTable(filteredBookings);
  },

  // 3. Tải dữ liệu Tab 3: Quản lý Menu
  loadMenu() {
    const menuData = MenuModel.getAll();
    OwnerView.renderMenuGrid(menuData);
  },

  // 4. Tải dữ liệu Tab 4: Cài đặt quán
  loadSettings() {
    const settings = ShopSettingsModel.get();
    OwnerView.renderSettingsForm(settings);
  },

  // 5. Chuyển đổi giữa 4 Tabs
  initTabs() {
    const ownerNavBtns = document.querySelectorAll('.owner-nav-btn');
    const ownerTabPanels = document.querySelectorAll('.owner-tab-panel');

    ownerNavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        this.activeTab = targetTab;

        ownerNavBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        ownerTabPanels.forEach(panel => {
          panel.classList.remove('active');
        });

        const activePanel = document.getElementById(`tab${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`);
        if (activePanel) {
          activePanel.classList.add('active');
        }

        // Re-render khi tab mở ra
        if (targetTab === 'overview') this.loadOverview();
        if (targetTab === 'bookings') this.loadBookings();
        if (targetTab === 'menu') this.loadMenu();
        if (targetTab === 'settings') this.loadSettings();
      });
    });

    const viewAllBookingsBtn = document.getElementById('viewAllBookingsBtn');
    if (viewAllBookingsBtn) {
      viewAllBookingsBtn.addEventListener('click', () => {
        const tabBookingsBtn = document.querySelector('.owner-nav-btn[data-tab="bookings"]');
        if (tabBookingsBtn) tabBookingsBtn.click();
      });
    }
  },

  // 6. Sự kiện lọc & tìm kiếm đơn đặt bàn
  initFilterEvents() {
    const { ownerSearchCustomer, ownerFilterDate, ownerFilterStatus } = OwnerView.elements;
    if (ownerSearchCustomer) ownerSearchCustomer.addEventListener('input', () => this.loadBookings());
    if (ownerFilterDate) ownerFilterDate.addEventListener('change', () => this.loadBookings());
    if (ownerFilterStatus) ownerFilterStatus.addEventListener('change', () => this.loadBookings());
  },

  initActionEvents() {
    const { recentBookingsQuickList, ownerBookingsTbody, ownerMenuGrid } = OwnerView.elements;
    const handleClick = event => {
      const button = event.target.closest('button[data-action][data-id]');
      if (!button) return;
      const id = button.dataset.id;
      switch (button.dataset.action) {
        case 'confirm-booking': this.confirmBooking(Number(id)); break;
        case 'cancel-booking': this.cancelBooking(Number(id)); break;
        case 'delete-booking': this.deleteBooking(Number(id)); break;
        case 'edit-menu': this.editMenuItem(id); break;
        case 'delete-menu': this.deleteMenuItem(id); break;
        case 'toggle-menu': this.toggleMenuAvailability(id); break;
      }
    };
    [recentBookingsQuickList, ownerBookingsTbody, ownerMenuGrid].forEach(element => {
      if (element) element.addEventListener('click', handleClick);
    });
  },

  // 7. Thao tác đơn đặt bàn (Xác nhận, Hủy, Xóa)
  confirmBooking(id) {
    BookingModel.updateStatus(id, 'confirmed');
    this.loadAll();
    showToast('Đã xác nhận lượt đặt bàn thành công! ✓');
  },

  cancelBooking(id) {
    if (confirm('Bạn có chắc muốn HỦY lượt đặt bàn này không?')) {
      BookingModel.updateStatus(id, 'cancelled');
      this.loadAll();
      showToast('Đã chuyển lượt đặt bàn sang trạng thái ĐÃ HỦY.');
    }
  },

  deleteBooking(id) {
    if (confirm('Hành động này sẽ XÓA VĨNH VIỄN lượt đặt bàn. Bạn có chắc không?')) {
      BookingModel.delete(id);
      this.loadAll();
      showToast('Đã xóa lượt đặt bàn khỏi hệ thống.');
    }
  },

  // 8. Quản lý Modal Menu (Thêm / Sửa / Bật tắt / Xóa món)
  initMenuModalEvents() {
    const addMenuItemBtn = document.getElementById('openAddMenuModalBtn');
    const cancelMenuModalBtn = document.getElementById('cancelMenuModalBtn');
    const { menuItemForm } = OwnerView.elements;

    if (addMenuItemBtn) {
      addMenuItemBtn.addEventListener('click', () => {
        OwnerView.openMenuModal(null);
      });
    }

    if (cancelMenuModalBtn) {
      cancelMenuModalBtn.addEventListener('click', () => {
        OwnerView.closeMenuModal();
      });
    }

    if (menuItemForm) {
      menuItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleMenuFormSubmit();
      });
    }
  },

  handleMenuFormSubmit() {
    const formData = OwnerView.getMenuFormData();
    const { menuNameError, menuPriceError, menuImgError } = OwnerView.elements;

    if (menuNameError) menuNameError.textContent = '';
    if (menuPriceError) menuPriceError.textContent = '';
    if (menuImgError) menuImgError.textContent = '';

    let isValid = true;

    if (!formData.name) {
      if (menuNameError) menuNameError.textContent = 'Vui lòng nhập tên món.';
      isValid = false;
    }

    if (isNaN(formData.price) || formData.price <= 0) {
      if (menuPriceError) menuPriceError.textContent = 'Giá tiền phải lớn hơn 0đ.';
      isValid = false;
    }

    if (formData.img && !formData.img.startsWith('http://') && !formData.img.startsWith('https://')) {
      if (menuImgError) menuImgError.textContent = 'Link ảnh phải bắt đầu bằng http:// hoặc https://';
      isValid = false;
    }

    if (!formData.img) {
      formData.img = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80';
    }

    if (isValid) {
      if (formData.id) {
        MenuModel.update(formData.id, formData);
        showToast('Đã cập nhật thông tin món! ✓');
      } else {
        MenuModel.add(formData);
        showToast('Đã thêm món mới vào menu! ✓');
      }

      OwnerView.closeMenuModal();
      this.loadMenu();
      this.loadOverview();
    }
  },

  editMenuItem(id) {
    const item = MenuModel.getById(id);
    if (item) {
      OwnerView.openMenuModal(item);
    }
  },

  toggleMenuAvailability(id) {
    const updated = MenuModel.toggleAvailability(id);
    if (updated) {
      this.loadMenu();
      this.loadOverview();
      showToast(updated.available ? 'Đã bật mở bán món!' : 'Đã đánh dấu hết hàng.');
    }
  },

  deleteMenuItem(id) {
    if (confirm('Bạn có chắc muốn xóa món này khỏi menu không?')) {
      MenuModel.delete(id);
      this.loadMenu();
      this.loadOverview();
      showToast('Đã xóa món khỏi thực đơn.');
    }
  },

  // 9. Cài đặt thông tin quán
  initSettingsEvents() {
    const { shopSettingsForm, settingNameError } = OwnerView.elements;
    if (!shopSettingsForm) return;

    shopSettingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = OwnerView.getSettingsFormData();
      const settingGeneralError = document.getElementById('settingGeneralError');

      if (settingNameError) settingNameError.textContent = '';
      if (settingGeneralError) settingGeneralError.textContent = '';

      const result = ShopSettingsModel.update(formData);
      if (!result.success) {
        if (!formData.name && settingNameError) {
          settingNameError.textContent = 'Tên quán không được để trống.';
        }
        if (settingGeneralError) {
          settingGeneralError.textContent = result.message;
        }
        return;
      }

      this.loadSettings();
      showToast('Đã lưu thông tin cài đặt quán thành công! ✓');
    });
  }
};

// Gắn các hàm thao tác bảng & card ra window để các thẻ onclick gọi được
window.ownerConfirmBooking = (id) => OwnerController.confirmBooking(id);
window.ownerCancelBooking = (id) => OwnerController.cancelBooking(id);
window.ownerDeleteBooking = (id) => OwnerController.deleteBooking(id);
window.ownerEditMenuItem = (id) => OwnerController.editMenuItem(id);
window.ownerToggleAvailability = (id) => OwnerController.toggleMenuAvailability(id);
window.ownerDeleteMenuItem = (id) => OwnerController.deleteMenuItem(id);

