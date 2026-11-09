/**
 * ============================================================
 * VIEW: GIAO DIỆN KHÁCH HÀNG (CUSTOMER VIEW)
 * Quản lý hiển thị DOM, bắt sự kiện và render giao diện.
 * Không truy cập trực tiếp Storage hay Database.
 * ============================================================
 */

const CustomerView = {
  // Tập hợp các phần tử DOM quan trọng
  elements: {
    // Header & Điều hướng
    shopLogoText: document.getElementById('shopLogoText'),
    pageTitle: document.getElementById('pageTitle'),
    navHeaderMenu: document.getElementById('navHeaderMenu'),
    navFindBranchLink: document.getElementById('navFindBranchLink'),
    subNavButtons: document.querySelectorAll('.sub-nav-btn'),
    pageViewSections: document.querySelectorAll('.page-view-section'),

    // Nhóm tài khoản trên Header
    authGuestGroup: document.getElementById('authGuestGroup'),
    authUserGroup: document.getElementById('authUserGroup'),
    userAvatarBtn: document.getElementById('userAvatarBtn'),
    userAvatarLetter: document.getElementById('userAvatarLetter'),
    headerUserName: document.getElementById('headerUserName'),
    userDropdownPanel: document.getElementById('userDropdownPanel'),
    userMenuFavorites: document.getElementById('userMenuFavorites'),
    userMenuBookings: document.getElementById('userMenuBookings'),

    // Thanh cố định ở đáy màn hình (Bottom Fixed Bar)
    bottomBranchSelect: document.getElementById('bottomBranchSelect'),
    bottomReserveBtn: document.getElementById('bottomReserveBtn'),

    // Modals
    loginModal: document.getElementById('loginModal'),
    registerModal: document.getElementById('registerModal'),
    itemDetailModal: document.getElementById('itemDetailModal'),
    lookupModal: document.getElementById('lookupModal'),
    successModal: document.getElementById('successModal'),
    toastNotification: document.getElementById('toastNotification'),

    // Form đặt bàn
    resBranch: document.getElementById('resBranch'),
    resDate: document.getElementById('resDate'),
    resTimeSlotsGrid: document.getElementById('resTimeSlotsGrid'),
    resTimeSelected: document.getElementById('resTimeSelected'),
    guestMinusBtn: document.getElementById('guestMinusBtn'),
    guestPlusBtn: document.getElementById('guestPlusBtn'),
    guestCountDisplay: document.getElementById('guestCountDisplay'),
    resPartySize: document.getElementById('resPartySize'),
    resName: document.getElementById('resName'),
    resPhone: document.getElementById('resPhone'),
    resEmail: document.getElementById('resEmail'),
    resNote: document.getElementById('resNote'),
    reservationForm: document.getElementById('reservationForm'),

    // Menu & Featured Containers
    menuSidebarNav: document.getElementById('sidebarCategoryNav'),
    menuCategoriesContainer: document.getElementById('menuCategoriesContainer'),
    featuredGrid: document.getElementById('featuredGrid'),
    bookingsListContainer: document.getElementById('bookingsListContainer'),
    favoritesGrid: document.getElementById('favoritesGrid'),
    branchesList: document.getElementById('branchesList')
  },

  // 1. Chuyển đổi qua lại giữa các view (Menu, Featured, Đã đặt, Yêu thích, Chi nhánh, Đặt bàn)
  switchView(targetViewId) {
    // Ẩn tất cả các view section và hiện section mục tiêu
    this.elements.pageViewSections.forEach(section => {
      if (section.id === targetViewId) {
        section.classList.add('active-view');
      } else {
        section.classList.remove('active-view');
      }
    });

    // Cập nhật gạch chân đậm trên thanh phụ sub-nav
    this.elements.subNavButtons.forEach(btn => {
      if (btn.dataset.target === targetViewId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Cập nhật gạch chân link Menu trên Header
    if (this.elements.navHeaderMenu) {
      if (targetViewId === 'viewMenu') {
        this.elements.navHeaderMenu.classList.add('active');
      } else {
        this.elements.navHeaderMenu.classList.remove('active');
      }
    }

    // Cuộn mượt lên đầu trang khi chuyển view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // 2. Render danh sách chi nhánh vào Dropdown ở thanh đáy & form đặt bàn
  renderBranchesDropdown(branches, selectedBranchId) {
    const { bottomBranchSelect, resBranch } = this.elements;
    if (!branches || branches.length === 0) return;

    const optionsHtml = branches.map(b => {
      const isSelected = b.id === selectedBranchId ? 'selected' : '';
      return `<option value="${escapeHtml(b.id)}" ${isSelected}>${escapeHtml(b.name)}</option>`;
    }).join('');

    if (bottomBranchSelect) bottomBranchSelect.innerHTML = optionsHtml;
    if (resBranch) resBranch.innerHTML = optionsHtml;
  },

  // 3. Render trạng thái Đăng nhập / Đăng ký trên Header
  renderAuthHeader(currentUser) {
    const { authGuestGroup, authUserGroup, headerUserName, userAvatarLetter } = this.elements;

    if (currentUser) {
      if (authGuestGroup) authGuestGroup.style.display = 'none';
      if (authUserGroup) authUserGroup.style.display = 'block';

      const displayName = currentUser.fullName || currentUser.username || 'Khách hàng';
      if (headerUserName) headerUserName.textContent = displayName;
      if (userAvatarLetter) userAvatarLetter.textContent = displayName.charAt(0).toUpperCase();
    } else {
      if (authGuestGroup) authGuestGroup.style.display = 'flex';
      if (authUserGroup) authUserGroup.style.display = 'none';
    }
  },

  // 4. Bật / Tắt Dropdown Menu của Avatar người dùng
  toggleUserDropdown(show) {
    const { userDropdownPanel, userAvatarBtn } = this.elements;
    if (!userDropdownPanel) return;

    const shouldShow = show !== undefined ? show : !userDropdownPanel.classList.contains('show');
    if (shouldShow) {
      userDropdownPanel.classList.add('show');
      if (userAvatarBtn) userAvatarBtn.setAttribute('aria-expanded', 'true');
    } else {
      userDropdownPanel.classList.remove('show');
      if (userAvatarBtn) userAvatarBtn.setAttribute('aria-expanded', 'false');
    }
  },

  // ============================================================
  // CÁC HÀM XỬ LÝ CHO TRANG MENU (MỤC 3)
  // ============================================================

  // Render Sidebar bên trái: Nhóm cha (đậm) và các mục con (nhỏ, xám)
  renderMenuSidebar(categories) {
    const { menuSidebarNav } = this.elements;
    if (!menuSidebarNav || !categories) return;

    menuSidebarNav.innerHTML = categories.map(group => `
      <div class="sidebar-category-group">
        <div class="sidebar-parent-name">${escapeHtml(group.name)}</div>
        <div class="sidebar-sub-list">
          ${group.subcategories.map((sub, index) => `
            <button 
              type="button" 
              class="sidebar-sub-item ${group.id === 'group_coffee' && index === 0 ? 'active' : ''}" 
              data-target-section="section_${escapeHtml(sub.id)}"
            >
              ${escapeHtml(sub.name)}
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');
  },

  // Render các nhóm danh mục và lưới món bên phải
  renderMenuSections(categories, menuItems) {
    const { menuCategoriesContainer } = this.elements;
    if (!menuCategoriesContainer || !categories) return;

    // Chuẩn bị danh sách id yêu thích của người dùng hiện tại
    const favoriteIds = FavoriteModel.getFavoriteIds();
    menuItems = menuItems.filter(item => {
      if (item && item.id && item.name && item.price != null && item.subCategory && item.parentCategory) return true;
      console.warn('Bỏ qua món thiếu trường:', item?.name || item?.id || '(không rõ tên)');
      return false;
    });

    menuCategoriesContainer.innerHTML = categories.map(group => {
      return group.subcategories.map(subCat => {
        // Lọc các món thuộc danh mục con này
        const items = menuItems.filter(m => m.subCategory === subCat.id);
        if (items.length === 0) return '';

        return `
          <section class="menu-group-section" id="section_${escapeHtml(subCat.id)}" data-subcategory="${escapeHtml(subCat.id)}">
            <div class="menu-group-header">
              <h2 class="menu-group-title">${escapeHtml(subCat.name)}</h2>
              <div class="menu-group-divider"></div>
            </div>

            <div class="menu-items-grid">
              ${items.map(item => {
                const isFav = favoriteIds.includes(item.id);
                return `
                  <article class="menu-item-row-card" data-item-id="${escapeHtml(item.id)}">
                    <!-- Ảnh tròn khoảng 112px trên nền xanh đậm -->
                    <div class="menu-circle-wrapper">
                      <img 
                        src="${escapeHtml(item.img)}" 
                        alt="${escapeHtml(item.name)}" 
                        class="menu-circle-img"
                        loading="lazy"
                        onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500&q=80'"
                      >
                    </div>

                    <!-- Thông tin nằm bên phải ảnh -->
                    <div class="menu-item-details">
                      <h3 class="menu-item-title">${escapeHtml(item.name)}</h3>
                      <span class="menu-item-cost">${escapeHtml(formatCurrency(item.price))}</span>
                      <p class="menu-item-brief">${escapeHtml(item.desc || '')}</p>
                    </div>

                    <!-- Nút icon tim yêu thích (SVG đồng nhất, không dùng emoji) -->
                    <button 
                      type="button" 
                      class="btn-card-favorite ${isFav ? 'is-active' : ''}" 
                      data-fav-id="${escapeHtml(item.id)}"
                      aria-label="${isFav ? 'Bỏ khỏi' : 'Thêm vào'} món yêu thích" aria-pressed="${isFav}"
                    >
                      <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                      </svg>
                    </button>
                  </article>
                `;
              }).join('')}
            </div>
          </section>
        `;
      }).join('');
    }).join('');
  },

  // Cập nhật trạng thái hiển thị của nút tim
  updateFavoriteIcon(itemId, isFav) {
    const buttons = document.querySelectorAll(`[data-fav-id="${itemId}"]`);
    buttons.forEach(btn => {
      if (isFav) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });
  },

  // Render nội dung Modal chi tiết món ăn & tùy chọn topping
  renderItemDetailModal(item, toppings) {
    const detailContent = document.getElementById('itemDetailContent');
    if (!detailContent || !item) return;

    detailContent.innerHTML = `
      <div class="item-detail-image-box">
        <img 
          src="${escapeHtml(item.img)}" 
          alt="${escapeHtml(item.name)}" 
          class="item-detail-image"
          onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500&q=80'"
        >
      </div>
      <div class="item-detail-header">
        <h2 class="item-detail-name" id="detailItemName">${escapeHtml(item.name)}</h2>
        <span class="item-detail-price">${escapeHtml(formatCurrency(item.price))}</span>
      </div>
      <p class="item-detail-desc">${escapeHtml(item.desc || 'Hương vị nguyên bản được chế biến từ những nguyên liệu hảo hạng nhất tại Âu - Việt Café.')}</p>

      <div class="detail-toppings-title">Tùy chọn & Thêm Topping:</div>
      <div class="detail-toppings-list">
        ${toppings.map(top => `
          <label class="topping-checkbox-label">
            <div>
              <input type="checkbox" name="detail_topping" value="${escapeHtml(top.id)}" data-price="${escapeHtml(top.price)}" data-name="${escapeHtml(top.name)}">
              <span>${escapeHtml(top.name)}</span>
            </div>
            <span style="font-weight: 600; color: var(--color-primary);">+${escapeHtml(formatCurrency(top.price))}</span>
          </label>
        `).join('')}
      </div>

      <div class="item-detail-actions">
        <button type="button" class="btn btn-primary btn-block" id="addPreorderBtn" data-item-id="${escapeHtml(item.id)}">
          Thêm vào danh sách đặt món trước
        </button>
      </div>
    `;
  },

  // ============================================================
  // CÁC HÀM XỬ LÝ CHO TRANG FEATURED (BƯỚC 3)
  // ============================================================

  /**
   * Render lưới thẻ Featured (Món Nổi Bật)
   * @param {Array} featuredItems - Mảng các món có isFeatured === true, đã sắp theo displayOrder
   */
  renderFeaturedGrid(featuredItems) {
    const { featuredGrid } = this.elements;
    if (!featuredGrid) return;

    // Nếu không có món nổi bật nào, hiện trạng thái trống
    if (!featuredItems || featuredItems.length === 0) {
      featuredGrid.innerHTML = `
        <div class="featured-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <p>Hiện chưa có món nào được gắn nổi bật.<br>Quay lại sau nhé!</p>
        </div>
      `;
      return;
    }

    // Lấy danh sách id yêu thích của người dùng hiện tại
    const favoriteIds = FavoriteModel.getFavoriteIds();

    // Render từng thẻ Featured: Ảnh vuông lớn + Khối nền xanh đậm bên dưới
    featuredGrid.innerHTML = featuredItems.map(item => {
      const isFav = favoriteIds.includes(item.id);
      return `
        <article class="featured-card" data-item-id="${escapeHtml(item.id)}">
          <!-- Ảnh vuông lớn ở trên -->
          <div class="featured-card-img-wrap">
            <img 
              src="${escapeHtml(item.img)}" 
              alt="${escapeHtml(item.name)}" 
              class="featured-card-img"
              loading="lazy"
              onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500&q=80'"
            >
            <!-- Nút tim yêu thích trên góc phải ảnh -->
            <button 
              type="button" 
              class="featured-fav-btn ${isFav ? 'is-active' : ''}" 
              data-fav-id="${escapeHtml(item.id)}"
              aria-label="${isFav ? 'Bỏ khỏi' : 'Thêm vào'} món yêu thích" aria-pressed="${isFav}"
            >
              <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            </button>
          </div>

          <!-- Khối nền xanh đậm bên dưới: Tên, giá, mô tả, nút Xem chi tiết -->
          <div class="featured-card-body">
            <h3 class="featured-card-name">${escapeHtml(item.name)}</h3>
            <span class="featured-card-price">${escapeHtml(formatCurrency(item.price))}</span>
            <p class="featured-card-desc">${escapeHtml(item.desc || 'Hương vị đặc sắc tuyển chọn từ Âu - Việt Café.')}</p>
            <button type="button" class="featured-detail-btn" data-detail-id="${escapeHtml(item.id)}">
              Xem chi tiết
            </button>
          </div>
        </article>
      `;
    }).join('');
  },

  /**
   * Cập nhật trạng thái tim yêu thích trên cả trang Menu và Featured
   * (Ghi đè hàm cũ để hỗ trợ thêm class featured-fav-btn)
   */
  updateAllFavoriteIcons(itemId, isFav) {
    document.querySelectorAll('[data-fav-id]').forEach(btn => {
      if (btn.dataset.favId !== itemId) return;
      btn.classList.toggle('is-active', isFav);
      btn.setAttribute('aria-pressed', String(isFav));
      btn.setAttribute('aria-label', `${isFav ? 'Bỏ khỏi' : 'Thêm vào'} món yêu thích`);
    });
  },

  // Dùng thẻ món và nút tim giống trang thực đơn.
  renderFavorites(items, currentUser) {
    const grid = this.elements.favoritesGrid;
    if (!currentUser) {
      grid.innerHTML = '<div class="favorites-empty"><p>Đăng nhập để lưu và xem các món yêu thích trên trình duyệt này.</p><button type="button" class="btn btn-primary" id="favoritesLoginBtn">Đăng nhập</button></div>';
      return;
    }
    if (!items.length) {
      grid.innerHTML = '<div class="favorites-empty"><p>Bạn chưa có món yêu thích. Hãy khám phá thực đơn và bấm nút tim để lưu món.</p><button type="button" class="btn btn-primary" id="favoritesMenuBtn">Xem thực đơn</button></div>';
      return;
    }
    grid.innerHTML = items.map(item => `
      <article class="menu-item-row-card favorite-item-card" data-item-id="${escapeHtml(item.id)}">
        <div class="menu-circle-wrapper"><img class="menu-circle-img" src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500&q=80'"></div>
        <div class="menu-item-details"><h2 class="menu-item-title">${escapeHtml(item.name)}</h2><span class="menu-item-cost">${escapeHtml(formatCurrency(item.price))}</span><p class="menu-item-brief">${escapeHtml(item.desc || '')}</p><button type="button" class="btn btn-secondary favorite-detail-btn">Xem chi tiết</button></div>
        <button type="button" class="btn-card-favorite is-active" data-fav-id="${escapeHtml(item.id)}" aria-label="Bỏ khỏi món yêu thích" aria-pressed="true"><svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></button>
      </article>
    `).join('');
  },

  // Hiển thị danh sách khớp với bộ lọc và chi nhánh đang chọn.
  renderBranchList(branches, selectedId, isOpen) {
    this.elements.branchesList.innerHTML = branches.length ? branches.map(branch => `
      <article class="branch-card ${branch.id === selectedId ? 'selected' : ''}" data-branch-id="${escapeHtml(branch.id)}">
        <h2>${escapeHtml(branch.name)}</h2>
        <p>${escapeHtml(branch.address)}</p>
        <p>${escapeHtml(branch.openHours || 'Chưa có giờ hoạt động')} · ${isOpen(branch) ? 'Đang mở cửa' : 'Đang đóng cửa'}</p>
        <p>${escapeHtml(branch.phone || '')}</p>
        <button type="button" class="btn btn-secondary branch-select-btn" data-branch-id="${escapeHtml(branch.id)}">Xem trên bản đồ</button>
      </article>
    `).join('') : '<p class="branch-empty">Không tìm thấy chi nhánh phù hợp.</p>';
  },

  // Hiển thị thông tin đặt bàn; dữ liệu nhập đều được mã hóa HTML.
  bookingCard(booking, showCancel = true) {
    const status = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', cancelled: 'Đã hủy' }[booking.status] || 'Không rõ';
    const canCancel = BookingModel.canCancel(booking);
    return `<article class="booking-card">
      <h2>Mã đặt bàn: ${escapeHtml(booking.code || booking.id)}</h2>
      <p>${escapeHtml(booking.branchName || 'Chi nhánh chưa xác định')}</p>
      <p>${escapeHtml(booking.bookTime)} · ${escapeHtml(formatDateVN(booking.bookDate))} · ${escapeHtml(booking.guests)} khách</p>
      <p>Trạng thái: <strong>${escapeHtml(status)}</strong></p>
      ${Array.isArray(booking.preOrders) && booking.preOrders.length ? `<p>Món đặt trước: ${booking.preOrders.map(order => `${escapeHtml(order.item.name)}${order.toppings.length ? ' (' + order.toppings.map(topping => escapeHtml(topping.name)).join(', ') + ')' : ''}`).join('; ')}</p>` : ''}
      ${showCancel && canCancel ? `<button type="button" class="btn btn-secondary cancel-booking-btn" data-booking-id="${escapeHtml(booking.id)}">Hủy đặt bàn</button>` : ''}
    </article>`;
  },

  // 5. Hiển thị thông báo Toast nhanh
  showToast(message) {
    const { toastNotification } = this.elements;
    if (!toastNotification) return;

    toastNotification.textContent = message;
    toastNotification.classList.add('show');
    setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 3000);
  },

  // 6. Hiển thị / Đóng Modal
  openModal(modalElement) {
    if (modalElement) modalElement.classList.add('active');
  },

  closeModal(modalElement) {
    if (modalElement) modalElement.classList.remove('active');
  }
};
