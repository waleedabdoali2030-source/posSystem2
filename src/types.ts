export interface Product {
  id: string;
  sku: string;
  name: string;
  arabicName: string;
  price: number;
  categoryId: string;
  stock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  image: string;
}

export interface Category {
  id: string;
  name: string;
  arabicName: string;
  skuCount: number;
  status: 'Active' | 'Draft' | 'Archived';
  isFastMover?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercent: number; // custom discount percentage
}

export interface ShiftItem {
  productId: string;
  name: string;
  categoryName: string;
  quantity: number;
  price: number;
  subtotal: number;
  vat: number;
  total: number;
}

export interface ShiftSale {
  id: string;
  items: ShiftItem[];
  totalSales: number;
  totalVat: number;
  paymentMethod: string;
}

export interface Closure {
  id: string;
  dayNumber: number;
  date: string;
  closedBy: string;
  totalSales: number; // Includes VAT
  totalVat: number; // 15% VAT
  zatcaStatus: 'Verified' | 'Pending' | 'Failed';
  categorySales?: { name: string; count: number; volume: number }[];
  paymentSales?: { name: string; volume: number }[];
  productSales?: { name: string; quantity: number; volume: number }[];
}

export interface PaymentSummary {
  mada: number;
  creditCard: number;
  cash: number;
  wallet: number;
}

export interface ShiftState {
  isInitialized: boolean;
  terminalId: string;
  dayNumber: number;
  openingBalance: number;
  cashReceived: number;
  madaSales: number;
  creditCardSales: number;
  cashSales: number;
  walletSales: number;
  startTime: string;
  salesList?: ShiftSale[];
}

export interface ZATCAConfig {
  vatNumber: string;
  storeNameEn: string;
  storeNameAr: string;
  isComplianceActive: boolean;
  apiKey: string;
  csidStatus: 'Certificate Active' | 'Pending Activation' | 'Expired';
  csidExpiresAt: string;
  totalReported: number;
  totalPending: number;
  onboardingSteps: {
    title: string;
    description: string;
    completed: boolean;
  }[];
  invoiceHeader?: string;
  invoiceTitle?: string;
}

export interface Operator {
  id: string;
  name: string;
  password?: string;
  role: 'Supervisor' | 'Cashier' | 'Admin';
  activeSales: number;
  status: 'Active' | 'Inactive';
}

export interface CustomPaymentMethod {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  status: 'Active' | 'Inactive';
  description?: string;
  type: 'cash' | 'mada' | 'creditCard' | 'wallet' | 'custom';
}

