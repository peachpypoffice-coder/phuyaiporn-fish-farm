// ข้อมูลเริ่มต้นสำหรับระบบฟาร์มปลาผู้ใหญ่พร (Seed & Default Data)

const DEFAULT_USERS = [
  {
    id: 'usr_ceo',
    name: 'ผู้ใหญ่พร (เจ้าของฟาร์ม)',
    email: 'ceo@phuyaiporn.farm',
    password: 'ceo1234',
    role: 'CEO',
    roleLabel: 'CEO / เจ้าของฟาร์ม',
    badgeColor: 'bg-amber-500 text-white',
    avatar: '👨‍🌾'
  },
  {
    id: 'usr_mgr',
    name: 'คุณสมศักดิ์ (ผู้จัดการฟาร์ม)',
    email: 'manager@phuyaiporn.farm',
    password: 'mgr1234',
    role: 'Manager',
    roleLabel: 'ผู้จัดการฟาร์ม',
    badgeColor: 'bg-sky-600 text-white',
    avatar: '📋'
  },
  {
    id: 'usr_qc',
    name: 'คุณสมศรี (หัวหน้า QC)',
    email: 'qc@phuyaiporn.farm',
    password: 'qc1234',
    role: 'QC',
    roleLabel: 'ฝ่ายตรวจสอบคุณภาพ (QC)',
    badgeColor: 'bg-emerald-600 text-white',
    avatar: '🔬'
  },
  {
    id: 'usr_driver',
    name: 'พี่บุญมี (คนขับรถส่งปลา)',
    email: 'driver@phuyaiporn.farm',
    password: 'driver1234',
    role: 'Driver',
    roleLabel: 'พนักงานขับรถส่งของ',
    badgeColor: 'bg-orange-500 text-white',
    avatar: '🚚'
  }
];

