/**
 * ============================================================
 * MODEL: YÊU THÍCH (FAVORITE MODEL)
 * Quản lý danh sách món ăn yêu thích của khách hàng
 * ============================================================
 */

const FavoriteModel = {
  // Lấy danh sách ID các món yêu thích của người dùng hiện tại
  getFavoriteIds() {
    const user = UserModel.getCurrentUser();
    if (!user) return [];
    const allFavorites = getData('favoritesData', {});
    return Object.hasOwn(allFavorites, user.username) && Array.isArray(allFavorites[user.username]) ? allFavorites[user.username] : [];
  },

  // Kiểm tra món đã được thích chưa
  isFavorite(itemId) {
    const ids = this.getFavoriteIds();
    return ids.includes(itemId);
  },

  // Thêm hoặc bỏ thích một món
  toggle(itemId) {
    const user = UserModel.getCurrentUser();
    if (!user) {
      return { success: false, requireLogin: true };
    }

    const allFavorites = getData('favoritesData', {});
    const userFavorites = this.getFavoriteIds().slice();
    const index = userFavorites.indexOf(itemId);
    let isAdded = false;

    if (index > -1) {
      userFavorites.splice(index, 1);
      isAdded = false;
    } else {
      userFavorites.push(itemId);
      isAdded = true;
    }

    allFavorites[user.username] = userFavorites;
    if (!setData('favoritesData', allFavorites)) return { success: false, message: 'Không thể lưu món yêu thích trên trình duyệt.' };

    // Kích hoạt custom event thông báo thay đổi
    window.dispatchEvent(new CustomEvent('favoritesChanged', { detail: { itemId, isAdded } }));
    return { success: true, isAdded };
  },

  // Lấy đầy đủ đối tượng danh sách món yêu thích
  getFavoriteItems() {
    const ids = this.getFavoriteIds();
    const allMenu = MenuModel.getAll();
    return allMenu.filter(item => ids.includes(item.id));
  }
};

