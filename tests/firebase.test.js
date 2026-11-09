const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

let bookings = [{ id: 1 }];
let onBookings, onError;
const context = vm.createContext({
  console: { warn() {} }, window: {},
  setData(key, value) { if (key === 'bookingsData') bookings = value; }
});
vm.runInContext(fs.readFileSync('4.js/firebase.config.js', 'utf8'), context);
context.mockDb = {
  collection(name) {
    if (name === 'settings') return { doc: () => ({ onSnapshot() {} }) };
    return { onSnapshot(success, error) { if (name === 'bookings') { onBookings = success; onError = error; } } };
  }
};
vm.runInContext('db = mockDb; FirebaseService.startRealtimeSync();', context);
onBookings({ empty: true, metadata: { fromCache: false } });
assert.equal(bookings[0].id, 1);
onBookings({ empty: false, metadata: { fromCache: true } });
assert.equal(bookings[0].id, 1);
onError(new Error('offline'));
assert.equal(bookings[0].id, 1);
onBookings({ empty: false, metadata: { fromCache: false }, forEach(fn) { fn({ id: '2', data: () => ({ id: 2 }) }); } });
assert.equal(bookings.length, 1);
assert.equal(bookings[0].id, 2);
console.log('Đã kiểm tra đồng bộ bookings và giữ dữ liệu khi snapshot rỗng, từ cache hoặc lỗi.');
