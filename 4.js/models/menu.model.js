/**
 * ============================================================
 * MODEL: MENU (DỮ LIỆU THỰC ĐƠN)
 * Quản lý cấu trúc danh mục cha - con và các món của quán
 * ============================================================
 */

const MenuModel = {
  // Lấy toàn bộ danh mục cha và mục con
  getCategories() {
    return getData('categoriesData', typeof DEFAULT_CATEGORIES !== 'undefined' ? DEFAULT_CATEGORIES : []);
  },

  // Lấy toàn bộ danh sách tùy chọn/topping
  getToppings() {
    return getData('toppingsData', typeof DEFAULT_TOPPINGS !== 'undefined' ? DEFAULT_TOPPINGS : []);
  },

  // Lấy toàn bộ danh sách món
  getAll() {
    return getData('menuData', typeof DEFAULT_MENU !== 'undefined' ? DEFAULT_MENU : []);
  },

  // Lấy món theo ID
  getById(id) {
    const list = this.getAll();
    return list.find(item => item.id === id) || null;
  },

  // Lấy danh sách món theo danh mục con (subcategory)
  getBySubCategory(subCatId) {
    const list = this.getAll();
    return list.filter(item => item.subCategory === subCatId);
  },

  // Lấy danh sách món Featured (nổi bật) sắp xếp theo displayOrder
  getFeatured() {
    const list = this.getAll();
    return list
      .filter(item => item.isFeatured === true)
      .sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99));
  },

  // Thêm món mới
  add(item) {
    const list = this.getAll();
    const newItem = {
      id: item.id || 'menu_' + Date.now(),
      name: item.name,
      price: Number(item.price) || 0,
      subCategory: item.subCategory || 'sub_vn_coffee',
      parentCategory: item.parentCategory || 'group_coffee',
      img: item.img || '',
      desc: item.desc || '',
      isFeatured: !!item.isFeatured,
      displayOrder: Number(item.displayOrder) || 99,
      available: item.available !== false
    };
    list.push(newItem);
    setData('menuData', list);
    if (window.db) window.db.collection('menu').doc(newItem.id).set(newItem).catch(err => console.error("Lỗi Firestore:", err));
    return newItem;
  },

  // Cập nhật món
  update(id, data) {
    const list = this.getAll();
    const idx = list.findIndex(item => item.id === id);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        ...data,
        price: data.price !== undefined ? Number(data.price) : list[idx].price
      };
      setData('menuData', list);
      if (window.db) window.db.collection('menu').doc(id).set(list[idx]).catch(err => console.error("Lỗi Firestore:", err));
      return list[idx];
    }
    return null;
  },

  // Xóa món
  delete(id) {
    let list = this.getAll();
    list = list.filter(item => item.id !== id);
    setData('menuData', list);
    if (window.db) window.db.collection('menu').doc(id).delete().catch(err => console.error("Lỗi Firestore:", err));
    return true;
  },

  // Bật/tắt trạng thái mở bán
  toggleAvailability(id) {
    const list = this.getAll();
    const idx = list.findIndex(item => item.id === id);
    if (idx !== -1) {
      list[idx].available = list[idx].available === false;
      setData('menuData', list);
      return list[idx];
    }
    return null;
  }
};