// หมวดหมู่สินค้าและรายการสินค้าเริ่มต้น
const PRODUCT_CATALOG = [
  // หมวดพันธุ์ปลา
  {
    id: 'fish_1',
    category: 'พันธุ์ปลา',
    name: 'ปลาดุกบิ๊กอุย',
    unit: 'ตัว',
    defaultSizes: ['2-3 นิ้ว', '3-4 นิ้ว', '4-5 นิ้ว', 'ใบมะขาม'],
    defaultPrice: 1.20
  },
  {
    id: 'fish_2',
    category: 'พันธุ์ปลา',
    name: 'ปลานิลจิตรลดา',
    unit: 'ตัว',
    defaultSizes: ['ใบมะขาม', '2-3 ซม.', '3-5 ซม.', '5-7 ซม.'],
    defaultPrice: 1.50
  },
  {
    id: 'fish_3',
    category: 'พันธุ์ปลา',
    name: 'ปลาทับทิมซีพี',
    unit: 'ตัว',
    defaultSizes: ['2-3 นิ้ว', '3-4 นิ้ว', '4-5 นิ้ว'],
    defaultPrice: 2.20
  },
  {
    id: 'fish_4',
    category: 'พันธุ์ปลา',
    name: 'ปลาสวายบ่อ',
    unit: 'ตัว',
    defaultSizes: ['3-4 นิ้ว', '5-6 นิ้ว', '7-8 นิ้ว'],
    defaultPrice: 2.00
  },
  {
    id: 'fish_5',
    category: 'พันธุ์ปลา',
    name: 'ปลากดคังน้ำจืด',
    unit: 'ตัว',
    defaultSizes: ['3-4 นิ้ว', '5-7 นิ้ว'],
    defaultPrice: 4.50
  },
  {
    id: 'fish_6',
    category: 'พันธุ์ปลา',
    name: 'ปลาสลิดดอนกระเบื้อง',
    unit: 'ตัว',
    defaultSizes: ['2-3 นิ้ว', '3-4 นิ้ว'],
    defaultPrice: 1.80
  },
  {
    id: 'fish_7',
    category: 'พันธุ์ปลา',
    name: 'ปลาหมอชุมพร 1',
    unit: 'ตัว',
    defaultSizes: ['2-3 นิ้ว', '3-4 นิ้ว'],
    defaultPrice: 1.60
  },

  // หมวดอาหารปลา
  {
    id: 'feed_1',
    category: 'อาหารปลา',
    name: 'อาหารไฮเกรด 9006T อนุบาลลูกปลา (10 กก.)',
    unit: 'กระสอบ',
    defaultSizes: ['กระสอบ 10 กก.'],
    defaultPrice: 620
  },
  {
    id: 'feed_2',
    category: 'อาหารปลา',
    name: 'อาหารปลาดุกเล็ก เบอร์ 1 (20 กก.)',
    unit: 'กระสอบ',
    defaultSizes: ['กระสอบ 20 กก.'],
    defaultPrice: 480
  },
  {
    id: 'feed_3',
    category: 'อาหารปลา',
    name: 'อาหารปลาดุกใหญ่ เบอร์ 3 (20 กก.)',
    unit: 'กระสอบ',
    defaultSizes: ['กระสอบ 20 กก.'],
    defaultPrice: 440
  },
  {
    id: 'feed_4',
    category: 'อาหารปลา',
    name: 'อาหารปลากินพืช เบอร์ 2 (20 กก.)',
    unit: 'กระสอบ',
    defaultSizes: ['กระสอบ 20 กก.'],
    defaultPrice: 410
  },

  // หมวดกระชังเลี้ยงปลา
  {
    id: 'cage_1',
    category: 'กระชังเลี้ยงปลา',
    name: 'กระชังบกเย็บสำเร็จ ผ้ายาง+มุ้งไนลอน 2x3x1.2 ม.',
    unit: 'หลัง',
    defaultSizes: ['2x3x1.2 เมตร'],
    defaultPrice: 850
  },
  {
    id: 'cage_2',
    category: 'กระชังเลี้ยงปลา',
    name: 'กระชังบกเย็บสำเร็จ ผ้ายาง+มุ้งไนลอน 3x4x1.2 ม.',
    unit: 'หลัง',
    defaultSizes: ['3x4x1.2 เมตร'],
    defaultPrice: 1250
  },
  {
    id: 'cage_3',
    category: 'กระชังเลี้ยงปลา',
    name: 'กระชังน้ำมุ้งเขียว 3x4x1.5 ม. พร้อมเชือกร้อย',
    unit: 'ปาก',
    defaultSizes: ['3x4x1.5 เมตร'],
    defaultPrice: 650
  },
  {
    id: 'cage_4',
    category: 'กระชังเลี้ยงปลา',
    name: 'กระชังน้ำมุ้งเขียว 4x6x2.0 ม. หูแขวนหนาพิเศษ',
    unit: 'ปาก',
    defaultSizes: ['4x6x2.0 เมตร'],
    defaultPrice: 1100
  },

  // หมวดยารักษาโรคปลา & เคมีภัณฑ์
  {
    id: 'med_1',
    category: 'ยารักษาโรคปลา',
    name: 'ด่างทับทิมเกรดบ่อปลา ฆ่าเชื้อปรสิต (500 กรัม)',
    unit: 'ขวด',
    defaultSizes: ['ขวด 500 กรัม'],
    defaultPrice: 85
  },
  {
    id: 'med_2',
    category: 'ยารักษาโรคปลา',
    name: 'ยาเหลืองป้องกันแผลและเชื้อรา (ซอง 50 กรัม)',
    unit: 'ซอง',
    defaultSizes: ['ซอง 50 กรัม'],
    defaultPrice: 120
  },
  {
    id: 'med_3',
    category: 'ยารักษาโรคปลา',
    name: 'วิตามินซีเข้มข้น + แร่ธาตุคลายเครียดลูกปลา (1 กก.)',
    unit: 'กระปุก',
    defaultSizes: ['กระปุก 1 กก.'],
    defaultPrice: 320
  },
  {
    id: 'med_4',
    category: 'ยารักษาโรคปลา',
    name: 'เกลือสมุทรบริสุทธิ์เกรดบ่อเพาะพันธุ์ (25 กก.)',
    unit: 'กระสอบ',
    defaultSizes: ['กระสอบ 25 กก.'],
    defaultPrice: 150
  },
  {
    id: 'med_5',
    category: 'ยารักษาโรคปลา',
    name: 'จุลินทรีย์บำบัดน้ำและย่อยสลายของเสียก้นบ่อ (5 ลิตร)',
    unit: 'แกลลอน',
    defaultSizes: ['แกลลอน 5 ลิตร'],
    defaultPrice: 280
  }
];

