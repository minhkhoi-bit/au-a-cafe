/**
 * ============================================================
 * MODEL: BOOKING (DỮ LIỆU ĐẶT BÀN)
 * Quản lý trạng thái và thao tác CRUD dữ liệu đặt bàn
 * ============================================================
 */

const BookingModel = {
  // Lấy toàn bộ danh sách đặt bàn
  getAll() {
    return getData('bookingsData', []);
  },

  // Lấy danh sách ID đặt bàn của riêng khách hàng hiện tại
  getMyBookingIds() {
    return getData('myBookingIds', []);
  },

  // Lấy danh sách đặt bàn của khách hàng hiện tại
  getMyBookings() {
    const all = this.getAll();
    const currentUser = typeof UserModel !== 'undefined' ? UserModel.getCurrentUser() : null;

    if (currentUser) {
      return all.filter(b => b.userId && b.userId === currentUser.id);
    }

    const myIds = this.getMyBookingIds();
    return all.filter(b => !b.userId && myIds.includes(b.id));
  },

  // Thêm đơn đặt bàn mới
  create(bookingData) {
    const currentUser = typeof UserModel !== 'undefined' ? UserModel.getCurrentUser() : null;
    const bookings = this.getAll();
    // Giữ mã số tương thích với các nút xử lý trong trang quản trị.
    let id = Date.now();
    while (bookings.some(booking => booking.id === id)) id++;
    let code;
    do {
      const random = new Uint32Array(2);
      crypto.getRandomValues(random);
      code = 'AV-' + Array.from(random, number => number.toString(36).toUpperCase().padStart(7, '0')).join('');
    } while (bookings.some(booking => booking.code === code));

    const newBooking = {
      id,
      code,
      userId: currentUser ? currentUser.id : null,
      fullName: bookingData.fullName,
      email: bookingData.email,
      phone: bookingData.phone,
      branchId: bookingData.branchId,
      branchName: bookingData.branchName,
      preOrders: bookingData.preOrders || [],
      bookDate: bookingData.bookDate,
      bookTime: bookingData.bookTime,
      guests: Number(bookingData.guests) || 1,
      area: bookingData.area || 'Trong nhà (Tầng 1)',
      notes: bookingData.notes || 'Không có ghi chú',
      status: 'pending', // Mặc định chờ duyệt
      createdAt: new Date().toLocaleString('vi-VN')
    };

    bookings.unshift(newBooking);
    if (!setData('bookingsData', bookings)) throw new Error('Không thể lưu đặt bàn trên thiết bị này.');

    // Lưu đơn đặt bàn lên Cloud Firestore Realtime
    if (window.db) {
      window.db.collection('bookings').doc(String(newBooking.id)).set(newBooking).catch(err => console.error("Lỗi lưu booking lên Firestore:", err));
    }

    // Lưu id vào lịch sử cá nhân của khách
    const myIds = this.getMyBookingIds();
    myIds.unshift(newBooking.id);
    setData('myBookingIds', myIds);

    return newBooking;
  },

  // Giờ hẹn của quán luôn tính theo múi giờ Việt Nam (UTC+7).
  canCancel(booking, now = Date.now()) {
    if (!booking || !['pending', 'confirmed'].includes(booking.status)) return false;
    const appointment = Date.parse(`${booking.bookDate}T${booking.bookTime}:00+07:00`);
    return Number.isFinite(appointment) && appointment - now >= 5 * 60 * 60 * 1000;
  },

  cancel(id) {
    const booking = this.getAll().find(item => item.id === id);
    if (!this.canCancel(booking)) return { success: false, message: 'Chỉ có thể hủy bàn trước giờ hẹn ít nhất 5 tiếng.' };
    const bookings = this.getAll();
    const index = bookings.findIndex(item => item.id === id);
    bookings[index].status = 'cancelled';
    if (!setData('bookingsData', bookings)) return { success: false, message: 'Không thể lưu thay đổi. Vui lòng thử lại.' };
    if (window.db) window.db.collection('bookings').doc(String(id)).update({ status: 'cancelled' }).catch(err => console.error('Lỗi cập nhật Firestore:', err));
    return { success: true, booking: bookings[index] };
  },

  // Cập nhật trạng thái (confirmed, cancelled, pending)
  updateStatus(id, newStatus) {
    const bookings = this.getAll();
    const idx = bookings.findIndex(b => b.id === id);
    if (idx !== -1) {
      bookings[idx].status = newStatus;
      setData('bookingsData', bookings);
      if (window.db) {
        window.db.collection('bookings').doc(String(id)).update({ status: newStatus }).catch(err => console.error("Lỗi cập nhật booking trên Firestore:", err));
      }
      return bookings[idx];
    }
    return null;
  },

  // Xóa đơn đặt bàn theo id
  delete(id) {
    let bookings = this.getAll();
    bookings = bookings.filter(b => b.id !== id);
    setData('bookingsData', bookings);
    if (window.db) {
      window.db.collection('bookings').doc(String(id)).delete().catch(err => console.error("Lỗi xóa booking trên Firestore:", err));
    }
    return true;
  },

  // Xóa lịch sử đặt bàn trên thiết bị của khách
  clearMyBookings() {
    setData('myBookingIds', []);
  },

  // Lấy danh sách đã lọc theo tiêu chí (search, date, status)
  filter({ searchTerm = '', dateFilter = 'all', statusFilter = 'all' } = {}) {
    let bookings = this.getAll();
    const today = getLocalDateString();

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      bookings = bookings.filter(b =>
        (b.fullName && b.fullName.toLowerCase().includes(term)) ||
        (b.email && b.email.toLowerCase().includes(term))
      );
    }

    if (dateFilter === 'today') {
      bookings = bookings.filter(b => b.bookDate === today);
    } else if (dateFilter === 'upcoming') {
      bookings = bookings.filter(b => b.bookDate >= today);
    }

    if (statusFilter !== 'all') {
      bookings = bookings.filter(b => b.status === statusFilter);
    }

    return bookings;
  },

  // Lấy các chỉ số thống kê (cho Dashboard Tổng quan)
  getStatistics() {
    const bookings = this.getAll();
    const today = getLocalDateString();

    const todayBookings = bookings.filter(b => b.bookDate === today && b.status !== 'cancelled');
    const pendingBookings = bookings.filter(b => b.status === 'pending');
    const todayGuests = todayBookings.reduce((sum, b) => sum + (Number(b.guests) || 0), 0);

    return {
      todayBookingsCount: todayBookings.length,
      pendingBookingsCount: pendingBookings.length,
      todayGuestsCount: todayGuests,
      recentBookings: bookings.slice(0, 5)
    };
  }
};

