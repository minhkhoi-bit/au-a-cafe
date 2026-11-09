/**
 * ============================================================
 * [DEPRECATED / BACKWARD COMPATIBILITY]
 * File này được giữ lại để tương thích ngược. Toàn bộ logic đã được
 * tái cấu trúc chuẩn MVC sang:
 * - Model: 4.js/models/
 * - View: 1.admin/owner.view.js
 * - Controller: 1.admin/owner.controller.js
 * ============================================================
 */


// 1. Chuyển đổi giữa 4 Tabs trong Dashboard
function initOwnerTabs() {
  const ownerNavBtns = document.querySelectorAll('.owner-nav-btn');
  const ownerTabPanels = document.querySelectorAll('.owner-tab-panel');

  ownerNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      ownerNavBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      ownerTabPanels.forEach(panel => {
        panel.style.display = 'none';
        panel.classList.remove('active');
      });

      const activePanel = document.getElementById(`tab${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`);
      if (activePanel) {
        activePanel.style.display = 'block';
        activePanel.classList.add('active');
      }

      // Re-render khi tab mở ra
      if (targetTab === 'overview') renderOwnerOverview();
      if (targetTab === 'bookings') renderOwnerBookingsTable();
      if (targetTab === 'menu') renderOwnerMenuGrid();
      if (targetTab === 'settings') loadSettingsForm();
    });
  });

  const viewAllBookingsBtn = document.getElementById('viewAllBookingsBtn');
  if (viewAllBookingsBtn) {
    viewAllBookingsBtn.addEventListener('click', () => {
      const tabBookingsBtn = document.querySelector('.owner-nav-btn[data-tab="bookings"]');
      if (tabBookingsBtn) tabBookingsBtn.click();
    });
  }
}

// 2. Render toàn bộ Dashboard chủ quán
function renderOwnerDashboard() {
  renderOwnerOverview();
  renderOwnerBookingsTable();
  renderOwnerMenuGrid();
  loadSettingsForm();
}

