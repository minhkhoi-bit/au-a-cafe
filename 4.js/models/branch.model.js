/**
 * ============================================================
 * MODEL: QUẢN LÝ CHI NHÁNH (BRANCH MODEL)
 * Quản lý danh sách chi nhánh quán cà phê & chi nhánh đang chọn
 * ============================================================
 */

const BranchModel = {
  // Lấy toàn bộ danh sách chi nhánh
  getAll() {
    return getData('branchData', typeof DEFAULT_BRANCHES !== 'undefined' ? DEFAULT_BRANCHES : []);
  },

  // Tìm chi nhánh theo mã ID
  getById(id) {
    const list = this.getAll();
    return list.find(b => b.id === id) || null;
  },

  // Lấy chi nhánh hiện đang được khách chọn (lưu ở localStorage để dùng lại cho menu & form đặt bàn)
  getSelectedBranch() {
    const selectedId = getData('selectedBranchId', null);
    const list = this.getAll();
    if (selectedId) {
      const found = list.find(b => b.id === selectedId);
      if (found) return found;
    }
    // Mặc định chọn chi nhánh đầu tiên (Thành Thái Q10)
    return list[0] || null;
  },

  // Cập nhật chi nhánh đang chọn
  setSelectedBranch(id) {
    setData('selectedBranchId', id);
    // Kích hoạt custom event để các view khác tự động cập nhật
    window.dispatchEvent(new CustomEvent('branchChanged', { detail: { branchId: id } }));
  }
};

