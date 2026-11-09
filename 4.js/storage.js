/**
 * ============================================================
 * TẬP TIN JS: TẦNG LƯU TRỮ & DỮ LIỆU MẶC ĐỊNH (STORAGE & DATA)
 * ============================================================
 */

// Đọc an toàn từ localStorage có fallback
function getData(key, defaultValue) {
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    return JSON.parse(data);
  } catch (err) {
    console.warn(`Lỗi đọc localStorage key "${key}", trả về mặc định:`, err);
    return defaultValue;
  }
}

// Ghi an toàn vào localStorage
function setData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`Lỗi ghi localStorage key "${key}":`, err);
    return false;
  }
}

// Cấu hình thông tin quán mặc định
const DEFAULT_SETTINGS = {
  name: "Âu - Việt Café",
  openTime: "07:00",
  closeTime: "22:30",
  maxGuests: 8,
  maxAdvanceDays: 21,    // Tối đa đặt trước 3 tuần (21 ngày)
  cancelNoticeHours: 5,  // Cho phép hủy trước giờ hẹn 5 tiếng
  phone: "028 3868 1234",
  address: "131/29 Thành Thái, Phường 14, Quận 10, TP. Hồ Chí Minh"
};

// Dữ liệu danh sách chi nhánh mặc định
const DEFAULT_BRANCHES = [
  {
    id: "branch_thanh_thai",
    name: "Âu - Việt Café - Thành Thái",
    address: "131/29 Thành Thái, Phường 14, Quận 10, TP. Hồ Chí Minh",
    district: "Quận 10",
    phone: "028 3868 1234",
    openHours: "07:00 - 22:30",
    isOpen: true,
    hasBooking: true,
    lat: 10.7719,
    lng: 106.6575
  },
  {
    id: "branch_ntmk",
    name: "Âu - Việt Café - Nguyễn Thị Minh Khai",
    address: "18A Nguyễn Thị Minh Khai, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh",
    district: "Quận 1",
    phone: "028 3822 5678",
    openHours: "07:00 - 23:00",
    isOpen: true,
    hasBooking: true,
    lat: 10.7876,
    lng: 106.7001
  },
  {
    id: "branch_pxl",
    name: "Âu - Việt Café - Phan Xích Long",
    address: "214 Phan Xích Long, Phường 2, Quận Phú Nhuận, TP. Hồ Chí Minh",
    district: "Phú Nhuận",
    phone: "028 3517 9999",
    openHours: "07:00 - 22:30",
    isOpen: true,
    hasBooking: true,
    lat: 10.7981,
    lng: 106.6892
  }
];

// Cấu trúc danh mục thực đơn: Nhóm cha & mục con
const DEFAULT_CATEGORIES = [
  {
    id: "group_coffee",
    name: "Cà phê",
    subcategories: [
      { id: "sub_vn_coffee", name: "Cà phê Việt" },
      { id: "sub_eu_coffee", name: "Cà phê kiểu Âu" },
      { id: "sub_sig_coffee", name: "Signature Âu - Việt" }
    ]
  },
  {
    id: "group_tea",
    name: "Trà & Thức uống",
    subcategories: [
      { id: "sub_tea", name: "Trà" },
      { id: "sub_other_beverage", name: "Thức uống khác" }
    ]
  },
  {
    id: "group_food",
    name: "Bánh & Món ăn",
    subcategories: [
      { id: "sub_pastry", name: "Bánh ngọt" },
      { id: "sub_savory", name: "Món mặn nhẹ" },
      { id: "sub_snacks", name: "Món ăn kèm" }
    ]
  }
];

// Danh sách các tùy chọn & Topping dùng kèm
const DEFAULT_TOPPINGS = [
  { id: "top_extra_espresso", name: "Thêm shot espresso", price: 15000 },
  { id: "top_oat_milk", name: "Đổi sữa yến mạch / hạnh nhân", price: 15000 },
  { id: "top_cheese_foam", name: "Kem cheese béo ngậy", price: 10000 },
  { id: "top_jelly", name: "Thạch giòn", price: 10000 },
  { id: "top_boba", name: "Trân châu dẻo", price: 10000 }
];

