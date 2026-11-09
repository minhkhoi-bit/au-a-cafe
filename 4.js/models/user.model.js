const UserModel = {
  currentUser: null,
  ready: null,
  version: 0,

  init() {
    if (this.ready) return this.ready;
    // Loại bỏ dữ liệu đăng nhập cũ có thể chứa mật khẩu dạng rõ.
    localStorage.removeItem('usersData');
    localStorage.removeItem('currentUser');
    if (typeof firebase === 'undefined' || !window.db) return Promise.resolve();
    this.ready = new Promise(resolve => {
      let first = true;
      firebase.auth().onAuthStateChanged(async user => {
        this.currentUser = null;
        try { await this.refreshUser(user); }
        catch (error) { console.warn('Không thể xác minh tài khoản:', error); this.currentUser = null; }
        if (first) { first = false; resolve(); }
        window.dispatchEvent(new Event('authChanged'));
      }, error => { console.warn('Lỗi xác thực:', error); this.currentUser = null; resolve(); });
    });
    return this.ready;
  },

  async refreshUser(user) {
    const version = ++this.version;
    if (!user) { this.currentUser = null; return; }
    const task = (this.refreshPromise || Promise.resolve()).catch(() => {}).then(async () => {
      const [profile, admin] = await Promise.all([
        window.db.collection('users').doc(user.uid).get(),
        window.db.collection('admins').doc(user.uid).get({ source: 'server' })
      ]);
      if (firebase.auth().currentUser?.uid !== user.uid) return;
      const data = profile.exists ? profile.data() : {};
      this.currentUser = { id: user.uid, username: user.uid, fullName: data.fullName || user.email, email: user.email, role: admin.exists ? 'staff' : 'customer' };
    });
    this.refreshPromise = task;
    await task;
    if (version !== this.version) await this.refreshPromise;
  },

  getCurrentUser() { return this.currentUser; },
  isAuthenticated() { return this.currentUser !== null; },
  isStaff() { return this.currentUser?.role === 'staff'; },

  async registerCustomer({ fullName, email, password }) {
    if (!fullName.trim()) return { success: false, message: 'Vui lòng nhập họ và tên.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return { success: false, message: 'Vui lòng nhập email hợp lệ.' };
    if (password.length < 6) return { success: false, message: 'Mật khẩu cần ít nhất 6 ký tự.' };
    if (typeof firebase === 'undefined' || !window.db) return { success: false, message: 'Không thể kết nối dịch vụ xác thực.' };
    try {
      const credential = await firebase.auth().createUserWithEmailAndPassword(email.trim(), password);
      await window.db.collection('users').doc(credential.user.uid).set({ fullName: fullName.trim(), email: email.trim(), role: 'customer' });
      await this.refreshUser(credential.user);
      return { success: true, user: this.currentUser };
    } catch (error) {
      console.warn('Lỗi đăng ký:', error);
      return { success: false, message: 'Không thể hoàn tất đăng ký. Kiểm tra email hoặc thử đăng nhập lại.' };
    }
  },

  async login(email, password, expectedRole = null) {
    if (typeof firebase === 'undefined' || !window.db) return { success: false, message: 'Không thể kết nối dịch vụ xác thực.' };
    try {
      await this.init();
      const credential = await firebase.auth().signInWithEmailAndPassword(email.trim(), password);
      await this.refreshUser(credential.user);
      if (!this.currentUser) return { success: false, message: 'Không thể xác minh tài khoản.' };
      if (expectedRole === 'staff' && !this.isStaff()) {
        await this.logout();
        return { success: false, message: 'Tài khoản không có quyền nhân viên.' };
      }
      return { success: true, user: this.currentUser };
    } catch (error) {
      console.warn('Lỗi đăng nhập:', error);
      return { success: false, message: 'Không thể đăng nhập hoặc xác minh tài khoản.' };
    }
  },

  async logout() {
    if (typeof firebase !== 'undefined') await firebase.auth().signOut();
    this.version++;
    this.currentUser = null;
  }
};