// Helper สร้างวันที่เปรียบเทียบ (วันนี้, เมื่อวาน, พรุ่งนี้, ฯลฯ)
function getDateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// รูปจำลองสำหรับปลาเสียหาย (SVG Data URL คมชัด ไม่ต้องพึ่งพาอินเทอร์เน็ตภายนอก)
const SAMPLE_CLAIM_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23fee2e2'/%3E%3Cpath d='M80 150 C 140 100, 260 100, 320 150 C 260 200, 140 200, 80 150 Z' fill='%23ef4444' stroke='%23b91c1c' stroke-width='4'/%3E%3Ccircle cx='130' cy='140' r='8' fill='%23ffffff'/%3E%3Cline x1='124' y1='134' x2='136' y2='146' stroke='%23000' stroke-width='3'/%3E%3Cline x1='136' y1='134' x2='124' y2='146' stroke='%23000' stroke-width='3'/%3E%3Cpolygon points='320,150 370,110 350,150 370,190' fill='%23ef4444' stroke='%23b91c1c' stroke-width='3'/%3E%3Ctext x='200' y='250' font-family='sans-serif' font-size='18' font-weight='bold' fill='%23991b1b' text-anchor='middle'%3Eหลักฐานภาพถ่าย: ปลาน็อคน้ำหน้างาน (200 ตัว)%3C/text%3E%3Ctext x='200' y='275' font-family='sans-serif' font-size='14' fill='%23b91c1c' text-anchor='middle'%3Eฟาร์มปลาผู้ใหญ่พร - ระบบตรวจสอบ QC%3C/text%3E%3C/svg%3E";

const SAMPLE_SLIP_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='350' height='450' viewBox='0 0 350 450'%3E%3Crect width='350' height='450' fill='%23f0fdf4' rx='16' stroke='%2316a34a' stroke-width='3'/%3E%3Ccircle cx='175' cy='70' r='35' fill='%2322c55e'/%3E%3Cpath d='M160 70 L170 80 L195 55' fill='none' stroke='%23ffffff' stroke-width='6' stroke-linecap='round'/%3E%3Ctext x='175' y='140' font-family='sans-serif' font-size='20' font-weight='bold' fill='%2315803d' text-anchor='middle'%3Eโอนเงินสำเร็จ (สลิปตัวอย่าง)%3C/text%3E%3Ctext x='175' y='170' font-family='sans-serif' font-size='14' fill='%23166534' text-anchor='middle'%3EBANK TRANSFER SUCCESS%3C/text%3E%3Cline x1='40' y1='195' x2='310' y2='195' stroke='%23bbf7d0' stroke-width='2' stroke-dasharray='6'/%3E%3Ctext x='50' y='235' font-family='sans-serif' font-size='14' fill='%23374151'%3Eโอนเข้าบัญชี:%3C/text%3E%3Ctext x='300' y='235' font-family='sans-serif' font-size='14' font-weight='bold' fill='%23111827' text-anchor='end'%3Eฟาร์มปลาผู้ใหญ่พร%3C/text%3E%3Ctext x='50' y='275' font-family='sans-serif' font-size='14' fill='%23374151'%3Eยอดเงินที่ชำระ:%3C/text%3E%3Ctext x='300' y='275' font-family='sans-serif' font-size='18' font-weight='bold' fill='%2315803d' text-anchor='end'%3E฿5,400.00%3C/text%3E%3Ctext x='50' y='315' font-family='sans-serif' font-size='14' fill='%23374151'%3Eวิธีการ:%3C/text%3E%3Ctext x='300' y='315' font-family='sans-serif' font-size='14' fill='%234b5563' text-anchor='end'%3Eสแกน QR Code หน้างาน%3C/text%3E%3Crect x='40' y='360' width='270' height='50' fill='%23dcfce7' rx='8'/%3E%3Ctext x='175' y='390' font-family='sans-serif' font-size='13' font-weight='bold' fill='%23166534' text-anchor='middle'%3Eตรวจสอบยอดเงินแล้วโดย คนขับรถ%3C/text%3E%3C/svg%3E";

