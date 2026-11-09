const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const docs = {};
let listener;
const auth = {
  currentUser: null,
  onAuthStateChanged(callback) { listener = callback; queueMicrotask(() => callback(this.currentUser)); },
  async createUserWithEmailAndPassword(email) { this.currentUser = { uid: 'u1', email }; return { user: this.currentUser }; },
  async signInWithEmailAndPassword(email, password) {
    if (password !== 'secret1') throw new Error('invalid');
    this.currentUser = { uid: 'u1', email }; return { user: this.currentUser };
  },
  async signOut() { this.currentUser = null; listener(null); }
};
const db = { collection: name => ({ doc: id => ({
  async get() { const value = docs[`${name}/${id}`]; return { exists: value !== undefined, data: () => value }; },
  async set(value) { docs[`${name}/${id}`] = value; }
}) }) };
const context = vm.createContext({
  console, firebase: { auth: () => auth }, window: { db, dispatchEvent() {} },
  localStorage: { removeItem() {} }, Event: class {}
});
vm.runInContext(fs.readFileSync('4.js/models/user.model.js', 'utf8') + '\nglobalThis.model = UserModel;', context);
(async () => {
  const model = context.model;
  await model.init();
  assert.equal((await model.registerCustomer({ fullName: 'An', email: 'an@example.com', password: 'secret1' })).success, true);
  assert.deepEqual(JSON.parse(JSON.stringify(docs['users/u1'])), { fullName: 'An', email: 'an@example.com', role: 'customer' });
  assert.equal(model.isStaff(), false);
  await model.logout();
  assert.equal(model.getCurrentUser(), null);
  assert.equal((await model.login('an@example.com', 'wrong')).success, false);
  docs['admins/u1'] = {};
  assert.equal((await model.login('an@example.com', 'secret1', 'staff')).success, true);
  assert.equal(model.isStaff(), true);
  delete docs['admins/u1'];
  await model.logout();
  assert.equal((await model.login('an@example.com', 'secret1', 'staff')).success, false);
  console.log('Đã kiểm tra Firebase Auth, hồ sơ khách và quyền quản trị.');
})().catch(error => { console.error(error); process.exitCode = 1; });
