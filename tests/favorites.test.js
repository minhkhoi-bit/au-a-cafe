// Kiểm tra tài khoản và danh sách yêu thích độc lập với trình duyệt.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const data = {};
let failWrite = false;
let currentUser = null;
const context = vm.createContext({
  console,
  window: { dispatchEvent() {} },
  CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  localStorage: { removeItem(key) { delete data[key]; } },
  getData: (key, fallback) => data[key] === undefined ? fallback : structuredClone(data[key]),
  setData: (key, value) => {
    if (failWrite) return false;
    data[key] = structuredClone(value);
    return true;
  },
  MenuModel: { getAll: () => [{ id: 'coffee' }, { id: 'tea' }] },
  UserModel: { getCurrentUser: () => currentUser }
});
vm.runInContext(fs.readFileSync('4.js/models/favorite.model.js', 'utf8') + '\nglobalThis.favorites = FavoriteModel;', context);
const { favorites } = context;
assert.equal(favorites.toggle('coffee').requireLogin, true);
currentUser = { id: 'uid1', username: 'uid1' };
assert.equal(favorites.toggle('coffee').isAdded, true);
assert.deepEqual(Array.from(favorites.getFavoriteIds()), ['coffee']);
assert.equal(favorites.toggle('coffee').isAdded, false);
assert.equal(favorites.getFavoriteIds().length, 0);
currentUser = { id: 'uid2', username: 'uid2' };
assert.equal(favorites.getFavoriteIds().length, 0);
failWrite = true;
assert.equal(favorites.toggle('tea').success, false);
console.log('Đã kiểm tra tách yêu thích theo tài khoản và lỗi lưu.');