// ลูกค้าตัวอย่าง
const INITIAL_CUSTOMERS = [
  {
    id: 'cust_1',
    name: 'กำนันสมพร บ่อทองคำ',
    phone: '081-234-5678',
    address: '88 หมู่ 4 ต.หนองกี่ อ.กบินทร์บุรี จ.ปราจีนบุรี',
    mapsUrl: 'https://maps.google.com/?q=13.9876,101.9876',
    notes: 'บ่อดิน 10 ไร่ สั่งประจำทุกต้นฤดูฝน ชอบปลาดุกบิ๊กอุยไซส์ 3 นิ้ว',
    totalSpentYear: 68500,
    totalSpentLifetime: 142000,
    orderCount: 8,
    vipTier: 'VIP', // VIP, Regular, Normal
    registeredAt: '2023-05-10'
  },
  {
    id: 'cust_2',
    name: 'เจ๊หน่อย ฟาร์มปลาเนื้อ',
    phone: '089-987-6543',
    address: '15/2 ต.บ้านโพธิ์ อ.เมือง จ.ฉะเชิงเทรา',
    mapsUrl: 'https://maps.google.com/?q=13.6890,101.0720',
    notes: 'ลูกค้าประจำ สั่งปลานิลแปลงเพศและอาหารปลาจำนวนมาก มารับเองหน้าฟาร์มบ่อย',
    totalSpentYear: 52400,
    totalSpentLifetime: 98000,
    orderCount: 6,
    vipTier: 'VIP',
    registeredAt: '2023-08-15'
  },
  {
    id: 'cust_3',
    name: 'ลุงเปี๊ยก สวนเกษตรผสมผสาน',
    phone: '086-555-4321',
    address: '42 หมู่ 7 ต.วังดาล อ.กบินทร์บุรี จ.ปราจีนบุรี',
    mapsUrl: 'https://maps.google.com/?q=14.0210,101.8950',
    notes: 'เลี้ยงในกระชังบก สั่งกระชังและพันธุ์ปลาหมอ + ยาป้องกันเชื้อรา',
    totalSpentYear: 18900,
    totalSpentLifetime: 26500,
    orderCount: 3,
    vipTier: 'Regular',
    registeredAt: '2024-02-01'
  },
  {
    id: 'cust_4',
    name: 'ผู้ช่วยประสิทธิ์ เกษตรอินทรีย์',
    phone: '084-112-2334',
    address: '109 หมู่ 2 ต.เมืองเก่า อ.กบินทร์บุรี จ.ปราจีนบุรี',
    mapsUrl: 'https://maps.google.com/?q=13.9720,101.9540',
    notes: 'ลูกค้าใหม่ เพิ่งขุดบ่อ 2 บ่อ เน้นปลาทับทิมและปลาสวาย',
    totalSpentYear: 8600,
    totalSpentLifetime: 8600,
    orderCount: 1,
    vipTier: 'Normal',
    registeredAt: '2024-06-20'
  },
  {
    id: 'cust_5',
    name: 'คุณวิชัย บ่อตกปลาวันหยุด',
    phone: '087-778-8990',
    address: '99/5 ต.ท่าตูม อ.ศรีมหาโพธิ จ.ปราจีนบุรี',
    mapsUrl: 'https://maps.google.com/?q=13.8820,101.5640',
    notes: 'สั่งปลาไซส์ใหญ่ ปลากดคัง และปลาสวาย ลงบ่อตกปลา',
    totalSpentYear: 74500,
    totalSpentLifetime: 185000,
    orderCount: 11,
    vipTier: 'VIP',
    registeredAt: '2022-11-05'
  }
];

