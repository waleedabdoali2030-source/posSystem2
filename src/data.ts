import { Product, Category, Closure, Operator, ZATCAConfig } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Electronics', arabicName: 'الإلكترونيات', skuCount: 128, status: 'Active', isFastMover: false },
  { id: 'cat-2', name: 'Food & Bev', arabicName: 'الأغذية والمشروبات', skuCount: 542, status: 'Active', isFastMover: true },
  { id: 'cat-3', name: 'Apparel', arabicName: 'الملابس', skuCount: 210, status: 'Active', isFastMover: false },
  { id: 'cat-4', name: 'Home Decor', arabicName: 'ديكور المنزل', skuCount: 89, status: 'Draft', isFastMover: false },
  { id: 'cat-5', name: 'Stationery', arabicName: 'القرطاسية', skuCount: 35, status: 'Active', isFastMover: false }
];

export const INITIAL_PRODUCTS: Product[] = [
  // Food & Bev / Specialty Coffee & Cafe Items
  {
    id: 'prod-1',
    sku: 'FB-COF-001',
    name: 'Premium Arabica Coffee Bean',
    arabicName: 'بن قهوة أرابيكا فاخرة (كيس)',
    price: 85.00,
    categoryId: 'cat-2',
    stock: 45,
    status: 'In Stock',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80'
  },
  {
    id: 'prod-2',
    sku: 'FB-HON-002',
    name: 'Organic Honey Blend',
    arabicName: 'مزيج العسل العضوي الطبيعي',
    price: 120.00,
    categoryId: 'cat-2',
    stock: 12,
    status: 'Low Stock',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80'
  },
  {
    id: 'prod-3',
    sku: 'FB-MUG-003',
    name: 'Artisan Ceramic Mug',
    arabicName: 'كوب سيراميك يدوي الصنع',
    price: 45.00,
    categoryId: 'cat-4',
    stock: 0,
    status: 'Out of Stock',
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=80'
  },
  {
    id: 'prod-4',
    sku: 'FB-ESP-004',
    name: 'Double Shot Espresso',
    arabicName: 'إسبريسو جرعة مزدوجة',
    price: 18.00,
    categoryId: 'cat-2',
    stock: 500,
    status: 'In Stock',
    image: 'https://images.unsplash.com/photo-1510707513156-476725f48c3a?w=400&q=80'
  },
  {
    id: 'prod-5',
    sku: 'FB-TEA-005',
    name: 'Moroccan Royal Mint Tea',
    arabicName: 'شاي النعناع الملكي المغربي',
    price: 15.00,
    categoryId: 'cat-2',
    stock: 120,
    status: 'In Stock',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80'
  },
  {
    id: 'prod-6',
    sku: 'FB-COR-006',
    name: 'French Butter Croissant',
    arabicName: 'كرواسون الزبدة الفرنسية',
    price: 12.00,
    categoryId: 'cat-2',
    stock: 4,
    status: 'Low Stock',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80'
  },
  // Electronics
  {
    id: 'prod-7',
    sku: 'EL-PW-007',
    name: 'Pro Wireless Headphones',
    arabicName: 'سماعات رأس لاسلكية احترافية',
    price: 549.00,
    categoryId: 'cat-1',
    stock: 18,
    status: 'In Stock',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80'
  },
  {
    id: 'prod-8',
    sku: 'EL-MS-008',
    name: 'Smart Fitness Tracker',
    arabicName: 'ساعة تتبع اللياقة الذكية',
    price: 299.00,
    categoryId: 'cat-1',
    stock: 25,
    status: 'In Stock',
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&q=80'
  },
  // Apparel
  {
    id: 'prod-9',
    sku: 'AP-JKT-009',
    name: 'Minimalist Cotton Jacket',
    arabicName: 'جاكيت قطني بسيط',
    price: 189.00,
    categoryId: 'cat-3',
    stock: 8,
    status: 'Low Stock',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80'
  }
];

export const INITIAL_CLOSURES: Closure[] = [
  {
    id: 'close-144',
    dayNumber: 144,
    date: '2026-05-28',
    closedBy: 'Supervisor Ahmed',
    totalSales: 2515.50,
    totalVat: 328.11,
    zatcaStatus: 'Verified'
  },
  {
    id: 'close-143',
    dayNumber: 143,
    date: '2026-05-27',
    closedBy: 'Supervisor Ahmed',
    totalSales: 3102.00,
    totalVat: 404.61,
    zatcaStatus: 'Verified'
  },
  {
    id: 'close-142',
    dayNumber: 142,
    date: '2026-05-26',
    closedBy: 'Sarah Al-Ghamdi',
    totalSales: 1890.25,
    totalVat: 246.55,
    zatcaStatus: 'Verified'
  },
  {
    id: 'close-141',
    dayNumber: 141,
    date: '2026-05-25',
    closedBy: 'Supervisor Ahmed',
    totalSales: 4200.50,
    totalVat: 547.89,
    zatcaStatus: 'Verified'
  }
];

export const INITIAL_OPERATORS: Operator[] = [
  { id: 'op-admin', name: 'admin', password: 'admin', role: 'Admin', activeSales: 13, status: 'Active' },
  { id: 'op-1', name: 'Ahmed Al-Shehri', password: '123', role: 'Supervisor', activeSales: 1248, status: 'Active' },
  { id: 'op-2', name: 'Sarah Al-Ghamdi', password: '123', role: 'Cashier', activeSales: 541, status: 'Active' },
  { id: 'op-3', name: 'Fahad Al-Otaibi', password: '123', role: 'Cashier', activeSales: 89, status: 'Inactive' }
];

export const INITIAL_ZATCA_CONFIG: ZATCAConfig = {
  vatNumber: '310294827400003',
  storeNameEn: 'Al-Modern Retail Co.',
  storeNameAr: 'شركة التجزئة الحديثة',
  isComplianceActive: true,
  apiKey: 'zatca_live_api_sec_6b1558fcca3db9c0',
  csidStatus: 'Certificate Active',
  csidExpiresAt: '2027-05-28',
  totalReported: 1248,
  totalPending: 0,
  onboardingSteps: [
    { title: 'Technical Identification (CSID)', description: 'Cryptographic Stamp Identifier registered with ZATCA portals.', completed: true },
    { title: 'Standard E-Invoice Onboarding', description: 'Generation of B2C simplified receipt templates with XML schema.', completed: true },
    { title: 'Taxpayer Simulation Test Check', description: 'Send and register mock receipts to Phase II clearance endpoints.', completed: true }
  ],
  invoiceHeader: 'Welcome to Al-Modern Express Stores\nCentral District, King Fahd Rd, Riyadh\nTel: +966 11 405 9214',
  invoiceTitle: 'SIMPLIFIED TAX INVOICE - فاتورة ضريبية مبسطة'
};
