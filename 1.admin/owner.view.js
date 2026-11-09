/**
 * ============================================================
 * VIEW: BẢNG QUẢN TRỊ CHỦ QUÁN (OWNER / ADMIN VIEW)
 * Chỉ xử lý DOM, render HTML và lắng nghe tương tác giao diện Admin.
 * ============================================================
 */

const OwnerView = {
  elements: {
    statTodayBookings: document.getElementById('statTodayBookings'),
    statPendingBookings: document.getElementById('statPendingBookings'),
    statTodayGuests: document.getElementById('statTodayGuests'),
    statActiveMenuItems: document.getElementById('statActiveMenuItems'),
    ownerPendingBadge: document.getElementById('ownerPendingBadge'),
    recentBookingsQuickList: document.getElementById('recentBookingsQuickList'),
    ownerBookingsTbody: document.getElementById('ownerBookingsTbody'),
    ownerBookingsEmpty: document.getElementById('ownerBookingsEmpty'),
    ownerMenuGrid: document.getElementById('ownerMenuGrid'),
    ownerSearchCustomer: document.getElementById('ownerSearchCustomer'),
    ownerFilterDate: document.getElementById('ownerFilterDate'),
    ownerFilterStatus: document.getElementById('ownerFilterStatus'),
    menuItemModal: document.getElementById('menuItemModal'),
    menuItemForm: document.getElementById('menuItemForm'),
    menuModalTitle: document.getElementById('menuModalTitle'),
    menuItemId: document.getElementById('menuItemId'),
    menuItemName: document.getElementById('menuItemName'),
    menuItemPrice: document.getElementById('menuItemPrice'),
    menuItemCategory: document.getElementById('menuItemCategory'),
    menuItemImg: document.getElementById('menuItemImg'),
    menuItemDesc: document.getElementById('menuItemDesc'),
    menuItemAvailable: document.getElementById('menuItemAvailable'),
    menuNameError: document.getElementById('menuNameError'),
    menuPriceError: document.getElementById('menuPriceError'),
    menuImgError: document.getElementById('menuImgError'),
    shopSettingsForm: document.getElementById('shopSettingsForm'),
    settingShopName: document.getElementById('settingShopName'),
    settingOpenTime: document.getElementById('settingOpenTime'),
    settingCloseTime: document.getElementById('settingCloseTime'),
    settingMaxGuests: document.getElementById('settingMaxGuests'),
    settingPhone: document.getElementById('settingPhone'),
    settingAddress: document.getElementById('settingAddress'),
    settingNameError: document.getElementById('settingNameError'),
    shopLogoText: document.getElementById('shopLogoText'),
    pageTitle: document.getElementById('pageTitle')
  },

  // 1. Render Thống Kê & 5 đơn gần nhất (Tab Tổng quan)
  renderOverview(stats, activeMenuItemsCount) {
    const { statTodayBookings, statPendingBookings, statTodayGuests, statActiveMenuItems, ownerPendingBadge, recentBookingsQuickList } = this.elements;

    if (statTodayBookings) statTodayBookings.textContent = stats.todayBookingsCount;
    if (statPendingBookings) statPendingBookings.textContent = stats.pendingBookingsCount;
    if (statTodayGuests) statTodayGuests.textContent = stats.todayGuestsCount;
    if (statActiveMenuItems) statActiveMenuItems.textContent = activeMenuItemsCount;

    if (ownerPendingBadge) {
      if (stats.pendingBookingsCount > 0) {
        ownerPendingBadge.textContent = stats.pendingBookingsCount;
        ownerPendingBadge.style.display = 'inline-block';
      } else {
        ownerPendingBadge.style.display = 'none';
      }
    }

    if (recentBookingsQuickList) {
      if (!stats.recentBookings || stats.recentBookings.length === 0) {
        recentBookingsQuickList.innerHTML = `<p style="color: var(--text-muted); font-style: italic; padding: 1rem 0;">Chưa có lượt đặt bàn nào.</p>`;
        return;
      }

      recentBookingsQuickList.innerHTML = stats.recentBookings.map(item => `
        <div class="quick-booking-row">
          <div>
            <strong>${escapeHtml(item.fullName)}</strong> (${escapeHtml(item.guests)} người)
            <div style="font-size: 0.82rem; color: var(--text-muted);">
              ${escapeHtml(item.bookTime)} ngày ${escapeHtml(formatDateVN(item.bookDate))} • ${escapeHtml(item.branchName || item.area)}
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            ${renderStatusBadge(item.status)}
            ${item.status === 'pending' ? `
              <button class="btn btn-sm btn-action-confirm" data-action="confirm-booking" data-id="${escapeHtml(item.id)}">Xác nhận</button>
            ` : ''}
          </div>
        </div>
      `).join('');
    }
  },

  // 2. Render Bảng danh sách đặt bàn (Tab Đặt bàn)
  renderBookingsTable(bookings) {
    const { ownerBookingsTbody, ownerBookingsEmpty } = this.elements;
    if (!ownerBookingsTbody) return;

    if (!bookings || bookings.length === 0) {
      ownerBookingsTbody.innerHTML = '';
      if (ownerBookingsEmpty) ownerBookingsEmpty.style.display = 'block';
      return;
    }

    if (ownerBookingsEmpty) ownerBookingsEmpty.style.display = 'none';

    ownerBookingsTbody.innerHTML = bookings.map(item => `
      <tr>
        <td data-label="Khách hàng"><strong>${escapeHtml(item.fullName)}</strong><br>${escapeHtml(item.phone || '')}<br>${escapeHtml(item.code || '')}</td>
        <td data-label="Email">${escapeHtml(item.email)}</td>
        <td data-label="Ngày đến">${escapeHtml(formatDateVN(item.bookDate))}</td>
        <td data-label="Giờ đến">${escapeHtml(item.bookTime)}</td>
        <td data-label="Số khách">${escapeHtml(item.guests)} người</td>
        <td data-label="Khu vực">${escapeHtml(item.branchName || item.area)}</td>
        <td data-label="Ghi chú" style="max-width: 180px; font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(item.notes || '-')}
          ${Array.isArray(item.preOrders) && item.preOrders.length ? `<br><strong>Món đặt trước:</strong><br>${item.preOrders.map(order => `${escapeHtml(order.item.name)}${order.toppings.length ? ' (' + order.toppings.map(topping => escapeHtml(topping.name)).join(', ') + ')' : ''} - ${escapeHtml(formatCurrency(order.totalPrice))}`).join('<br>')}` : ''}
        </td>
        <td data-label="Trạng thái">${renderStatusBadge(item.status)}</td>
        <td data-label="Thao tác">
          <div class="table-actions">
            ${item.status === 'pending' ? `
              <button class="btn btn-sm btn-action-confirm" data-action="confirm-booking" data-id="${escapeHtml(item.id)}" title="Xác nhận đặt bàn">Xác nhận</button>
            ` : ''}
            ${item.status !== 'cancelled' ? `
              <button class="btn btn-sm btn-action-cancel" data-action="cancel-booking" data-id="${escapeHtml(item.id)}" title="Hủy lượt đặt">Hủy</button>
            ` : ''}
            <button class="btn-action-delete" data-action="delete-booking" data-id="${escapeHtml(item.id)}" title="Xóa vĩnh viễn" aria-label="Xóa lượt đặt">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  // 3. Render lưới quản lý thực đơn (Tab Quản lý Menu)
  renderMenuGrid(menuData) {
    const { ownerMenuGrid } = this.elements;
    if (!ownerMenuGrid) return;

    if (!menuData || menuData.length === 0) {
      ownerMenuGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem 0;">Menu hiện đang trống. Hãy nhấn nút "+ Thêm Món Mới" để bắt đầu!</p>`;
      return;
    }

    const categoryMap = { coffee: 'Cà Phê', tea: 'Trà Trái Cây', cake: 'Bánh Ngọt' };

    ownerMenuGrid.innerHTML = menuData.map(item => `
      <div class="owner-menu-item">
        <div class="owner-menu-header">
          <div style="flex: 1; min-width: 0;">
            <div class="owner-menu-title">${escapeHtml(item.name)}</div>
            <div class="owner-menu-price">${escapeHtml(formatCurrency(item.price))} • ${escapeHtml(categoryMap[item.category] || 'Món')}</div>
          </div>
          <div style="display: flex; gap: 0.35rem; align-items: center;">
            <button class="btn-action-edit" data-action="edit-menu" data-id="${escapeHtml(item.id)}" title="Sửa món">✏️</button>
            <button class="btn-action-delete" data-action="delete-menu" data-id="${escapeHtml(item.id)}" title="Xóa món">🗑️</button>
          </div>
        </div>
        <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.6rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${escapeHtml(item.desc || 'Chưa có mô tả')}
        </div>
        <div class="owner-menu-actions">
          <button 
            class="btn btn-sm ${item.available !== false ? 'btn-available' : 'btn-unavailable'}" 
            data-action="toggle-menu" data-id="${escapeHtml(item.id)}"
          >
            ${item.available !== false ? '✓ Đang mở bán' : '✕ Đang hết hàng'}
          </button>
        </div>
      </div>
    `).join('');
  },

  // 4. Điền dữ liệu cài đặt vào Form
  renderSettingsForm(settings) {
    const { settingShopName, settingOpenTime, settingCloseTime, settingMaxGuests, settingPhone, settingAddress, shopLogoText, pageTitle } = this.elements;

    if (settingShopName) settingShopName.value = settings.name || '';
    if (settingOpenTime) settingOpenTime.value = settings.openTime || '08:00';
    if (settingCloseTime) settingCloseTime.value = settings.closeTime || '22:30';
    if (settingMaxGuests) settingMaxGuests.value = settings.maxGuests || 20;
    if (settingPhone) settingPhone.value = settings.phone || '';
    if (settingAddress) settingAddress.value = settings.address || '';

    if (shopLogoText) shopLogoText.textContent = settings.name;
    if (pageTitle) pageTitle.textContent = `Bàn Quản Trị | ${settings.name}`;
    document.querySelectorAll('.dynamic-shop-name').forEach(el => el.textContent = settings.name);
  },

  // 5. Mở modal thêm/sửa món
  openMenuModal(item = null) {
    const { menuItemModal, menuModalTitle, menuItemId, menuItemName, menuItemPrice, menuItemCategory, menuItemImg, menuItemDesc, menuItemAvailable, menuNameError, menuPriceError, menuImgError } = this.elements;

    if (menuNameError) menuNameError.textContent = '';
    if (menuPriceError) menuPriceError.textContent = '';
    if (menuImgError) menuImgError.textContent = '';

    if (item) {
      if (menuModalTitle) menuModalTitle.textContent = 'Chỉnh Sửa Món';
      if (menuItemId) menuItemId.value = item.id;
      if (menuItemName) menuItemName.value = item.name;
      if (menuItemPrice) menuItemPrice.value = item.price;
      if (menuItemCategory) menuItemCategory.value = item.category;
      if (menuItemImg) menuItemImg.value = item.img || '';
      if (menuItemDesc) menuItemDesc.value = item.desc || '';
      if (menuItemAvailable) menuItemAvailable.checked = item.available !== false;
    } else {
      if (menuModalTitle) menuModalTitle.textContent = 'Thêm Món Mới';
      if (menuItemId) menuItemId.value = '';
      if (this.elements.menuItemForm) this.elements.menuItemForm.reset();
      if (menuItemAvailable) menuItemAvailable.checked = true;
    }

    if (menuItemModal) {
      menuItemModal.classList.add('active');
      setTimeout(() => menuItemName && menuItemName.focus(), 100);
    }
  },

  closeMenuModal() {
    const { menuItemModal } = this.elements;
    if (menuItemModal) menuItemModal.classList.remove('active');
  },

  getMenuFormData() {
    return {
      id: this.elements.menuItemId ? this.elements.menuItemId.value : '',
      name: this.elements.menuItemName ? this.elements.menuItemName.value.trim() : '',
      price: this.elements.menuItemPrice ? parseFloat(this.elements.menuItemPrice.value) : 0,
      category: this.elements.menuItemCategory ? this.elements.menuItemCategory.value : 'coffee',
      img: this.elements.menuItemImg ? this.elements.menuItemImg.value.trim() : '',
      desc: this.elements.menuItemDesc ? this.elements.menuItemDesc.value.trim() : '',
      available: this.elements.menuItemAvailable ? this.elements.menuItemAvailable.checked : true
    };
  },

  getSettingsFormData() {
    return {
      name: this.elements.settingShopName ? this.elements.settingShopName.value.trim() : '',
      openTime: this.elements.settingOpenTime ? this.elements.settingOpenTime.value : '08:00',
      closeTime: this.elements.settingCloseTime ? this.elements.settingCloseTime.value : '22:30',
      maxGuests: this.elements.settingMaxGuests ? parseInt(this.elements.settingMaxGuests.value, 10) : 20,
      phone: this.elements.settingPhone ? this.elements.settingPhone.value.trim() : '',
      address: this.elements.settingAddress ? this.elements.settingAddress.value.trim() : ''
    };
  }
};