// รายการคำสั่งจองและคิวส่งตัวอย่าง (Orders & Deliveries)
const INITIAL_ORDERS = [
  // 1. ส่งวันนี้ (Today) - อยู่ระหว่างเดินทาง
  {
    id: 'ORD-20240912-001',
    orderNumber: '001',
    customerId: 'cust_1',
    customerName: 'กำนันสมพร บ่อทองคำ',
    customerPhone: '081-234-5678',
    deliveryType: 'delivery', // 'delivery' หรือ 'pickup'
    deliveryAddress: '88 หมู่ 4 ต.หนองกี่ อ.กบินทร์บุรี จ.ปราจีนบุรี',
    mapsUrl: 'https://maps.google.com/?q=13.9876,101.9876',
    deliveryDate: getDateOffset(0), // วันนี้
    deliveryTimeSlot: 'ช่วงเช้า (07:00 - 09:30 น.)',
    status: 'in_transit', // pending, preparing, in_transit, delivered, problem
    paymentStatus: 'deposit_paid', // unpaid, deposit_paid, paid_full
    paymentMethod: 'โอนเงิน', // เงินสด, โอนเงิน
    paymentProof: SAMPLE_SLIP_IMG,
    driverName: 'พี่บุญมี (รถกระบะ ป้ายทะเบียน บธ-4512 ปราจีนบุรี)',
    notes: 'บ่ออยู่ท้ายสวน ก่อนถึงศาลากลางหมู่บ้าน ให้โทรหาก่อนถึง 15 นาที',
    
    // รายการสินค้าที่สั่ง
    items: [
      {
        id: 'item_1_1',
        category: 'พันธุ์ปลา',
        name: 'ปลาดุกบิ๊กอุย',
        size: '3-4 นิ้ว',
        qty: 10000,
        unit: 'ตัว',
        unitPrice: 1.40,
        unitDiscount: 0.15, // ลด 0.15 บาท/ตัว (ไม่มี %)
        netUnitPrice: 1.25,
        totalPrice: 12500
      },
      {
        id: 'item_1_2',
        category: 'อาหารปลา',
        name: 'อาหารปลาดุกเล็ก เบอร์ 1 (20 กก.)',
        size: 'กระสอบ 20 กก.',
        qty: 5,
        unit: 'กระสอบ',
        unitPrice: 480,
        unitDiscount: 20, // ลด 20 บาท/กระสอบ
        netUnitPrice: 460,
        totalPrice: 2300
      },
      {
        id: 'item_1_3',
        category: 'ยารักษาโรคปลา',
        name: 'วิตามินซีเข้มข้น + แร่ธาตุคลายเครียดลูกปลา (1 กก.)',
        size: 'กระปุก 1 กก.',
        qty: 2,
        unit: 'กระปุก',
        unitPrice: 320,
        unitDiscount: 20,
        netUnitPrice: 300,
        totalPrice: 600
      }
    ],
    grossTotal: 17040,      // ราคาก่อนหักส่วนลด (14,000 + 2,400 + 640)
    totalDiscount: 1640,    // รวมส่วนลดทั้งหมด (1,500 + 100 + 40)
    netTotal: 15400,        // ยอดสุทธิ
    deposit: 5000,          // มัดจำแล้ว
    remainingBalance: 10400, // ยอดเก็บหน้างาน
    actualCollected: 0,
    collectedMethod: 'ยังไม่ได้เก็บ',
    createdAt: getDateOffset(-2) + ' 09:30',
    editHistory: [
      {
        id: 'log_001',
        timestamp: getDateOffset(-1) + ' 16:45',
        editorName: 'คุณสมศักดิ์ (ผู้จัดการฟาร์ม)',
        editorRole: 'ผู้จัดการฟาร์ม',
        reason: 'ลูกค้าขอเพิ่มอาหารปลาดุกเล็กจากเดิม 3 กระสอบ เป็น 5 กระสอบ และเพิ่มวิตามินซีบำรุงตับ',
        oldDate: getDateOffset(-1),
        newDate: getDateOffset(0),
        oldTotal: 12500,
        newTotal: 15400,
        changeSummary: 'เพิ่มอาหารปลา 2 กระสอบ, เพิ่มวิตามินซี 2 กระปุก และเลื่อนวันส่งเป็นวันนี้'
      }
    ]
  },

  // 2. ส่งวันนี้ (Today) - จัดส่งสำเร็จ และมีการเคลมปลาเสียหาย
  {
    id: 'ORD-20240912-002',
    orderNumber: '002',
    customerId: 'cust_3',
    customerName: 'ลุงเปี๊ยก สวนเกษตรผสมผสาน',
    customerPhone: '086-555-4321',
    deliveryType: 'delivery',
    deliveryAddress: '42 หมู่ 7 ต.วังดาล อ.กบินทร์บุรี จ.ปราจีนบุรี',
    mapsUrl: 'https://maps.google.com/?q=14.0210,101.8950',
    deliveryDate: getDateOffset(0), // วันนี้
    deliveryTimeSlot: 'ช่วงสาย (10:00 - 12:00 น.)',
    status: 'problem', // มีปัญหาเรื่องการเคลม
    paymentStatus: 'paid_full',
    paymentMethod: 'เงินสด',
    paymentProof: '',
    driverName: 'พี่บุญมี',
    notes: 'ถนนทางเข้าแคบ เลี้ยวขวาตรงต้นโพธิ์ใหญ่',
    items: [
      {
        id: 'item_2_1',
        category: 'พันธุ์ปลา',
        name: 'ปลาหมอชุมพร 1',
        size: '2-3 นิ้ว',
        qty: 3000,
        unit: 'ตัว',
        unitPrice: 1.60,
        unitDiscount: 0.10,
        netUnitPrice: 1.50,
        totalPrice: 4500
      },
      {
        id: 'item_2_2',
        category: 'กระชังเลี้ยงปลา',
        name: 'กระชังบกเย็บสำเร็จ ผ้ายาง+มุ้งไนลอน 2x3x1.2 ม.',
        size: '2x3x1.2 เมตร',
        qty: 1,
        unit: 'หลัง',
        unitPrice: 850,
        unitDiscount: 50,
        netUnitPrice: 800,
        totalPrice: 800
      },
      {
        id: 'item_2_3',
        category: 'ยารักษาโรคปลา',
        name: 'ด่างทับทิมเกรดบ่อปลา ฆ่าเชื้อปรสิต (500 กรัม)',
        size: 'ขวด 500 กรัม',
        qty: 2,
        unit: 'ขวด',
        unitPrice: 85,
        unitDiscount: 5,
        netUnitPrice: 80,
        totalPrice: 160
      }
    ],
    grossTotal: 5820,
    totalDiscount: 360,
    netTotal: 5460,
    deposit: 2000,
    remainingBalance: 3460,
    actualCollected: 3160, // หักเคลมหน้างาน 300 บาท
    collectedMethod: 'เงินสด',
    claimRecord: {
      id: 'CLM-001',
      date: getDateOffset(0),
      damagedItem: 'ปลาหมอชุมพร 1 (2-3 นิ้ว)',
      damagedQty: 200,
      damagedUnit: 'ตัว',
      cause: 'ปลาน็อคน้ำเนื่องจากแดดแรงและอุณหภูมิในถุงสูงระหว่างขนส่ง',
      photoUrl: SAMPLE_CLAIM_IMG,
      resolutionType: 'deduct_balance', // 'deduct_balance', 'replace_next', 'refund'
      resolutionText: 'หักลดยอดจ่ายหน้างานทันที 300 บาท (200 ตัว x 1.50 บ.)',
      approvedBy: 'คุณสมศรี (QC)',
      qcStatus: 'approved' // pending, approved, rejected
    },
    createdAt: getDateOffset(-3) + ' 14:15'
  },

  // 3. วันนี้ (Today) - ลูกค้ามารับเองหน้าฟาร์ม (Farm Pickup)
  {
    id: 'ORD-20240912-003',
    orderNumber: '003',
    customerId: 'cust_2',
    customerName: 'เจ๊หน่อย ฟาร์มปลาเนื้อ',
    customerPhone: '089-987-6543',
    deliveryType: 'pickup', // ลูกค้ามารับเองหน้าฟาร์ม
    deliveryAddress: 'มารับเองที่ ฟาร์มปลาผู้ใหญ่พร (บ่ออนุบาล 2)',
    mapsUrl: '',
    deliveryDate: getDateOffset(0), // วันนี้
    deliveryTimeSlot: 'ช่วงบ่าย (14:00 น.)',
    status: 'preparing', // กำลังเตรียมปลา/อัดออกซิเจน
    paymentStatus: 'deposit_paid',
    paymentMethod: 'โอนเงิน',
    paymentProof: '',
    driverName: 'รับเองหน้าฟาร์ม (ลูกค้านำรถกระบะพร้อมถังมาเอง)',
    notes: 'เตรียมถุงออกซิเจนขนาด 30x40 นิ้ว ให้พร้อม 20 ถุง ลูกค้าจะนำถังออกซิเจนมาเองด้วย',
    items: [
      {
        id: 'item_3_1',
        category: 'พันธุ์ปลา',
        name: 'ปลานิลจิตรลดา',
        size: '3-5 ซม.',
        qty: 15000,
        unit: 'ตัว',
        unitPrice: 1.50,
        unitDiscount: 0.20, // ลด 0.20 บาท/ตัว (สั่งเยอะ)
        netUnitPrice: 1.30,
        totalPrice: 19500
      },
      {
        id: 'item_3_2',
        category: 'อาหารปลา',
        name: 'อาหารไฮเกรด 9006T อนุบาลลูกปลา (10 กก.)',
        size: 'กระสอบ 10 กก.',
        qty: 4,
        unit: 'กระสอบ',
        unitPrice: 620,
        unitDiscount: 30,
        netUnitPrice: 590,
        totalPrice: 2360
      }
    ],
    grossTotal: 24980,
    totalDiscount: 3120,
    netTotal: 21860,
    deposit: 10000,
    remainingBalance: 11860,
    actualCollected: 0,
    collectedMethod: 'ยังไม่ได้เก็บ',
    createdAt: getDateOffset(-1) + ' 11:00'
  },

  // 4. พรุ่งนี้ (Tomorrow) - นัดจัดส่ง
  {
    id: 'ORD-20240913-001',
    orderNumber: '004',
    customerId: 'cust_5',
    customerName: 'คุณวิชัย บ่อตกปลาวันหยุด',
    customerPhone: '087-778-8990',
    deliveryType: 'delivery',
    deliveryAddress: '99/5 ต.ท่าตูม อ.ศรีมหาโพธิ จ.ปราจีนบุรี',
    mapsUrl: 'https://maps.google.com/?q=13.8820,101.5640',
    deliveryDate: getDateOffset(1), // พรุ่งนี้
    deliveryTimeSlot: 'ช่วงเช้า (06:30 น.)',
    status: 'pending',
    paymentStatus: 'deposit_paid',
    paymentMethod: 'โอนเงิน',
    paymentProof: SAMPLE_SLIP_IMG,
    driverName: 'พี่บุญมี',
    notes: 'ส่งเร็วช่วงเช้าตรู่ก่อนแดดออก ปลากดคังต้องอัดออกซิเจนแน่นเป็นพิเศษ',
    items: [
      {
        id: 'item_4_1',
        category: 'พันธุ์ปลา',
        name: 'ปลากดคังน้ำจืด',
        size: '5-7 นิ้ว',
        qty: 2000,
        unit: 'ตัว',
        unitPrice: 4.50,
        unitDiscount: 0.30,
        netUnitPrice: 4.20,
        totalPrice: 8400
      },
      {
        id: 'item_4_2',
        category: 'พันธุ์ปลา',
        name: 'ปลาสวายบ่อ',
        size: '5-6 นิ้ว',
        qty: 3000,
        unit: 'ตัว',
        unitPrice: 2.00,
        unitDiscount: 0.20,
        netUnitPrice: 1.80,
        totalPrice: 5400
      }
    ],
    grossTotal: 15000,
    totalDiscount: 1200,
    netTotal: 13800,
    deposit: 5000,
    remainingBalance: 8800,
    actualCollected: 0,
    collectedMethod: 'ยังไม่ได้เก็บ',
    createdAt: getDateOffset(-2) + ' 16:20'
  },

  // 5. อีก 3 วันข้างหน้า - นัดจัดส่ง
  {
    id: 'ORD-20240915-001',
    orderNumber: '005',
    customerId: 'cust_4',
    customerName: 'ผู้ช่วยประสิทธิ์ เกษตรอินทรีย์',
    customerPhone: '084-112-2334',
    deliveryType: 'delivery',
    deliveryAddress: '109 หมู่ 2 ต.เมืองเก่า อ.กบินทร์บุรี จ.ปราจีนบุรี',
    mapsUrl: 'https://maps.google.com/?q=13.9720,101.9540',
    deliveryDate: getDateOffset(3),
    deliveryTimeSlot: 'ช่วงสาย (09:00 น.)',
    status: 'pending',
    paymentStatus: 'deposit_paid',
    paymentMethod: 'เงินสด',
    paymentProof: '',
    driverName: 'ยังไม่ได้ระบุ',
    notes: 'ลูกค้าเตรียมบ่อดินใหม่ ปูนขาวพร้อมแล้ว',
    items: [
      {
        id: 'item_5_1',
        category: 'พันธุ์ปลา',
        name: 'ปลาทับทิมซีพี',
        size: '2-3 นิ้ว',
        qty: 4000,
        unit: 'ตัว',
        unitPrice: 2.20,
        unitDiscount: 0.15,
        netUnitPrice: 2.05,
        totalPrice: 8200
      },
      {
        id: 'item_5_2',
        category: 'กระชังเลี้ยงปลา',
        name: 'กระชังน้ำมุ้งเขียว 3x4x1.5 ม. พร้อมเชือกร้อย',
        size: '3x4x1.5 เมตร',
        qty: 2,
        unit: 'ปาก',
        unitPrice: 650,
        unitDiscount: 50,
        netUnitPrice: 600,
        totalPrice: 1200
      }
    ],
    grossTotal: 10100,
    totalDiscount: 700,
    netTotal: 9400,
    deposit: 3000,
    remainingBalance: 6400,
    actualCollected: 0,
    collectedMethod: 'ยังไม่ได้เก็บ',
    createdAt: getDateOffset(-1) + ' 15:45'
  },

  // 6. ออเดอร์ในอดีต (เมื่อ 5 วันก่อน) - จัดส่งสำเร็จเรียบร้อย
  {
    id: 'ORD-20240907-001',
    orderNumber: '006',
    customerId: 'cust_1',
    customerName: 'กำนันสมพร บ่อทองคำ',
    customerPhone: '081-234-5678',
    deliveryType: 'delivery',
    deliveryAddress: '88 หมู่ 4 ต.หนองกี่ อ.กบินทร์บุรี จ.ปราจีนบุรี',
    mapsUrl: 'https://maps.google.com/?q=13.9876,101.9876',
    deliveryDate: getDateOffset(-5),
    deliveryTimeSlot: 'ช่วงเช้า (08:00 น.)',
    status: 'delivered',
    paymentStatus: 'paid_full',
    paymentMethod: 'โอนเงิน',
    paymentProof: SAMPLE_SLIP_IMG,
    driverName: 'พี่บุญมี',
    notes: 'ส่งเรียบร้อย ปลานิลแข็งแรงดี ลูกค้าชมว่าปลาไซส์สม่ำเสมอ',
    items: [
      {
        id: 'item_6_1',
        category: 'พันธุ์ปลา',
        name: 'ปลานิลจิตรลดา',
        size: '2-3 ซม.',
        qty: 20000,
        unit: 'ตัว',
        unitPrice: 1.20,
        unitDiscount: 0.15,
        netUnitPrice: 1.05,
        totalPrice: 21000
      },
      {
        id: 'item_6_2',
        category: 'อาหารปลา',
        name: 'อาหารไฮเกรด 9006T อนุบาลลูกปลา (10 กก.)',
        size: 'กระสอบ 10 กก.',
        qty: 6,
        unit: 'กระสอบ',
        unitPrice: 620,
        unitDiscount: 30,
        netUnitPrice: 590,
        totalPrice: 3540
      }
    ],
    grossTotal: 27720,
    totalDiscount: 3180,
    netTotal: 24540,
    deposit: 10000,
    remainingBalance: 14540,
    actualCollected: 14540,
    collectedMethod: 'โอนเงิน',
    createdAt: getDateOffset(-8) + ' 10:00'
  }
];

// รายการเคลมสินค้าทั้งหมด (Claims List)
const INITIAL_CLAIMS = [
  {
    id: 'CLM-001',
    orderId: 'ORD-20240912-002',
    customerName: 'ลุงเปี๊ยก สวนเกษตรผสมผสาน',
    customerPhone: '086-555-4321',
    date: getDateOffset(0),
    damagedItem: 'ปลาหมอชุมพร 1 (2-3 นิ้ว)',
    damagedQty: 200,
    damagedUnit: 'ตัว',
    cause: 'ปลาน็อคน้ำเนื่องจากแดดแรงและอุณหภูมิในถุงสูงระหว่างขนส่ง',
    photoUrl: SAMPLE_CLAIM_IMG,
    resolutionType: 'deduct_balance',
    resolutionText: 'หักลดยอดจ่ายหน้างานทันที 300 บาท (200 ตัว x 1.50 บ.)',
    claimAmount: 300,
    approvedBy: 'คุณสมศรี (QC)',
    qcStatus: 'approved',
    createdAt: getDateOffset(0) + ' 11:30'
  }
];