// 3. --- TAB 1: TỔNG QUAN (OVERVIEW) ---
function renderOwnerOverview() {
  const bookings = getData('bookingsData', []);
  const menuData = getData('menuData', DEFAULT_MENU);
  const today = getLocalDateString();

  const todayBookings = bookings.filter(b => b.bookDate === today && b.status !== 'cancelled');
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const todayGuests = todayBookings.reduce((sum, b) => sum + (Number(b.guests) || 0), 0);
  const activeMenuItems = menuData.filter(m => m.available !== false).length;

  const statTodayBookings = document.getElementById('statTodayBookings');
  const statPendingBookings = document.getElementById('statPendingBookings');
  const statTodayGuests = document.getElementById('statTodayGuests');
  const statActiveMenuItems = document.getElementById('statActiveMenuItems');

  if (statTodayBookings) statTodayBookings.textContent = todayBookings.length;
  if (statPendingBookings) statPendingBookings.textContent = pendingBookings.length;
  if (statTodayGuests) statTodayGuests.textContent = todayGuests;
  if (statActiveMenuItems) statActiveMenuItems.textContent = activeMenuItems;

  // Badge số đơn chờ trên sidebar
  const ownerPendingBadge = document.getElementById('ownerPendingBadge');
  if (ownerPendingBadge) {
    if (pendingBookings.length > 0) {
      ownerPendingBadge.textContent = pendingBookings.length;
      ownerPendingBadge.style.display = 'inline-block';
    } else {
      ownerPendingBadge.style.display = 'none';
    }
  }

  // 5 lượt đặt gần nhất
  const quickList = document.getElementById('recentBookingsQuickList');
  if (quickList) {
    if (bookings.length === 0) {
      quickList.innerHTML = `<p style="color: var(--text-muted); font-style: italic; padding: 1rem 0;">Chưa có lượt đặt bàn nào.</p>`;
      return;
    }

    quickList.innerHTML = bookings.slice(0, 5).map(item => `
      <div class="quick-booking-row">
        <div>
          <strong>${escapeHtml(item.fullName)}</strong> (${item.guests} người)
          <div style="font-size: 0.82rem; color: var(--text-muted);">
            ${escapeHtml(item.bookTime)} ngày ${formatDateVN(item.bookDate)} • ${escapeHtml(item.area)}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          ${renderStatusBadge(item.status)}
          ${item.status === 'pending' ? `
            <button class="btn btn-sm btn-action-confirm" onclick="window.ownerConfirmBooking(${item.id})">Xác nhận</button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }
}

// 4. --- TAB 2: QUẢN LÝ ĐẶT BÀN (BOOKINGS MANAGEMENT) ---
function initOwnerBookingFilters() {
  const ownerSearchCustomer = document.getElementById('ownerSearchCustomer');
  const ownerFilterDate = document.getElementById('ownerFilterDate');
  const ownerFilterStatus = document.getElementById('ownerFilterStatus');

  if (ownerSearchCustomer) ownerSearchCustomer.addEventListener('input', renderOwnerBookingsTable);
  if (ownerFilterDate) ownerFilterDate.addEventListener('change', renderOwnerBookingsTable);
  if (ownerFilterStatus) ownerFilterStatus.addEventListener('change', renderOwnerBookingsTable);
}

function renderOwnerBookingsTable() {
  const tbody = document.getElementById('ownerBookingsTbody');
  const emptyNotice = document.getElementById('ownerBookingsEmpty');
  const ownerSearchCustomer = document.getElementById('ownerSearchCustomer');
  const ownerFilterDate = document.getElementById('ownerFilterDate');
  const ownerFilterStatus = document.getElementById('ownerFilterStatus');

  if (!tbody) return;

  let bookings = getData('bookingsData', []);
  const today = getLocalDateString();
  const searchTerm = (ownerSearchCustomer ? ownerSearchCustomer.value.toLowerCase().trim() : '');
  const dateFilter = (ownerFilterDate ? ownerFilterDate.value : 'all');
  const statusFilter = (ownerFilterStatus ? ownerFilterStatus.value : 'all');

  // Lọc theo tìm kiếm
  if (searchTerm) {
    bookings = bookings.filter(b => 
      (b.fullName && b.fullName.toLowerCase().includes(searchTerm)) ||
      (b.email && b.email.toLowerCase().includes(searchTerm))
    );
  }

  // Lọc theo ngày
  if (dateFilter === 'today') {
    bookings = bookings.filter(b => b.bookDate === today);
  } else if (dateFilter === 'upcoming') {
    bookings = bookings.filter(b => b.bookDate >= today);
  }

  // Lọc theo trạng thái
  if (statusFilter !== 'all') {
    bookings = bookings.filter(b => b.status === statusFilter);
  }

  if (bookings.length === 0) {
    tbody.innerHTML = '';
    if (emptyNotice) emptyNotice.style.display = 'block';
    return;
  }

  if (emptyNotice) emptyNotice.style.display = 'none';

  tbody.innerHTML = bookings.map(item => `
    <tr>
      <td data-label="Khách hàng"><strong>${escapeHtml(item.fullName)}</strong></td>
      <td data-label="Email">${escapeHtml(item.email)}</td>
      <td data-label="Ngày đến">${formatDateVN(item.bookDate)}</td>
      <td data-label="Giờ đến">${escapeHtml(item.bookTime)}</td>
      <td data-label="Số khách">${item.guests} người</td>
      <td data-label="Khu vực">${escapeHtml(item.area)}</td>
      <td data-label="Ghi chú" style="max-width: 180px; font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(item.notes || '-')}</td>
      <td data-label="Trạng thái">${renderStatusBadge(item.status)}</td>
      <td data-label="Thao tác">
        <div class="table-actions">
          ${item.status !== 'confirmed' ? `
            <button class="btn btn-sm btn-action-confirm" onclick="window.ownerConfirmBooking(${item.id})" title="Xác nhận đặt bàn">Xác nhận</button>
          ` : ''}
          ${item.status !== 'cancelled' ? `
            <button class="btn btn-sm btn-action-cancel" onclick="window.ownerCancelBooking(${item.id})" title="Hủy lượt đặt">Hủy</button>
          ` : ''}
          <button class="btn-action-delete" onclick="window.ownerDeleteBooking(${item.id})" title="Xóa vĩnh viễn" aria-label="Xóa lượt đặt">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Gắn các hàm thao tác bảng vào window để gọi từ inline onclick
window.ownerConfirmBooking = function(id) {
  let bookings = getData('bookingsData', []);
  const idx = bookings.findIndex(b => b.id === id);
  if (idx !== -1) {
    bookings[idx].status = 'confirmed';
    setData('bookingsData', bookings);
    renderOwnerDashboard();
    if (typeof renderCustomerBookings === 'function') renderCustomerBookings();
    showToast('Đã xác nhận lượt đặt bàn thành công! ✓');
  }
};

window.ownerCancelBooking = function(id) {
  if (confirm('Bạn có chắc muốn HỦY lượt đặt bàn này không?')) {
    let bookings = getData('bookingsData', []);
    const idx = bookings.findIndex(b => b.id === id);
    if (idx !== -1) {
      bookings[idx].status = 'cancelled';
      setData('bookingsData', bookings);
      renderOwnerDashboard();
      if (typeof renderCustomerBookings === 'function') renderCustomerBookings();
      showToast('Đã chuyển lượt đặt bàn sang trạng thái ĐÃ HỦY.');
    }
  }
};

window.ownerDeleteBooking = function(id) {
  if (confirm('Hành động này sẽ XÓA VĨNH VIỄN lượt đặt bàn. Bạn có chắc không?')) {
    let bookings = getData('bookingsData', []);
    bookings = bookings.filter(b => b.id !== id);
    setData('bookingsData', bookings);
    renderOwnerDashboard();
    if (typeof renderCustomerBookings === 'function') renderCustomerBookings();
    showToast('Đã xóa lượt đặt bàn khỏi hệ thống.');
  }
};

// 5. --- TAB 3: QUẢN LÝ MENU (MENU MANAGEMENT) ---
function renderOwnerMenuGrid() {
  const ownerMenuGrid = document.getElementById('ownerMenuGrid');
  if (!ownerMenuGrid) return;
  const menuData = getData('menuData', DEFAULT_MENU);

  if (menuData.length === 0) {
    ownerMenuGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem 0;">Menu hiện đang trống. Hãy nhấn nút "+ Thêm Món Mới" để bắt đầu!</p>`;
    return;
  }

  const categoryMap = { coffee: 'Cà Phê', tea: 'Trà Trái Cây', cake: 'Bánh Ngọt' };

  ownerMenuGrid.innerHTML = menuData.map(item => `
    <div class="owner-menu-item">
      <div class="owner-menu-header">
        <img 
          src="${escapeHtml(item.img)}" 
          alt="${escapeHtml(item.name)}" 
          class="owner-menu-thumb"
          onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500&q=80'"
        >
        <div class="owner-menu-meta">
          <h4 class="owner-menu-title">${escapeHtml(item.name)}</h4>
          <div class="owner-menu-price">${formatCurrency(item.price)}</div>
          <span class="menu-tag" style="margin-top: 0.3rem;">${categoryMap[item.category] || item.category}</span>
        </div>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; flex-grow: 1;">${escapeHtml(item.desc || '-')}</p>
      <div class="owner-menu-item-actions">
        <label class="availability-toggle" title="Bật/tắt trạng thái mở bán">
          <input 
            type="checkbox" 
            ${item.available !== false ? 'checked' : ''} 
            onchange="window.ownerToggleMenuAvailable('${item.id}', this.checked)"
          >
          <span>${item.available !== false ? 'Đang bán' : 'Hết hàng'}</span>
        </label>
        <div style="display: flex; gap: 0.4rem;">
          <button class="btn btn-sm btn-secondary" onclick="window.ownerOpenEditMenuModal('${item.id}')">Sửa</button>
          <button class="btn btn-sm btn-action-cancel" onclick="window.ownerDeleteMenuItem('${item.id}')">Xóa</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Thao tác menu qua window
window.ownerToggleMenuAvailable = function(id, isAvailable) {
  let menuData = getData('menuData', DEFAULT_MENU);
  const idx = menuData.findIndex(m => m.id === id);
  if (idx !== -1) {
    menuData[idx].available = isAvailable;
    setData('menuData', menuData);
    renderOwnerMenuGrid();
    if (typeof renderCustomerMenu === 'function') renderCustomerMenu();
    showToast(isAvailable ? `Đã mở bán lại món!` : `Đã đánh dấu hết hàng!`);
  }
};

window.ownerOpenEditMenuModal = function(id) {
  const menuItemModal = document.getElementById('menuItemModal');
  const menuModalTitle = document.getElementById('menuModalTitle');
  const menuData = getData('menuData', DEFAULT_MENU);
  const item = menuData.find(m => m.id === id);
  if (!item || !menuItemModal) return;

  document.getElementById('menuItemId').value = item.id;
  document.getElementById('menuItemName').value = item.name;
  document.getElementById('menuItemPrice').value = item.price;
  document.getElementById('menuItemCategory').value = item.category;
  document.getElementById('menuItemImg').value = item.img;
  document.getElementById('menuItemDesc').value = item.desc || '';
  document.getElementById('menuItemAvailable').checked = (item.available !== false);

  if (menuModalTitle) menuModalTitle.textContent = 'Chỉnh Sửa Món Ăn';
  clearMenuModalErrors();
  menuItemModal.classList.add('active');
};

window.ownerDeleteMenuItem = function(id) {
  if (confirm('Bạn có chắc muốn xóa món này khỏi menu không?')) {
    let menuData = getData('menuData', DEFAULT_MENU);
    menuData = menuData.filter(m => m.id !== id);
    setData('menuData', menuData);
    renderOwnerMenuGrid();
    if (typeof renderCustomerMenu === 'function') renderCustomerMenu();
    renderOwnerOverview();
    showToast('Đã xóa món khỏi Menu');
  }
};

function clearMenuModalErrors() {
  const nErr = document.getElementById('menuNameError');
  const pErr = document.getElementById('menuPriceError');
  const iErr = document.getElementById('menuImgError');
  if (nErr) nErr.textContent = '';
  if (pErr) pErr.textContent = '';
  if (iErr) iErr.textContent = '';
}

function initOwnerMenuModal() {
  const openAddMenuModalBtn = document.getElementById('openAddMenuModalBtn');
  const menuItemModal = document.getElementById('menuItemModal');
  const menuItemForm = document.getElementById('menuItemForm');
  const cancelMenuModalBtn = document.getElementById('cancelMenuModalBtn');
  const menuModalTitle = document.getElementById('menuModalTitle');

  if (openAddMenuModalBtn && menuItemModal && menuItemForm) {
    openAddMenuModalBtn.addEventListener('click', () => {
      document.getElementById('menuItemId').value = '';
      menuItemForm.reset();
      document.getElementById('menuItemAvailable').checked = true;
      if (menuModalTitle) menuModalTitle.textContent = 'Thêm Món Mới';
      clearMenuModalErrors();
      menuItemModal.classList.add('active');
    });
  }

  if (cancelMenuModalBtn && menuItemModal) {
    cancelMenuModalBtn.addEventListener('click', () => menuItemModal.classList.remove('active'));
  }

  if (menuItemForm && menuItemModal) {
    menuItemForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearMenuModalErrors();

      const id = document.getElementById('menuItemId').value;
      const name = document.getElementById('menuItemName').value.trim();
      const price = Number(document.getElementById('menuItemPrice').value);
      const category = document.getElementById('menuItemCategory').value;
      let img = document.getElementById('menuItemImg').value.trim();
      const desc = document.getElementById('menuItemDesc').value.trim();
      const available = document.getElementById('menuItemAvailable').checked;

      let isValid = true;

      // Validate tên
      if (!name) {
        document.getElementById('menuNameError').textContent = 'Vui lòng nhập tên món.';
        isValid = false;
      }

      // Validate giá
      if (isNaN(price) || price <= 0) {
        document.getElementById('menuPriceError').textContent = 'Giá tiền phải là số lớn hơn 0.';
        isValid = false;
      }

      // Validate URL ảnh (nếu rỗng thì dùng ảnh mặc định)
      if (img) {
        if (!/^https?:\/\//i.test(img)) {
          document.getElementById('menuImgError').textContent = 'URL ảnh phải bắt đầu bằng http:// hoặc https://';
          isValid = false;
        }
      } else {
        img = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500&q=80';
      }

      if (isValid) {
        let menuData = getData('menuData', DEFAULT_MENU);

        if (id) {
          // Sửa món
          const idx = menuData.findIndex(m => m.id === id);
          if (idx !== -1) {
            menuData[idx] = { id, name, price, category, img, desc, available };
            showToast('Đã cập nhật thông tin món! ✓');
          }
        } else {
          // Thêm món mới
          const newId = 'menu_' + Date.now();
          menuData.push({ id: newId, name, price, category, img, desc, available });
          showToast('Đã thêm món mới vào menu! ✓');
        }

        setData('menuData', menuData);
        menuItemModal.classList.remove('active');
        renderOwnerMenuGrid();
        if (typeof renderCustomerMenu === 'function') renderCustomerMenu();
        renderOwnerOverview();
      }
    });
  }
}

// 6. --- TAB 4: CÀI ĐẶT QUÁN (SHOP SETTINGS) ---
function loadSettingsForm() {
  const settings = getData('shopSettings', DEFAULT_SETTINGS);
  const nameEl = document.getElementById('settingShopName');
  const openEl = document.getElementById('settingOpenTime');
  const closeEl = document.getElementById('settingCloseTime');
  const maxEl = document.getElementById('settingMaxGuests');
  const phoneEl = document.getElementById('settingPhone');
  const addrEl = document.getElementById('settingAddress');

  if (nameEl) nameEl.value = settings.name || '';
  if (openEl) openEl.value = settings.openTime || '08:00';
  if (closeEl) closeEl.value = settings.closeTime || '22:30';
  if (maxEl) maxEl.value = settings.maxGuests || 20;
  if (phoneEl) phoneEl.value = settings.phone || '';
  if (addrEl) addrEl.value = settings.address || '';
}

function initOwnerSettingsForm() {
  const shopSettingsForm = document.getElementById('shopSettingsForm');
  if (!shopSettingsForm) return;

  shopSettingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('settingShopName').value.trim();
    const openTime = document.getElementById('settingOpenTime').value;
    const closeTime = document.getElementById('settingCloseTime').value;
    const maxGuests = parseInt(document.getElementById('settingMaxGuests').value, 10);
    const phone = document.getElementById('settingPhone').value.trim();
    const address = document.getElementById('settingAddress').value.trim();

    const nameError = document.getElementById('settingNameError');
    if (nameError) nameError.textContent = '';

    if (!name) {
      if (nameError) nameError.textContent = 'Tên quán không được để trống.';
      return;
    }

    const updatedSettings = {
      name,
      openTime: openTime || '08:00',
      closeTime: closeTime || '22:30',
      maxGuests: isNaN(maxGuests) || maxGuests < 1 ? 20 : maxGuests,
      phone,
      address
    };

    setData('shopSettings', updatedSettings);
    if (typeof applyShopSettingsToUI === 'function') applyShopSettingsToUI();
    showToast('Đã lưu thông tin cài đặt quán thành công! ✓');
  });
}

// 7. Khởi tạo toàn bộ View Quản Trị Viên (Owner)
function initOwnerView() {
  initOwnerTabs();
  initOwnerBookingFilters();
  initOwnerMenuModal();
  initOwnerSettingsForm();
}

