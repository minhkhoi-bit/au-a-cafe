/**
 * ============================================================
 * CẤU HÌNH & KẾT NỐI DATABASE FIREBASE (FIRESTORE)
 * Dự Án: Quán Cà Phê (Vanilla JS + Cloud Firestore)
 * ============================================================
 */

const firebaseConfig = {
  apiKey: "AIzaSyBo9etuq_bk0waaoKG0UbDI5voEN8t8RT8",
  authDomain: "cafe-web-b529f.firebaseapp.com",
  projectId: "cafe-web-b529f",
  storageBucket: "cafe-web-b529f.firebasestorage.app",
  messagingSenderId: "517180152119",
  appId: "1:517180152119:web:1b8a6d37baf9564d4322b2"
};

// Khởi tạo Firebase App & Firestore Database
let db = null;
if (typeof firebase !== 'undefined') {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    window.db = db;
    console.log("✓ Kết nối Firebase Firestore thành công!");
  } catch (err) {
    console.error("Lỗi khởi tạo Firebase:", err);
  }
}

/**
 * Dịch vụ đồng bộ Realtime giữa Firebase Firestore và ứng dụng Web
 */
const FirebaseService = {
  isReady() {
    return db !== null;
  },

  // 1. Tự động nạp dữ liệu mẫu lên Cloud Firestore nếu database đang rỗng
  async initDatabase() {
    if (!this.isReady()) return;

    try {
      // 1.1 Khởi tạo Settings quán nếu chưa có trên Cloud
      const settingsRef = db.collection('settings').doc('shop');
      const settingsSnap = await settingsRef.get();
      if (!settingsSnap.exists) {
        await settingsRef.set(DEFAULT_SETTINGS);
        console.log("✓ Đã khởi tạo cấu hình quán (settings) lên Firebase");
      }

      // 1.2 Khởi tạo Menu món nếu chưa có trên Cloud
      const menuSnap = await db.collection('menu').limit(1).get();
      if (menuSnap.empty) {
        const batch = db.batch();
        DEFAULT_MENU.forEach(item => {
          const docRef = db.collection('menu').doc(item.id);
          batch.set(docRef, item);
        });
        await batch.commit();
        console.log("✓ Đã nạp danh sách thực đơn mẫu (menu) lên Firebase");
      }

    } catch (error) {
      console.warn("Lưu ý khi khởi tạo dữ liệu Firebase (kiểm tra Security Rules nếu gặp lỗi quyền):", error);
    }
  },

  // 2. Lắng nghe thay đổi dữ liệu theo thời gian thực (Realtime Listeners)
  startRealtimeSync() {
    if (!this.isReady()) return;

    // 2.1 Đồng bộ Realtime Thực Đơn (Menu)
    db.collection('menu').onSnapshot((snapshot) => {
      if (!snapshot.empty) {
        const menuList = [];
        snapshot.forEach(doc => {
          const item = { ...doc.data(), id: doc.id };
          if (item.id && item.name && item.price != null && item.subCategory && item.parentCategory) {
            menuList.push(item);
          } else {
            console.warn('Bỏ qua món Firestore thiếu trường:', item.name || item.id);
          }
        });
        if (!menuList.length) return;
        setData('menuData', menuList);

        if (typeof CustomerController !== 'undefined') CustomerController.loadMenu();
        if (typeof OwnerController !== 'undefined') OwnerController.loadMenu();
      }
    }, (error) => console.warn("Lỗi đồng bộ menu:", error));

    // 2.2 Đồng bộ Realtime Đặt Bàn (Bookings)
    db.collection('bookings').onSnapshot((snapshot) => {
      if (snapshot.empty || snapshot.metadata.fromCache) return;
      const bookingsList = [];
      snapshot.forEach(doc => bookingsList.push({ id: doc.id, ...doc.data() }));
      // Sắp xếp đơn mới nhất lên đầu
      bookingsList.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
      setData('bookingsData', bookingsList);

      if (typeof CustomerController !== 'undefined') CustomerController.loadBookings();
      if (typeof OwnerController !== 'undefined') {
        OwnerController.loadOverview();
        OwnerController.loadBookings();
      }
    }, (error) => console.warn("Lỗi đồng bộ bookings:", error));

    // 2.3 Đồng bộ Realtime Cài Đặt Quán (Settings)
    db.collection('settings').doc('shop').onSnapshot((doc) => {
      if (doc.exists) {
        const settings = doc.data();
        setData('shopSettings', settings);

        if (typeof CustomerController !== 'undefined' && CustomerController.branchEventsReady) {
          CustomerController.refreshReservationSlots();
        }
        if (typeof OwnerController !== 'undefined') {
          OwnerController.loadSettings();
        }
      }
    }, (error) => console.warn("Lỗi đồng bộ settings:", error));

  }
};

// Khởi chạy khi script được tải
if (FirebaseService.isReady()) {
  FirebaseService.initDatabase();
  FirebaseService.startRealtimeSync();
}

