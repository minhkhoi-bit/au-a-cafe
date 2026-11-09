/**
 * ============================================================
 * CONTROLLER: ĐIỀU PHỐI KHÁCH HÀNG (CUSTOMER CONTROLLER)
 * Nhạc trưởng kết nối CustomerView và các Models:
 * BranchModel, MenuModel, BookingModel, UserModel, ShopSettingsModel
 * ============================================================
 */

const CustomerController = {
  // Lưu danh sách món đặt trước khi đặt bàn
  preOrders: [],

  init() {
    this.loadAuth();
    this.loadBranches();
    this.loadMenu();
    this.loadFeatured();       // Bước 3: Tải trang Món Nổi Bật
    this.setupLayoutEvents();
    this.setupMenuEvents();
    this.setupFeaturedEvents(); // Bước 3: Gắn sự kiện trang Featured
    this.setupBranchEvents();
    this.setupAuthModals();
    this.setupReservationEvents();
    this.setupFavoritesEvents();
    this.loadFavorites();
  },

  // 1. Tải và hiển thị thông tin xác thực
  loadAuth() {
    const currentUser = UserModel.getCurrentUser();
    const userId = currentUser ? currentUser.id : null;
    if (this.currentUserId !== userId) {
      this.lookupBookingId = null;
      const lookupResult = document.getElementById('lookupResultBox');
      if (lookupResult) lookupResult.innerHTML = '';
      this.currentUserId = userId;
    }
    CustomerView.renderAuthHeader(currentUser);
    if (this.branchEventsReady) {
      this.loadMenu();
      this.loadFeatured();
      this.loadBookings();
      this.loadFavorites();
    }
  },

  // 2. Tải danh sách chi nhánh và chi nhánh đang chọn
  loadBranches() {
    const branches = BranchModel.getAll();
    const selectedBranch = BranchModel.getSelectedBranch();
    const selectedId = selectedBranch ? selectedBranch.id : (branches[0] ? branches[0].id : '');
    CustomerView.renderBranchesDropdown(branches, selectedId);
    if (this.branchEventsReady) this.renderBranches();
  },

  // 3. Tải và hiển thị thực đơn theo cấu trúc hai cột
  loadMenu() {
    const categories = MenuModel.getCategories();
    const menuItems = MenuModel.getAll();
    CustomerView.renderMenuSidebar(categories);
    CustomerView.renderMenuSections(categories, menuItems);
    this.setupScrollSpy();
  },

  // 3. Đăng ký các sự kiện Khung chung (_Layout)
  setupLayoutEvents() {
    // Chuyển view khi bấm nút trên thanh phụ (Menu | Featured | Đã đặt | Yêu thích)
    CustomerView.elements.subNavButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetView = e.currentTarget.dataset.target;
        if (targetView === 'viewBookings') this.loadBookings();
        if (targetView === 'viewFavorites') this.loadFavorites();
        CustomerView.switchView(targetView);
      });
    });

    // Bấm link Menu trên Header
    if (CustomerView.elements.navHeaderMenu) {
      CustomerView.elements.navHeaderMenu.addEventListener('click', (e) => {
        e.preventDefault();
        CustomerView.switchView('viewMenu');
      });
    }

    // Bấm link "Tìm chi nhánh" trên Header
    if (CustomerView.elements.navFindBranchLink) {
      CustomerView.elements.navFindBranchLink.addEventListener('click', (e) => {
        e.preventDefault();
        CustomerView.switchView('viewBranches');
        if (typeof this.initBranchMap === 'function') {
          this.initBranchMap();
        }
      });
    }

    // Bấm nút "Đặt bàn" ở thanh cố định đáy màn hình
    if (CustomerView.elements.bottomReserveBtn) {
      CustomerView.elements.bottomReserveBtn.addEventListener('click', () => {
        CustomerView.switchView('viewBookingForm');
        // Đồng bộ chi nhánh đang chọn vào form đặt bàn
        const selectedBranch = BranchModel.getSelectedBranch();
        if (selectedBranch && CustomerView.elements.resBranch) {
          CustomerView.elements.resBranch.value = selectedBranch.id;
        }
      });
    }

    // Khi người dùng đổi chi nhánh ở dropdown đáy màn hình
    if (CustomerView.elements.bottomBranchSelect) {
      CustomerView.elements.bottomBranchSelect.addEventListener('change', (e) => {
        const branchId = e.target.value;
        BranchModel.setSelectedBranch(branchId);
        const branch = BranchModel.getById(branchId);
        if (branch) {
          CustomerView.showToast(`Đã chuyển sang chi nhánh: ${branch.name}`);
        }
        // Đồng bộ dropdown trong form đặt bàn nếu có
        if (CustomerView.elements.resBranch) {
          CustomerView.elements.resBranch.value = branchId;
        }
        if (this.branchEventsReady) this.renderBranches();
      });
    }

    // Bật / tắt dropdown Avatar người dùng
    if (CustomerView.elements.userAvatarBtn) {
      CustomerView.elements.userAvatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        CustomerView.toggleUserDropdown();
      });
    }

    // Đóng dropdown khi click bên ngoài
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#authUserGroup')) {
        CustomerView.toggleUserDropdown(false);
      }
    });

    // Sự kiện menu Yêu thích trong dropdown
    if (CustomerView.elements.userMenuFavorites) {
      CustomerView.elements.userMenuFavorites.addEventListener('click', () => {
        CustomerView.toggleUserDropdown(false);
        this.loadFavorites();
        CustomerView.switchView('viewFavorites');
      });
    }

    // Sự kiện menu Đã đặt trong dropdown
    if (CustomerView.elements.userMenuBookings) {
      CustomerView.elements.userMenuBookings.addEventListener('click', () => {
        CustomerView.toggleUserDropdown(false);
        this.loadBookings();
        CustomerView.switchView('viewBookings');
      });
    }

    // Sự kiện Đăng xuất
    const navLogoutBtn = document.getElementById('navLogoutBtn');
    if (navLogoutBtn) {
      navLogoutBtn.addEventListener('click', async () => {
        await UserModel.logout();
        CustomerView.toggleUserDropdown(false);
        this.loadAuth();
        CustomerView.showToast('Đã đăng xuất tài khoản thành công!');
        CustomerView.switchView('viewMenu');
      });
    }
  },

  // 4. Đăng ký các sự kiện tương tác Trang Menu
  setupMenuEvents() {
    const { menuSidebarNav, menuCategoriesContainer, itemDetailModal } = CustomerView.elements;

    // Bấm vào mục con trên Sidebar -> Cuộn mượt tới nhóm tương ứng và tô sáng
    if (menuSidebarNav) {
      menuSidebarNav.addEventListener('click', (e) => {
        const btn = e.target.closest('.sidebar-sub-item');
        if (!btn) return;

        const targetSectionId = btn.dataset.targetSection;
        const targetSection = document.getElementById(targetSectionId);
        if (targetSection) {
          // Bỏ active cũ, gán active mới
          document.querySelectorAll('.sidebar-sub-item').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    // Sự kiện click trên thẻ món ăn bên phải
    if (menuCategoriesContainer) {
      menuCategoriesContainer.addEventListener('click', (e) => {
        // A. Xử lý bấm tim yêu thích
        const favBtn = e.target.closest('.btn-card-favorite');
        if (favBtn) {
          e.stopPropagation();
          const itemId = favBtn.dataset.favId;
          const user = UserModel.getCurrentUser();

          // Chưa đăng nhập -> Hiện popup mời đăng nhập kèm toast
          if (!user) {
            CustomerView.openModal(CustomerView.elements.loginModal);
            CustomerView.showToast('Vui lòng đăng nhập để lưu món vào danh sách Yêu thích!');
            return;
          }

          // Đã đăng nhập -> Đổi trạng thái tim
          const result = FavoriteModel.toggle(itemId);
          if (result.success) {
            // Đồng bộ icon tim trên cả trang Menu và Featured
            CustomerView.updateAllFavoriteIcons(itemId, result.isAdded);
            CustomerView.showToast(result.isAdded ? 'Đã thêm vào món yêu thích ❤️' : 'Đã bỏ yêu thích món');
            this.loadFavorites();
          } else CustomerView.showToast(result.message || 'Không thể lưu món yêu thích.');
          return;
        }

        // B. Xử lý bấm vào thẻ món để xem chi tiết
        const card = e.target.closest('.menu-item-row-card');
        if (card) {
          const itemId = card.dataset.itemId;
          const item = MenuModel.getById(itemId);
          if (item) {
            CustomerView.renderItemDetailModal(item, MenuModel.getToppings());
            CustomerView.openModal(itemDetailModal);
          }
        }
      });
    }

    // Đóng Modal chi tiết món
    const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
    if (closeDetailModalBtn) {
      closeDetailModalBtn.addEventListener('click', () => {
        CustomerView.closeModal(itemDetailModal);
      });
    }

    // Nút chọn món dùng kèm từ form đặt bàn -> Chuyển sang Menu
    const openPreorderModalBtn = document.getElementById('openPreorderModalBtn');
    if (openPreorderModalBtn) {
      openPreorderModalBtn.addEventListener('click', () => {
        this.returnToReservation = true;
        CustomerView.switchView('viewMenu');
        CustomerView.showToast('Bạn hãy bấm vào món yêu thích trong Menu để chọn món đặt trước nhé!');
      });
    }

    // Thêm món từ Modal chi tiết vào danh sách đặt món trước
    if (itemDetailModal) {
      itemDetailModal.addEventListener('click', (e) => {
        const addBtn = e.target.closest('#addPreorderBtn');
        if (!addBtn) return;

        const itemId = addBtn.dataset.itemId;
        const item = MenuModel.getById(itemId);
        if (!item) return;
        if (item.available === false) {
          CustomerView.showToast('Món này hiện chưa mở bán.');
          return;
        }

        // Lấy danh sách topping đã tích chọn
        const checkedToppings = [];
        itemDetailModal.querySelectorAll('input[name="detail_topping"]:checked').forEach(cb => {
          checkedToppings.push({
            id: cb.value,
            name: cb.dataset.name,
            price: Number(cb.dataset.price) || 0
          });
        });

        // Thêm vào mảng đặt món trước
        this.preOrders.push({
          item: item,
          toppings: checkedToppings,
          totalPrice: item.price + checkedToppings.reduce((sum, t) => sum + t.price, 0)
        });

        CustomerView.closeModal(itemDetailModal);
        CustomerView.showToast(`Đã thêm "${item.name}" vào danh sách đặt trước!`);
        this.renderPreorderSummary();
        if (this.returnToReservation) {
          this.returnToReservation = false;
          CustomerView.switchView('viewBookingForm');
        }
      });
    }
  },

  // ============================================================
  // BƯỚC 3: TRANG FEATURED (MÓN NỔI BẬT)
  // ============================================================

  /**
   * Tải dữ liệu và render lưới Featured
   * Lấy danh sách món có isFeatured === true, sắp xếp theo displayOrder tăng dần
   */
  loadFeatured() {
    const featuredItems = MenuModel.getFeatured();
    CustomerView.renderFeaturedGrid(featuredItems);
  },

  // Xác định giờ mở cửa theo múi giờ Việt Nam, kể cả qua nửa đêm.
  isBranchOpen(branch) {
    if (branch.isOpen === false) return false;
    const hours = (branch.openHours || '').match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
    if (!hours) return false;
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date()).split(':').map(Number);
    const now = parts[0] * 60 + parts[1];
    const start = Number(hours[1]) * 60 + Number(hours[2]);
    const end = Number(hours[3]) * 60 + Number(hours[4]);
    return start <= end ? now >= start && now < end : now >= start || now < end;
  },

  setupBranchEvents() {
    const search = document.getElementById('branchSearchInput');
    const district = document.getElementById('branchDistrict');
    const chips = document.querySelectorAll('.branch-filter-chips .chip');
    this.branchFilter = 'all';
    this.branchEventsReady = true;
    search.addEventListener('input', () => this.renderBranches());
    district.addEventListener('change', () => this.renderBranches());
    chips.forEach(chip => chip.addEventListener('click', () => {
      this.branchFilter = chip.dataset.filter;
      chips.forEach(button => {
        const active = button === chip;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      this.renderBranches();
    }));
    CustomerView.elements.branchesList.addEventListener('click', event => {
      const button = event.target.closest('.branch-select-btn');
      if (button) this.selectBranchOnMap(button.dataset.branchId);
    });
    this.renderBranches();
  },

  renderBranches() {
    const all = BranchModel.getAll();
    const district = document.getElementById('branchDistrict');
    const previousDistrict = district.value;
    const districts = [...new Set(all.map(branch => branch.district).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));
    district.innerHTML = '<option value="">Tất cả quận / huyện</option>' + districts.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
    district.value = districts.includes(previousDistrict) ? previousDistrict : '';
    const normalize = value => (value || '').toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
    const query = normalize(document.getElementById('branchSearchInput').value.trim());
    this.visibleBranches = all.filter(branch =>
      normalize(`${branch.name} ${branch.address} ${branch.district}`).includes(query) &&
      (!district.value || branch.district === district.value) &&
      (this.branchFilter !== 'open' || this.isBranchOpen(branch)) &&
      (this.branchFilter !== 'booking' || branch.hasBooking === true)
    );
    const selected = BranchModel.getSelectedBranch();
    CustomerView.renderBranchList(this.visibleBranches, selected && selected.id, branch => this.isBranchOpen(branch));
    if (this.branchMap) this.updateBranchMarkers();
  },

  initBranchMap() {
    const error = document.getElementById('branchMapError');
    if (typeof L === 'undefined') {
      error.hidden = false;
      return;
    }
    error.hidden = true;
    if (!this.branchMap) {
      // Leaflet hiển thị bản đồ OpenStreetMap và các điểm chi nhánh.
      this.branchMap = L.map('branchMap').setView([10.7719, 106.6575], 12);
      const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(this.branchMap);
      tiles.on('tileerror', () => { error.hidden = false; });
      tiles.on('load', () => { error.hidden = true; });
      this.updateBranchMarkers();
    }
    this.branchMap.invalidateSize();
  },

  updateBranchMarkers() {
    if (this.branchMarkers) this.branchMarkers.forEach(marker => marker.remove());
    this.branchMarkers = new Map();
    this.visibleBranches.forEach(branch => {
      if (!Number.isFinite(Number(branch.lat)) || !Number.isFinite(Number(branch.lng)) || branch.lat == null || branch.lng == null) return;
      const marker = L.marker([Number(branch.lat), Number(branch.lng)]).addTo(this.branchMap);
      marker.bindPopup(`<strong>${escapeHtml(branch.name)}</strong><br>${escapeHtml(branch.address)}`);
      marker.on('click', () => this.selectBranchOnMap(branch.id));
      this.branchMarkers.set(branch.id, marker);
    });
  },

  selectBranchOnMap(id) {
    const branch = BranchModel.getById(id);
    if (!branch) return;
    BranchModel.setSelectedBranch(id);
    CustomerView.renderBranchesDropdown(BranchModel.getAll(), id);
    CustomerView.renderBranchList(this.visibleBranches, id, item => this.isBranchOpen(item));
    const card = [...CustomerView.elements.branchesList.querySelectorAll('.branch-card')].find(item => item.dataset.branchId === id);
    if (card) card.scrollIntoView({ block: 'nearest' });
    const marker = this.branchMarkers && this.branchMarkers.get(id);
    if (marker) {
      this.branchMap.setView(marker.getLatLng(), 15);
      marker.openPopup();
    }
  },

  /**
   * Đăng ký các sự kiện tương tác trên trang Featured:
   * - Bấm nút tim yêu thích
   * - Bấm nút "Xem chi tiết" hoặc bấm vào thẻ → Mở modal chi tiết
   */
  setupFeaturedEvents() {
    const { featuredGrid, itemDetailModal } = CustomerView.elements;
    if (!featuredGrid) return;

    featuredGrid.addEventListener('click', (e) => {
      // A. Xử lý bấm nút tim yêu thích trên thẻ Featured
      const favBtn = e.target.closest('.featured-fav-btn');
      if (favBtn) {
        e.stopPropagation();
        const itemId = favBtn.dataset.favId;
        const user = UserModel.getCurrentUser();

        // Chưa đăng nhập → Hiện modal mời đăng nhập
        if (!user) {
          CustomerView.openModal(CustomerView.elements.loginModal);
          CustomerView.showToast('Vui lòng đăng nhập để lưu món vào danh sách Yêu thích!');
          return;
        }

        // Đã đăng nhập → Đổi trạng thái tim
        const result = FavoriteModel.toggle(itemId);
        if (result.success) {
          // Đồng bộ icon tim trên cả trang Menu và Featured
          CustomerView.updateAllFavoriteIcons(itemId, result.isAdded);
          CustomerView.showToast(result.isAdded ? 'Đã thêm vào món yêu thích ❤️' : 'Đã bỏ yêu thích món');
          this.loadFavorites();
        } else CustomerView.showToast(result.message || 'Không thể lưu món yêu thích.');
        return;
      }

      // B. Xử lý bấm nút "Xem chi tiết"
      const detailBtn = e.target.closest('.featured-detail-btn');
      if (detailBtn) {
        e.stopPropagation();
        const itemId = detailBtn.dataset.detailId;
        const item = MenuModel.getById(itemId);
        if (item) {
          CustomerView.renderItemDetailModal(item, MenuModel.getToppings());
          CustomerView.openModal(itemDetailModal);
        }
        return;
      }

      // C. Xử lý bấm vào thẻ Featured (không phải nút) → Mở modal chi tiết
      const card = e.target.closest('.featured-card');
      if (card) {
        const itemId = card.dataset.itemId;
        const item = MenuModel.getById(itemId);
        if (item) {
          CustomerView.renderItemDetailModal(item, MenuModel.getToppings());
          CustomerView.openModal(itemDetailModal);
        }
      }
    });
  },

  // Cập nhật tóm tắt các món đã chọn trước cho form đặt bàn
  renderPreorderSummary() {
    const summaryBox = document.getElementById('preorderSummary');
    if (!summaryBox) return;

    if (this.preOrders.length === 0) {
      summaryBox.innerHTML = '';
      return;
    }

    summaryBox.innerHTML = `
      <div style="margin-top: 10px; padding: 12px; background: #F8FAFC; border: 1px solid var(--color-border); border-radius: var(--radius-card);">
        <strong style="font-size: 0.9rem;">Món đã chọn (${this.preOrders.length}):</strong>
        <ul style="padding-left: 20px; margin-top: 6px; font-size: 0.88rem;">
          ${this.preOrders.map((p, idx) => `
            <li style="margin-bottom: 4px;">
              <strong>${escapeHtml(p.item.name)}</strong> - ${formatCurrency(p.totalPrice)}
              ${p.toppings.length > 0 ? `<span style="color: var(--color-muted);"> (+ ${p.toppings.map(t => escapeHtml(t.name)).join(', ')})</span>` : ''}
              <button type="button" class="btn btn-secondary remove-preorder-btn" data-index="${idx}" aria-label="Xóa ${escapeHtml(p.item.name)}">Xóa</button>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  },

  removePreorder(index) {
    this.preOrders.splice(index, 1);
    this.renderPreorderSummary();
  },

  // Lấy ngày hiện tại tại Việt Nam để giới hạn lịch đặt bàn.
  reservationDateBounds() {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const value = type => parts.find(part => part.type === type).value;
    const today = `${value('year')}-${value('month')}-${value('day')}`;
    const maximum = new Date(`${today}T00:00:00Z`);
    maximum.setUTCDate(maximum.getUTCDate() + 21);
    return { today, maximum: maximum.toISOString().slice(0, 10) };
  },

  refreshReservationSlots() {
    const { resDate, resBranch, resTimeSelected, resTimeSlotsGrid } = CustomerView.elements;
    const bounds = this.reservationDateBounds();
    resDate.min = bounds.today;
    resDate.max = bounds.maximum;
    const branch = BranchModel.getById(resBranch.value);
    const valid = branch && branch.hasBooking === true && resDate.value >= bounds.today && resDate.value <= bounds.maximum;
    const slots = valid ? ShopSettingsModel.getAvailableTimeSlots(resDate.value, branch).slots : [];
    if (!slots.includes(resTimeSelected.value)) resTimeSelected.value = '';
    resTimeSlotsGrid.innerHTML = slots.length ? slots.map(time => `<button type="button" class="btn btn-secondary time-slot ${time === resTimeSelected.value ? 'active' : ''}" data-time="${time}" aria-pressed="${time === resTimeSelected.value}">${time}</button>`).join('') : '<p>Chọn chi nhánh và ngày hợp lệ để xem giờ còn nhận đặt.</p>';
  },

  updateGuestCounter(value) {
    const elements = CustomerView.elements;
    const count = Math.min(8, Math.max(1, value));
    elements.resPartySize.value = count;
    elements.guestCountDisplay.textContent = count;
    elements.guestMinusBtn.disabled = count === 1;
    elements.guestPlusBtn.disabled = count === 8;
  },

  setupReservationEvents() {
    const elements = CustomerView.elements;
    elements.resDate.addEventListener('change', () => this.refreshReservationSlots());
    elements.resBranch.addEventListener('change', () => {
      BranchModel.setSelectedBranch(elements.resBranch.value);
      elements.bottomBranchSelect.value = elements.resBranch.value;
      this.refreshReservationSlots();
    });
    elements.bottomReserveBtn.addEventListener('click', () => this.refreshReservationSlots());
    elements.bottomBranchSelect.addEventListener('change', () => this.refreshReservationSlots());
    elements.resTimeSlotsGrid.addEventListener('click', event => {
      const button = event.target.closest('.time-slot');
      if (!button) return;
      elements.resTimeSelected.value = button.dataset.time;
      this.refreshReservationSlots();
    });
    elements.guestMinusBtn.addEventListener('click', () => this.updateGuestCounter(Number(elements.resPartySize.value) - 1));
    elements.guestPlusBtn.addEventListener('click', () => this.updateGuestCounter(Number(elements.resPartySize.value) + 1));
    elements.reservationForm.addEventListener('submit', event => {
      event.preventDefault();
      this.submitReservation();
    });
    document.getElementById('preorderSummary').addEventListener('click', event => {
      const button = event.target.closest('.remove-preorder-btn');
      if (button) this.removePreorder(Number(button.dataset.index));
    });
    document.getElementById('closeSuccessModalBtn').addEventListener('click', () => CustomerView.closeModal(elements.successModal));
    document.getElementById('openLookupModalBtn').addEventListener('click', () => CustomerView.openModal(elements.lookupModal));
    document.getElementById('closeLookupBtn').addEventListener('click', () => CustomerView.closeModal(elements.lookupModal));
    document.getElementById('lookupForm').addEventListener('submit', event => {
      event.preventDefault();
      const code = document.getElementById('lookupCode').value.trim().toUpperCase();
      const phone = document.getElementById('lookupPhone').value.replace(/[\s.-]/g, '');
      const booking = BookingModel.getAll().find(item => item.code === code && item.phone === phone);
      this.lookupBookingId = booking ? booking.id : null;
      document.getElementById('lookupResultBox').innerHTML = booking ? CustomerView.bookingCard(booking) : '<p>Không tìm thấy đặt bàn với mã và số điện thoại này trên thiết bị.</p>';
    });
    const cancelHandler = event => {
      const button = event.target.closest('.cancel-booking-btn');
      if (!button) return;
      const id = Number(button.dataset.bookingId);
      const allowed = BookingModel.getMyBookings().some(booking => booking.id === id) || id === this.lookupBookingId;
      if (!allowed) return;
      const result = BookingModel.cancel(id);
      CustomerView.showToast(result.success ? 'Đã hủy đặt bàn.' : result.message);
      this.loadBookings();
      if (result.success && id === this.lookupBookingId) document.getElementById('lookupResultBox').innerHTML = CustomerView.bookingCard(result.booking);
    };
    elements.bookingsListContainer.addEventListener('click', cancelHandler);
    document.getElementById('lookupResultBox').addEventListener('click', cancelHandler);
    this.updateGuestCounter(2);
    this.refreshReservationSlots();
    this.loadBookings();
  },

  loadBookings() {
    const bookings = BookingModel.getMyBookings();
    CustomerView.elements.bookingsListContainer.innerHTML = bookings.length ? bookings.map(booking => CustomerView.bookingCard(booking)).join('') : '<p>Chưa có đặt bàn nào trên tài khoản hoặc thiết bị này.</p>';
  },

  loadFavorites() {
    CustomerView.renderFavorites(FavoriteModel.getFavoriteItems(), UserModel.getCurrentUser());
  },

  setupFavoritesEvents() {
    CustomerView.elements.favoritesGrid.addEventListener('click', event => {
      if (event.target.closest('#favoritesLoginBtn')) {
        CustomerView.openModal(CustomerView.elements.loginModal);
        return;
      }
      if (event.target.closest('#favoritesMenuBtn')) {
        CustomerView.switchView('viewMenu');
        return;
      }
      const favorite = event.target.closest('[data-fav-id]');
      if (favorite) {
        const result = FavoriteModel.toggle(favorite.dataset.favId);
        if (result.success) {
          CustomerView.updateAllFavoriteIcons(favorite.dataset.favId, result.isAdded);
          this.loadFavorites();
          CustomerView.showToast('Đã bỏ yêu thích món.');
        } else {
          if (result.requireLogin) CustomerView.openModal(CustomerView.elements.loginModal);
          CustomerView.showToast(result.message || 'Vui lòng đăng nhập để lưu món yêu thích.');
        }
        return;
      }
      const card = event.target.closest('.favorite-item-card');
      const item = card && MenuModel.getById(card.dataset.itemId);
      if (item) {
        CustomerView.renderItemDetailModal(item, MenuModel.getToppings());
        CustomerView.openModal(CustomerView.elements.itemDetailModal);
      }
    });
  },

  submitReservation() {
    const el = CustomerView.elements;
    const bounds = this.reservationDateBounds();
    const branch = BranchModel.getById(el.resBranch.value);
    const date = el.resDate.value;
    const time = el.resTimeSelected.value;
    const guests = Number(el.resPartySize.value);
    const name = el.resName.value.trim();
    const phone = el.resPhone.value.replace(/[\s.-]/g, '');
    const email = el.resEmail.value.trim();
    const errors = {
      resBranch: !branch || branch.hasBooking !== true ? 'Vui lòng chọn chi nhánh có nhận đặt bàn.' : '',
      resDate: !date || date < bounds.today || date > bounds.maximum ? 'Vui lòng chọn ngày trong vòng 21 ngày tới.' : '',
      resTime: !branch || !date || !ShopSettingsModel.getAvailableTimeSlots(date, branch).slots.includes(time) ? 'Vui lòng chọn khung giờ hợp lệ.' : '',
      resPartySize: !Number.isInteger(guests) || guests < 1 || guests > 8 ? 'Số khách phải từ 1 đến 8.' : '',
      resName: !name ? 'Vui lòng nhập họ tên.' : '',
      resPhone: !/^(0\d{9}|\+84\d{9})$/.test(phone) ? 'Vui lòng nhập số điện thoại hợp lệ.' : '',
      resEmail: email && !el.resEmail.validity.valid ? 'Vui lòng nhập email hợp lệ.' : ''
    };
    Object.entries(errors).forEach(([key, message]) => { document.getElementById(`${key}Error`).textContent = message; });
    if (Object.values(errors).some(Boolean)) return;
    const unavailable = this.preOrders.some(order => {
      const item = MenuModel.getById(order.item.id);
      return !item || item.available === false;
    });
    if (unavailable) {
      CustomerView.showToast('Một món đặt trước không còn mở bán. Vui lòng xóa món đó.');
      return;
    }
    try {
      const booking = BookingModel.create({ fullName: name, phone, email, bookDate: date, bookTime: time, guests, branchId: branch.id, branchName: branch.name, notes: el.resNote.value.trim(), preOrders: this.preOrders });
      document.getElementById('successModalDetails').innerHTML = CustomerView.bookingCard(booking, false) + '<p>Vui lòng lưu mã đặt bàn và số điện thoại để tra cứu trên trình duyệt này.</p>';
      el.reservationForm.reset();
      el.resTimeSelected.value = '';
      this.preOrders = [];
      this.renderPreorderSummary();
      this.updateGuestCounter(2);
      this.loadBranches();
      this.refreshReservationSlots();
      this.loadBookings();
      CustomerView.openModal(el.successModal);
    } catch (error) {
      CustomerView.showToast(error.message || 'Không thể lưu đặt bàn. Vui lòng thử lại.');
    }
  },

  // Tự động tô sáng mục Sidebar tương ứng khi người dùng cuộn nội dung
  setupScrollSpy() {
    if (this.scrollSpyReady) return;
    this.scrollSpyReady = true;

    window.addEventListener('scroll', () => {
      // Chỉ theo dõi khi đang ở viewMenu
      const viewMenu = document.getElementById('viewMenu');
      if (!viewMenu || !viewMenu.classList.contains('active-view')) return;

      const scrollPos = window.scrollY + 160;
      const sections = document.querySelectorAll('.menu-group-section');
      const subItems = document.querySelectorAll('.sidebar-sub-item');
      sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          const id = section.id;
          subItems.forEach(item => {
            if (item.dataset.targetSection === id) {
              item.classList.add('active');
            } else {
              item.classList.remove('active');
            }
          });
        }
      });
    }, { passive: true });
  },

  // 4. Quản lý Modal Đăng nhập / Đăng ký
  setupAuthModals() {
    const navLoginBtn = document.getElementById('navLoginBtn');
    const navRegisterBtn = document.getElementById('navRegisterBtn');
    const cancelLoginBtn = document.getElementById('cancelLoginBtn');
    const cancelRegisterBtn = document.getElementById('cancelRegisterBtn');
    const switchToRegisterBtn = document.getElementById('switchToRegisterBtn');
    const switchToLoginBtn = document.getElementById('switchToLoginBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Mở modal Đăng nhập
    if (navLoginBtn) {
      navLoginBtn.addEventListener('click', () => {
        CustomerView.openModal(CustomerView.elements.loginModal);
      });
    }

    // Mở modal Đăng ký
    if (navRegisterBtn) {
      navRegisterBtn.addEventListener('click', () => {
        CustomerView.openModal(CustomerView.elements.registerModal);
      });
    }

    // Đóng modal Đăng nhập
    if (cancelLoginBtn) {
      cancelLoginBtn.addEventListener('click', () => {
        CustomerView.closeModal(CustomerView.elements.loginModal);
      });
    }

    // Đóng modal Đăng ký
    if (cancelRegisterBtn) {
      cancelRegisterBtn.addEventListener('click', () => {
        CustomerView.closeModal(CustomerView.elements.registerModal);
      });
    }

    // Chuyển nhanh giữa Đăng nhập <-> Đăng ký
    if (switchToRegisterBtn) {
      switchToRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        CustomerView.closeModal(CustomerView.elements.loginModal);
        CustomerView.openModal(CustomerView.elements.registerModal);
      });
    }

    if (switchToLoginBtn) {
      switchToLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        CustomerView.closeModal(CustomerView.elements.registerModal);
        CustomerView.openModal(CustomerView.elements.loginModal);
      });
    }

    // Xử lý gửi Form Đăng nhập
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const errorEl = document.getElementById('loginUsernameError');

        if (!username || !password) {
          if (errorEl) errorEl.textContent = 'Vui lòng điền đầy đủ email và mật khẩu!';
          return;
        }

        const result = await UserModel.login(username, password, 'customer');
        if (result.success) {
          if (errorEl) errorEl.textContent = '';
          CustomerView.closeModal(CustomerView.elements.loginModal);
          loginForm.reset();
          this.loadAuth();
          CustomerView.showToast(`Chào mừng trở lại, ${result.user.fullName || result.user.username}!`);
        } else {
          if (errorEl) errorEl.textContent = result.message || 'Tài khoản hoặc mật khẩu không chính xác!';
        }
      });
    }

    // Xử lý gửi Form Đăng ký
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('regFullName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const errorEl = document.getElementById('regFullNameError');

        if (!fullName || !email || !password) {
          if (errorEl) errorEl.textContent = 'Vui lòng điền đầy đủ tất cả các trường!';
          return;
        }

        if (!document.getElementById('regEmail').validity.valid) {
          if (errorEl) errorEl.textContent = 'Vui lòng nhập email hợp lệ.';
          return;
        }

        const result = await UserModel.registerCustomer({ fullName, email, password });
        if (result.success) {
          if (errorEl) errorEl.textContent = '';
          CustomerView.closeModal(CustomerView.elements.registerModal);
          registerForm.reset();
          this.loadAuth();
          CustomerView.showToast('Đăng ký tài khoản thành công!');
        } else {
          if (errorEl) errorEl.textContent = result.message || 'Đăng ký thất bại, vui lòng thử lại!';
        }
      });
    }
  }
};
