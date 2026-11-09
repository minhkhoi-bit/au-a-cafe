/**
 * ============================================================
 * TẬP TIN JS: CÁC HÀM TIỆN ÍCH & TRỢ GIÚP (HELPERS)
 * ============================================================
 */

// Bảo vệ chống tấn công XSS khi render chuỗi do người dùng nhập vào HTML
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Lấy chuỗi ngày YYYY-MM-DD theo múi giờ địa phương của máy (Không dùng toISOString)
function getLocalDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Định dạng tiền tệ VNĐ
function formatCurrency(num) {
  if (isNaN(num)) return '0đ';
  return Number(num).toLocaleString('vi-VN') + 'đ';
}

// Chuyển YYYY-MM-DD sang DD/MM/YYYY
function formatDateVN(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Hiển thị lỗi form
function showError(elementId, message) {
  const errorEl = document.getElementById(elementId);
  if (errorEl) errorEl.textContent = message;
}

// Xóa toàn bộ lỗi form đặt bàn
function resetErrors() {
  document.querySelectorAll('.booking-form .error-msg').forEach(el => el.textContent = '');
}

// Toast thông báo nổi góc màn hình
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('active');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('active');
  }, 3200);
}

// Render huy hiệu trạng thái (Dùng chung cho cả Khách & Quản trị)
function renderStatusBadge(status) {
  if (status === 'confirmed') return `<span class="booking-status-tag status-confirmed">✓ Đã xác nhận</span>`;
  if (status === 'cancelled') return `<span class="booking-status-tag status-cancelled">✕ Đã hủy</span>`;
  return `<span class="booking-status-tag status-pending">⏳ Chờ xác nhận</span>`;
}

// Khởi tạo và đồng bộ Theme Sáng/Tối (Dùng chung cho cả Khách & Quản trị)
function initTheme() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (!themeToggleBtn) return;
  const themeIcon = themeToggleBtn.querySelector('.theme-icon');
  const savedTheme = localStorage.getItem('user-theme');

  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    if (themeIcon) themeIcon.textContent = '☀️';
  } else {
    document.body.classList.remove('dark-theme');
    if (themeIcon) themeIcon.textContent = '🌙';
  }

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    if (themeIcon) themeIcon.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('user-theme', isDark ? 'dark' : 'light');
  });
}

// Xử lý đóng modal: click ra ngoài backdrop hoặc nhấn phím ESC
function initModalCloseHandlers() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(modal => {
        modal.classList.remove('active');
      });
    }
  });

  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });
}

