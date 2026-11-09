// Kiểm tra các giới hạn chính của luồng đặt bàn bằng Node.js.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const data = {};
let failWrite = false;
const context = vm.createContext({
  console, crypto: webcrypto, window: {},
  getData: (key, fallback) => data[key] === undefined ? fallback : structuredClone(data[key]),
  setData: (key, value) => {
    if (failWrite) return false;
    data[key] = structuredClone(value);
    return true;
  },
  UserModel: { getCurrentUser: () => null }
});
vm.runInContext(fs.readFileSync('4.js/models/booking.model.js', 'utf8') + '\nglobalThis.bookingModel = BookingModel;', context);
const model = context.bookingModel;
const appointment = { bookDate: '2027-01-02', bookTime: '12:00', status: 'pending' };
const appointmentTime = Date.parse('2027-01-02T12:00:00+07:00');
assert.equal(model.canCancel(appointment, appointmentTime - 5 * 3600000), true);
assert.equal(model.canCancel(appointment, appointmentTime - 5 * 3600000 + 1), false);
assert.equal(model.canCancel({ ...appointment, status: 'cancelled' }, 0), false);

const saved = model.create({ fullName: 'An', phone: '0901234567', branchId: 'branch_thanh_thai', branchName: 'Thành Thái', bookDate: '2099-01-02', bookTime: '12:00', guests: 2, preOrders: [{ item: { name: 'Cà phê' }, toppings: [] }] });
assert.match(saved.code, /^AV-[A-Z0-9]{14}$/);
assert.equal(model.getAll()[0].phone, '0901234567');
assert.equal(model.getAll()[0].preOrders[0].item.name, 'Cà phê');
assert.equal(model.cancel(saved.id).success, true);
assert.equal(model.cancel(saved.id).success, false);
failWrite = true;
assert.throws(() => model.create({}), /Không thể lưu/);

const controllerContext = vm.createContext({ Intl, Date });
vm.runInContext(fs.readFileSync('2.customer/customer.controller.js', 'utf8') + '\nglobalThis.controller = CustomerController;', controllerContext);
const bounds = controllerContext.controller.reservationDateBounds();
assert.equal((Date.parse(bounds.maximum) - Date.parse(bounds.today)) / 86400000, 21);

const settingsContext = vm.createContext({ Intl, Date, getData: () => ({ openTime: '07:00', closeTime: '22:30' }), DEFAULT_SETTINGS: {} });
vm.runInContext(fs.readFileSync('4.js/models/settings.model.js', 'utf8') + '\nglobalThis.settings = ShopSettingsModel;', settingsContext);
const slots = settingsContext.settings.getAvailableTimeSlots(bounds.maximum, { openHours: '08:00 - 09:00' }).slots;
assert.deepEqual(Array.from(slots), ['08:00', '08:30']);
console.log('Đã kiểm tra giới hạn 21 ngày, giờ theo chi nhánh, lưu dữ liệu và mốc hủy 5 tiếng.');