// Toàn bộ 36 món ăn và đồ uống thực tế của Âu - Việt Café
const DEFAULT_MENU = [
  // 1. Cà phê Việt (sub_vn_coffee)
  {
    id: "vn_cf_1",
    name: "Cà phê đen đá",
    price: 35000,
    subCategory: "sub_vn_coffee",
    parentCategory: "group_coffee",
    desc: "Cà phê Robusta nguyên chất pha phin truyền thống, đậm đà sánh mịn.",
    img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 1,
    available: true
  },
  {
    id: "vn_cf_2",
    name: "Cà phê sữa đá",
    price: 39000,
    subCategory: "sub_vn_coffee",
    parentCategory: "group_coffee",
    desc: "Sự kết hợp hoàn hảo giữa vị đậm đà cà phê Việt và vị ngọt béo từ sữa đặc.",
    img: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80",
    isFeatured: true,
    displayOrder: 4,
    available: true
  },
  {
    id: "vn_cf_3",
    name: "Bạc xỉu",
    price: 42000,
    subCategory: "sub_vn_coffee",
    parentCategory: "group_coffee",
    desc: "Nhiều sữa ít cà phê, béo ngậy ngọt ngào, phù hợp cho người thích vị dịu nhẹ.",
    img: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 2,
    available: true
  },
  {
    id: "vn_cf_4",
    name: "Cà phê muối",
    price: 45000,
    subCategory: "sub_vn_coffee",
    parentCategory: "group_coffee",
    desc: "Lớp kem muối béo mặn nhẹ hòa quyện cùng vị đắng đậm đà của cà phê phin.",
    img: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=500&q=80",
    isFeatured: true,
    displayOrder: 1,
    available: true
  },
  {
    id: "vn_cf_5",
    name: "Cà phê cốt dừa",
    price: 49000,
    subCategory: "sub_vn_coffee",
    parentCategory: "group_coffee",
    desc: "Nước cốt dừa béo bùi xay nhuyễn đá tuyết, rót cà phê đậm đà thơm ngát.",
    img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 3,
    available: true
  },
  {
    id: "vn_cf_6",
    name: "Cà phê trứng",
    price: 55000,
    subCategory: "sub_vn_coffee",
    parentCategory: "group_coffee",
    desc: "Lớp kem trứng đánh bông mịn như nhung, thơm nức không tanh, giữ ấm trên ly cà phê đậm.",
    img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 5,
    available: true
  },

  // 2. Cà phê kiểu Âu (sub_eu_coffee)
  {
    id: "eu_cf_1",
    name: "Espresso",
    price: 45000,
    subCategory: "sub_eu_coffee",
    parentCategory: "group_coffee",
    desc: "Chiết xuất áp suất cao từ 100% hạt Arabica Cầu Đất, lớp crema vàng óng.",
    img: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 10,
    available: true
  },
  {
    id: "eu_cf_2",
    name: "Americano",
    price: 49000,
    subCategory: "sub_eu_coffee",
    parentCategory: "group_coffee",
    desc: "Espresso hòa cùng nước nóng hoặc đá thanh mát, hương hoa quả nhẹ nhàng.",
    img: "https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 11,
    available: true
  },
  {
    id: "eu_cf_3",
    name: "Cappuccino",
    price: 55000,
    subCategory: "sub_eu_coffee",
    parentCategory: "group_coffee",
    desc: "Tỷ lệ cân bằng giữa espresso, sữa nóng và lớp bọt sữa dày bồng bềnh rắc bột cacao.",
    img: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 12,
    available: true
  },
  {
    id: "eu_cf_4",
    name: "Latte",
    price: 55000,
    subCategory: "sub_eu_coffee",
    parentCategory: "group_coffee",
    desc: "Espresso kết hợp sữa tươi thanh trùng đánh nóng mịn màng với nghệ thuật latte art.",
    img: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 13,
    available: true
  },
  {
    id: "eu_cf_5",
    name: "Flat white",
    price: 59000,
    subCategory: "sub_eu_coffee",
    parentCategory: "group_coffee",
    desc: "Gấp đôi lượng espresso cùng lớp bọt sữa siêu mịn microfoam, đậm vị cà phê hơn latte.",
    img: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 14,
    available: true
  },
  {
    id: "eu_cf_6",
    name: "Mocha",
    price: 59000,
    subCategory: "sub_eu_coffee",
    parentCategory: "group_coffee",
    desc: "Espresso nồng nàn quyện cùng sốt socola đen nguyên chất và sữa tươi đánh nóng.",
    img: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 15,
    available: true
  },
  {
    id: "eu_cf_7",
    name: "Caramel macchiato",
    price: 62000,
    subCategory: "sub_eu_coffee",
    parentCategory: "group_coffee",
    desc: "Sữa tươi vani thơm lừng, espresso rót xuyên qua bọt sữa và vẽ vân sốt caramel ngọt dịu.",
    img: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 16,
    available: true
  },

  // 3. Signature Âu - Việt (sub_sig_coffee)
  {
    id: "sig_cf_1",
    name: "Latte phin sữa đặc",
    price: 59000,
    subCategory: "sub_sig_coffee",
    parentCategory: "group_coffee",
    desc: "Sự giao thoa độc bản: cà phê phin truyền thống phối hợp kỹ thuật foam sữa chuẩn Ý.",
    img: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=500&q=80",
    isFeatured: true,
    displayOrder: 2,
    available: true
  },
  {
    id: "sig_cf_2",
    name: "Cappuccino cacao Cầu Đất",
    price: 62000,
    subCategory: "sub_sig_coffee",
    parentCategory: "group_coffee",
    desc: "Cappuccino phủ bột cacao Cầu Đất thượng hạng, thơm nồng đượm vị mộc.",
    img: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 20,
    available: true
  },
  {
    id: "sig_cf_3",
    name: "Espresso tonic cam sả",
    price: 65000,
    subCategory: "sub_sig_coffee",
    parentCategory: "group_coffee",
    desc: "Nước tonic sủi bọt mát lạnh, tép cam tươi, hương sả thoảng nhẹ cùng shot espresso thanh tao.",
    img: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=500&q=80",
    isFeatured: true,
    displayOrder: 3,
    available: true
  },
  {
    id: "sig_cf_4",
    name: "Cold brew bưởi hồng",
    price: 65000,
    subCategory: "sub_sig_coffee",
    parentCategory: "group_coffee",
    desc: "Cà phê ủ lạnh 18 tiếng kết hợp nước ép bưởi hồng tươi thanh dịu chống oxy hóa.",
    img: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 21,
    available: true
  },
  {
    id: "sig_cf_5",
    name: "Latte lá dứa",
    price: 62000,
    subCategory: "sub_sig_coffee",
    parentCategory: "group_coffee",
    desc: "Chiết xuất lá dứa tươi xanh tự nhiên hòa quyện sữa tươi béo thơm và cà phê tinh tuyển.",
    img: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 22,
    available: true
  },
  {
    id: "sig_cf_6",
    name: "Americano quất mật ong",
    price: 55000,
    subCategory: "sub_sig_coffee",
    parentCategory: "group_coffee",
    desc: "Vị chua thanh mát từ trái quất tươi và mật ong hoa rừng làm bừng sáng hương vị cà phê.",
    img: "https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 23,
    available: true
  },

  // 4. Trà (sub_tea)
  {
    id: "tea_1",
    name: "Trà đào cam sả",
    price: 55000,
    subCategory: "sub_tea",
    parentCategory: "group_tea",
    desc: "Trà đen ủ thơm, lát cam vàng mọng nước, đào giòn ngọt ngào cùng cây sả thanh nhiệt.",
    img: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=500&q=80",
    isFeatured: true,
    displayOrder: 5,
    available: true
  },
  {
    id: "tea_2",
    name: "Trà vải hoa hồng",
    price: 55000,
    subCategory: "sub_tea",
    parentCategory: "group_tea",
    desc: "Trà hoa hồng nhẹ nhàng quý phái cùng những trái vải mọng nước ngâm đường phèn.",
    img: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 30,
    available: true
  },
  {
    id: "tea_3",
    name: "Trà sen vàng",
    price: 49000,
    subCategory: "sub_tea",
    parentCategory: "group_tea",
    desc: "Trà ô long thanh khiết kết hợp hạt sen bùi bùi và củ năng giòn sần sật.",
    img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 31,
    available: true
  },
  {
    id: "tea_4",
    name: "Trà hoa cúc mật ong",
    price: 49000,
    subCategory: "sub_tea",
    parentCategory: "group_tea",
    desc: "Hoa cúc sấy khô tự nhiên giúp an thần, làm dịu tâm trí hòa cùng mật ong dịu ngọt.",
    img: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 32,
    available: true
  },
  {
    id: "tea_5",
    name: "Earl Grey sữa",
    price: 55000,
    subCategory: "sub_tea",
    parentCategory: "group_tea",
    desc: "Trà Bá tước Anh Quốc nồng nàn hương cam Bergamot hòa quyện cùng sữa tươi béo thơm.",
    img: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 33,
    available: true
  },
  {
    id: "tea_6",
    name: "Matcha latte",
    price: 59000,
    subCategory: "sub_tea",
    parentCategory: "group_tea",
    desc: "Bột trà xanh Uji Nhật Bản nguyên chất phối cùng sữa tươi béo mịn, màu xanh ngọc bích tươi tắn.",
    img: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 34,
    available: true
  },

  // 5. Thức uống khác (sub_other_beverage)
  {
    id: "oth_1",
    name: "Sinh tố bơ",
    price: 55000,
    subCategory: "sub_other_beverage",
    parentCategory: "group_tea",
    desc: "Bơ sáp Đắk Lắk dẻo bùi xay đặc mịn cùng sữa đặc và sữa tươi dinh dưỡng.",
    img: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 40,
    available: true
  },
  {
    id: "oth_2",
    name: "Sinh tố xoài",
    price: 49000,
    subCategory: "sub_other_beverage",
    parentCategory: "group_tea",
    desc: "Xoài cát Hòa Lộc chín vàng ươm ngọt lịm xay cùng đá tuyết mát lạnh.",
    img: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 41,
    available: true
  },
  {
    id: "oth_3",
    name: "Chanh dây tuyết",
    price: 49000,
    subCategory: "sub_other_beverage",
    parentCategory: "group_tea",
    desc: "Vị chua thanh mát giòn tan của chanh dây tươi xay đá tuyết xua tan mệt mỏi.",
    img: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 42,
    available: true
  },
  {
    id: "oth_4",
    name: "Nước cam ép",
    price: 49000,
    subCategory: "sub_other_beverage",
    parentCategory: "group_tea",
    desc: "100% cam sành vắt nguyên chất tại chỗ, giàu vitamin C tự nhiên tươi khỏe.",
    img: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 43,
    available: true
  },
  {
    id: "oth_5",
    name: "Chocolate nóng",
    price: 55000,
    subCategory: "sub_other_beverage",
    parentCategory: "group_tea",
    desc: "Socola Bỉ đậm đặc nấu cùng sữa béo ngậy, phủ lớp bọt sữa ấm áp xoa dịu tâm hồn.",
    img: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 44,
    available: true
  },
  {
    id: "oth_6",
    name: "Soda chanh bạc hà",
    price: 45000,
    subCategory: "sub_other_beverage",
    parentCategory: "group_tea",
    desc: "Soda sủi bọt mát lạnh, nước cốt chanh tươi và lá bạc hà đập dập thơm the mát.",
    img: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 45,
    available: true
  },

  // 6. Bánh ngọt (sub_pastry)
  {
    id: "pas_1",
    name: "Croissant bơ",
    price: 45000,
    subCategory: "sub_pastry",
    parentCategory: "group_food",
    desc: "Bánh sừng bò truyền thống chuẩn Pháp ngàn lớp giòn tan ngoài vỏ, mềm thơm bơ tươi.",
    img: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 50,
    available: true
  },
  {
    id: "pas_2",
    name: "Croissant nhân hạnh nhân",
    price: 55000,
    subCategory: "sub_pastry",
    parentCategory: "group_food",
    desc: "Vỏ croissant giòn bùi phủ lát hạnh nhân nướng thơm nức và sốt kem hạnh nhân béo ngọt.",
    img: "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&w=500&q=80",
    isFeatured: true,
    displayOrder: 6,
    available: true
  },
  {
    id: "pas_3",
    name: "Tiramisu",
    price: 65000,
    subCategory: "sub_pastry",
    parentCategory: "group_food",
    desc: "Bánh kem phô mai Mascarpone Ý thấm đẫm rượu cà phê espresso và phủ bột cacao nguyên chất.",
    img: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 51,
    available: true
  },
  {
    id: "pas_4",
    name: "Bánh flan caramel",
    price: 35000,
    subCategory: "sub_pastry",
    parentCategory: "group_food",
    desc: "Flan trứng sữa mềm tan, không rỗ, phủ lớp caramel nâu óng ngọt đắng hài hòa.",
    img: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 52,
    available: true
  },
  {
    id: "pas_5",
    name: "Bánh su kem",
    price: 39000,
    subCategory: "sub_pastry",
    parentCategory: "group_food",
    desc: "Vỏ bánh choux giòn nhẹ chứa đầy nhân kem vani mát lạnh béo mịn bên trong (Set 3 cái).",
    img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 53,
    available: true
  },
  {
    id: "pas_6",
    name: "Cheesecake chanh dây",
    price: 65000,
    subCategory: "sub_pastry",
    parentCategory: "group_food",
    desc: "Đế bánh quy bơ giòn, lớp kem phô mai béo ngậy phủ sốt chanh dây vàng óng chua ngọt.",
    img: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 54,
    available: true
  },
  {
    id: "pas_7",
    name: "Pain au chocolat",
    price: 52000,
    subCategory: "sub_pastry",
    parentCategory: "group_food",
    desc: "Bánh mì cuộn socola Pháp giòn xốp với thanh socola đen chảy bên trong.",
    img: "https://images.unsplash.com/photo-1549903072-7e6e0bedb7fb?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 55,
    available: true
  },

  // 7. Món mặn nhẹ (sub_savory)
  {
    id: "sav_1",
    name: "Bánh mì que pate",
    price: 35000,
    subCategory: "sub_savory",
    parentCategory: "group_food",
    desc: "Bánh mì que nướng giòn rụm kẹp pate béo ngậy thơm nức mũi và tương ớt cay nhẹ.",
    img: "https://images.unsplash.com/photo-1621800043295-a73fe2f76e2c?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 60,
    available: true
  },
  {
    id: "sav_2",
    name: "Bánh mì sandwich gà xé phô mai",
    price: 59000,
    subCategory: "sub_savory",
    parentCategory: "group_food",
    desc: "Sandwich nướng vàng kẹp thịt gà xé đậm vị sốt mayonaise và phô mai cheddar tan chảy.",
    img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 61,
    available: true
  },
  {
    id: "sav_3",
    name: "Croque monsieur",
    price: 69000,
    subCategory: "sub_savory",
    parentCategory: "group_food",
    desc: "Món sandwich nướng kinh điển của Pháp với giăm bông hun khói và phô mai Gruyère đút lò thơm lừng.",
    img: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 62,
    available: true
  },

  // 8. Món ăn kèm (sub_snacks)
  {
    id: "snk_1",
    name: "Khoai tây chiên",
    price: 45000,
    subCategory: "sub_snacks",
    parentCategory: "group_food",
    desc: "Khoai tây cắt lát dày chiên vàng giòn rụm, rắc muối ớt hoặc phô mai lắc.",
    img: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 70,
    available: true
  },
  {
    id: "snk_2",
    name: "Phô mai que",
    price: 49000,
    subCategory: "sub_snacks",
    parentCategory: "group_food",
    desc: "Phô mai mozzarella kéo sợi béo ngậy được bọc lớp bột chiên xù giòn tan (Set 4 que).",
    img: "https://images.unsplash.com/photo-1548340742-b0606f15779c?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 71,
    available: true
  },
  {
    id: "snk_3",
    name: "Bánh quy bơ",
    price: 29000,
    subCategory: "sub_snacks",
    parentCategory: "group_food",
    desc: "Hộp bánh quy bơ tươi thủ công thơm bùi, món ăn kèm lý tưởng bên ly cà phê nóng.",
    img: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    displayOrder: 72,
    available: true
  }
];

// Khởi tạo các bảng dữ liệu ban đầu
function initStorage() {
  if (!localStorage.getItem('branchData')) {
    setData('branchData', DEFAULT_BRANCHES);
  }

  // Khởi tạo thực đơn hoặc cập nhật nếu dữ liệu cũ chưa đủ 36 món
  const existingMenu = getData('menuData', []);
  if (!existingMenu || existingMenu.length < 20) {
    setData('menuData', DEFAULT_MENU);
  }

  if (!localStorage.getItem('categoriesData')) {
    setData('categoriesData', DEFAULT_CATEGORIES);
  }

  if (!localStorage.getItem('toppingsData')) {
    setData('toppingsData', DEFAULT_TOPPINGS);
  }

  if (!localStorage.getItem('shopSettings')) {
    setData('shopSettings', DEFAULT_SETTINGS);
  }

  // Đảm bảo dữ liệu đặt bàn cũ có trường status
  let existingBookings = getData('bookingsData', []);
  let updatedAny = false;
  existingBookings = existingBookings.map(b => {
    if (!b.status) {
      b.status = 'pending';
      updatedAny = true;
    }
    return b;
  });
  if (updatedAny) {
    setData('bookingsData', existingBookings);
  }
}
