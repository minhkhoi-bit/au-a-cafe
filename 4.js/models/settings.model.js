/**
 * ============================================================
 * MODEL: SHOP SETTINGS (CÀI ĐẶT THÔNG TIN QUÁN)
 * Quản lý thông tin giờ mở/đóng cửa, số khách tối đa, tên quán
 * ============================================================
 */

const ShopSettingsModel = {
  // Lấy toàn bộ cấu hình quán
  get() {
    return getData('shopSettings', DEFAULT_SETTINGS);
  },

  // Cập nhật cấu hình quán
  update(newSettings) {
    const name = (newSettings.name || '').trim();
    const openTime = (newSettings.openTime || '').trim();
    const closeTime = (newSettings.closeTime || '').trim();
    const maxGuests = Number(newSettings.maxGuests);
    const phone = (newSettings.phone || '').trim();
    const address = (newSettings.address || '').trim();

    if (!name || !openTime || !closeTime || !phone || !address) {
      return { success: false, message: 'Vui lòng không để trống bất kỳ trường nào.' };
    }

    if (openTime >= closeTime) {
      return { success: false, message: 'Giờ mở cửa phải nhỏ hơn giờ đóng cửa.' };
    }

    if (isNaN(maxGuests) || maxGuests < 1) {
      return { success: false, message: 'Số khách tối đa mỗi lượt đặt phải lớn hơn hoặc bằng 1.' };
    }

    const current = this.get();
    const updated = {
      ...current,
      name,
      openTime,
      closeTime,
      maxGuests,
      phone,
      address
    };
    setData('shopSettings', updated);
    if (window.db) {
      window.db.collection('settings').doc('shop').set(updated).catch(err => console.error("Lỗi cập nhật settings trên Firestore:", err));
    }
    return { success: true, data: updated };
  },

  // Tính danh sách các khung giờ hợp lệ cho một ngày cụ thể (mỗi slot 30 phút)
  getAvailableTimeSlots(selectedDate, branch) {
    const settings = this.get();
    const nowParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const part = type => nowParts.find(item => item.type === type).value;
    const todayStr = `${part('year')}-${part('month')}-${part('day')}`;
    const isToday = (selectedDate === todayStr);

    const branchHours = branch && (branch.openHours || '').match(/^(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/);
    const [openH, openM] = (branchHours ? branchHours[1] : settings.openTime || "08:00").split(':').map(Number);
    const [closeH, closeM] = (branchHours ? branchHours[2] : settings.closeTime || "22:30").split(':').map(Number);

    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    const currentMinutes = Number(part('hour')) * 60 + Number(part('minute'));

    const slots = [];

    for (let m = openMinutes; m < closeMinutes; m += 30) {
      // Nếu là hôm nay, chỉ cho phép đặt trước ít nhất 15 phút
      if (isToday && m <= currentMinutes + 15) {
        continue;
      }

      const h = String(Math.floor(m / 60)).padStart(2, '0');
      const min = String(m % 60).padStart(2, '0');
      slots.push(`${h}:${min}`);
    }

    return {
      slots,
      isToday,
      hasSlots: slots.length > 0
    };
  }
};

