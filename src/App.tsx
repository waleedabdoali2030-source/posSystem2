import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, ShoppingBag, Box, BarChart3, QrCode, Settings, LogOut, Plus, Wifi, Bot, Bell, CalendarClock, ChevronRight, History, Receipt
} from 'lucide-react';

// Core Type systems
import { Product, Category, Closure, Operator, ZATCAConfig, ShiftState, CustomPaymentMethod, ShiftSale } from './types';

// Mock presets
import { 
  INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_CLOSURES, INITIAL_OPERATORS, INITIAL_ZATCA_CONFIG 
} from './data';

// Component layout segments 
import POSView from './components/POSView';
import InventoryView from './components/InventoryView';
import SettingsView from './components/SettingsView';
import EODReportView from './components/EODReportView';
import CloseShiftConfirmationModal from './components/CloseShiftConfirmationModal';
import ClosedShiftsView from './components/ClosedShiftsView';
import LastInvoiceView from './components/LastInvoiceView';

export default function App() {
  // Navigation active state
  type NavigationTab = 'pos' | 'inventory' | 'settings' | 'closed_shifts' | 'last_invoice';
  const [activeTab, setActiveTab] = useState<NavigationTab>('pos');

  // App core database contexts 
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [closures, setClosures] = useState<Closure[]>(INITIAL_CLOSURES);
  const [operators, setOperators] = useState<Operator[]>(INITIAL_OPERATORS);
  const [zatcaConfig, setZatcaConfig] = useState<ZATCAConfig>(INITIAL_ZATCA_CONFIG);

  // Shift manager state (Screen 12 Opening float variables)
  const [shiftState, setShiftState] = useState<ShiftState>(() => {
    const saved = localStorage.getItem('shiftState');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved shiftState", e);
      }
    }
    return {
      isInitialized: false,
      terminalId: 'POS-SA-4920',
      dayNumber: 144,
      openingBalance: 100.00,
      cashReceived: 100.00,
      madaSales: 0,
      creditCardSales: 0,
      cashSales: 0,
      walletSales: 0,
      startTime: ''
    };
  });

  // Keep shiftState persisted on updates
  useEffect(() => {
    localStorage.setItem('shiftState', JSON.stringify(shiftState));
  }, [shiftState]);

  // Payment methods state (default standard: Cash and Mada)
  const [paymentMethods, setPaymentMethods] = useState<CustomPaymentMethod[]>(() => {
    const saved = localStorage.getItem('paymentMethods');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved paymentMethods", e);
      }
    }
    return [
      {
        id: 'cash',
        name: 'Cash',
        nameAr: 'نقدي',
        icon: '💵',
        status: 'Active',
        type: 'cash',
        description: 'Accept terminal physical cash payments. Allows cashiers to insert cash Tendered and calculates changes instantly on simplify receipts.'
      },
      {
        id: 'mada',
        name: 'Mada',
        nameAr: 'مدى',
        icon: '💳',
        status: 'Active',
        type: 'mada',
        description: 'Mada Saudi routing network link enabled. Automatically signs and registers B2C simplified receipts on single execution.'
      }
    ];
  });

  // Keep paymentMethods persisted on updates
  useEffect(() => {
    localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  // Real-time clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format options: Weekday Name, DD/MM/YYYY - HH:MM:SS
  const formatClock = (date: Date) => {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = weekdays[date.getDay()];
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${dayName}, ${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
  };

  const formattedClock = formatClock(currentTime);

  // Modal active triggers
  const [selectedClosureForEOD, setSelectedClosureForEOD] = useState<Closure | null>(null);
  const [isShiftCloseModalOpen, setIsShiftCloseModalOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(2);

  // Handle addition of a custom transaction to daily closures on checkout
  const handleAddTransactionFromCart = (
    salesWithVat: number,
    vatAmount: number,
    paymentMethod: string,
    itemsSold?: any[]
  ) => {
    // We update the active day closure (e.g. Day #144) or update current day summary
    setClosures(prev => {
      const activeClose = prev.find(c => c.dayNumber === shiftState.dayNumber);
      if (activeClose) {
        // Increment
        return prev.map(c => 
          c.dayNumber === shiftState.dayNumber 
            ? {
                ...c,
                totalSales: c.totalSales + salesWithVat,
                totalVat: c.totalVat + vatAmount
              }
            : c
        );
      } else {
        // Create active day structure on closures log
        const timestamp = new Date();
        const yyyymmdd = timestamp.toISOString().split('T')[0];
        const newClose: Closure = {
          id: `close-${shiftState.dayNumber}`,
          dayNumber: shiftState.dayNumber,
          date: yyyymmdd,
          closedBy: 'Supervisor Ahmed',
          totalSales: salesWithVat,
          totalVat: vatAmount,
          zatcaStatus: 'Verified'
        };
        return [newClose, ...prev];
      }
    });

    // Append to shiftState's salesList if provided
    if (itemsSold && itemsSold.length > 0) {
      const shiftItems = itemsSold.map(item => {
        const discountMult = 1 - (item.discountPercent || 0) / 100;
        const sub = item.product.price * discountMult * item.quantity;
        const itemVat = sub * 0.15;
        const cat = categories.find(c => c.id === item.product.categoryId);
        return {
          productId: item.product.id,
          name: item.product.name,
          categoryName: cat ? cat.name : 'General Retail',
          quantity: item.quantity,
          price: item.product.price,
          subtotal: sub,
          vat: itemVat,
          total: sub + itemVat
        };
      });

      const newSaleRecord: ShiftSale = {
        id: `INV-${(shiftState.salesList?.length || 0) + 1}`,
        items: shiftItems,
        totalSales: salesWithVat,
        totalVat: vatAmount,
        paymentMethod
      };

      setShiftState(prev => ({
        ...prev,
        salesList: [...(prev.salesList || []), newSaleRecord]
      }));
    }
  };

  // Close shift entirely - open the custom React confirmation workspace modal (replaces browser confirm)
  const handleTriggerShiftClose = () => {
    if (!shiftState.isInitialized) return;
    setIsShiftCloseModalOpen(true);
  };

  // Finalizes register closure, archives and creates rich printable ZATCA closure
  const handleConfirmShiftClose = (
    categorySales: any[],
    paymentSales: any[],
    productSales: any[]
  ) => {
    const totalSalesCollected = shiftState.salesList?.reduce((sum, s) => sum + s.totalSales, 0) || 
      (shiftState.madaSales + shiftState.cashSales + shiftState.creditCardSales + shiftState.walletSales);
    
    const totalVatCalculated = shiftState.salesList?.reduce((sum, s) => sum + s.totalVat, 0) || 
      (totalSalesCollected * 0.15);

    const compiledShiftLog: Closure = {
      id: `close-${shiftState.dayNumber}-${Date.now()}`,
      dayNumber: shiftState.dayNumber,
      date: new Date().toISOString().split('T')[0],
      closedBy: 'Supervisor Ahmed',
      totalSales: totalSalesCollected,
      totalVat: totalVatCalculated,
      zatcaStatus: 'Verified',
      categorySales,
      paymentSales,
      productSales
    };

    // Add closure record
    setClosures(prev => {
      const filtered = prev.filter(c => c.dayNumber !== shiftState.dayNumber);
      return [compiledShiftLog, ...filtered];
    });

    // Pop details to view screen EOD print modal immediately
    setSelectedClosureForEOD(compiledShiftLog);

    // Close Shift Confirm workspace Modal
    setIsShiftCloseModalOpen(false);

    // Reset Shift Initialization
    setShiftState({
      isInitialized: false,
      terminalId: 'POS-SA-4920',
      dayNumber: shiftState.dayNumber + 1,
      openingBalance: 100.00,
      cashReceived: 100.00,
      madaSales: 0,
      creditCardSales: 0,
      cashSales: 0,
      walletSales: 0,
      startTime: '',
      salesList: []
    });

    // Navigate to closures tab
    setActiveTab('closed_shifts');
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 overflow-hidden" id="app-workspace-root">
      
      {/* 1. Left Sidebar Navigation Panel in Glassy Light matching the center of the screen (#f8fafc / white glassy) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#f8fafc]/60 backdrop-blur-xl text-slate-700 shrink-0 border-r border-slate-200/50 overflow-y-auto" id="app-left-sidebar">
        
        {/* Upper store terminal details banner */}
        <div className="p-5 border-b border-slate-200/50 flex items-center gap-3 bg-white/45" id="sidebar-header">
          <div className="p-2 bg-emerald-500 rounded-lg text-white font-black hover:scale-105 transition-transform duration-150 shadow-2xs">
            <Store className="w-5 h-5" id="store-nav-icon" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider text-slate-850 uppercase font-display truncate max-w-[145px]" title={zatcaConfig.storeNameEn || 'Mada POS System'}>
              {zatcaConfig.storeNameEn || 'Mada POS System'}
            </h1>
            <p className="text-[9.5px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              Terminal #POS-492
            </p>
          </div>
        </div>

        {/* Quick sale addition button */}
        <div className="p-4" id="sidebar-quick-action">
          <button 
            onClick={() => setActiveTab('pos')}
            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-2 text-xs font-extrabold shadow-sm transition active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-100" />
            <span>New Sale (F2)</span>
          </button>
        </div>

        {/* Navigation lists */}
        <div className="flex-1 px-3 space-y-1.5" id="sidebar-nav-links">
          <span className="px-3 text-[9px] uppercase tracking-widest font-black text-slate-400 block mb-2">Workspace Main</span>
          
          <button
            onClick={() => setActiveTab('pos')}
            className={`w-full text-left p-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all ${
              activeTab === 'pos' 
                ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500 font-black shadow-3xs' 
                : 'hover:bg-slate-200/40 hover:text-slate-900 text-slate-600'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Point of Sale Terminal</span>
          </button>

          <button
            onClick={() => setActiveTab('last_invoice')}
            className={`w-full text-left p-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all ${
              activeTab === 'last_invoice' 
                ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500 font-black shadow-3xs' 
                : 'hover:bg-slate-200/40 hover:text-slate-900 text-slate-600'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Last Invoice Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full text-left p-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all ${
              activeTab === 'inventory' 
                ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500 font-black shadow-3xs' 
                : 'hover:bg-slate-200/40 hover:text-slate-900 text-slate-600'
            }`}
          >
            <Box className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Inventory SKUs</span>
          </button>

          <button
            onClick={() => setActiveTab('closed_shifts')}
            className={`w-full text-left p-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all ${
              activeTab === 'closed_shifts' 
                ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500 font-black shadow-3xs' 
                : 'hover:bg-slate-200/40 hover:text-slate-900 text-slate-600'
            }`}
          >
            <History className="w-4 h-4 text-sky-505 shrink-0" />
            <span>Closed Shifts Reprint</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full text-left p-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
              activeTab === 'settings' 
                ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500 font-black shadow-3xs' 
                : 'hover:bg-slate-200/40 hover:text-slate-900 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-slate-550 shrink-0" />
              <span>ZATCA & Settings</span>
            </div>
            <span className="bg-emerald-100 border border-emerald-200 text-emerald-700 text-[8.5px] font-bold px-2 py-0.5 rounded uppercase">
              active
            </span>
          </button>
        </div>

        {/* Lower footer profile controls */}
        <div className="p-4 border-t border-slate-200/50 bg-white/45 space-y-3" id="sidebar-footer">
          <div className="flex items-center gap-2.5">
            <span className="p-1 bg-slate-100 rounded-md text-slate-600 border border-slate-200/50">
              <Bot className="w-4 h-4 text-slate-600" />
            </span>
            <div className="min-w-0 flex-1">
              <h5 className="text-[11px] font-bold text-slate-800 max-w-full truncate">Ahmed Al-Shehri</h5>
              <p className="text-[8.5px] text-slate-500 font-semibold mt-0.5">Terminal Supervisor</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-[10px]">
            {shiftState.isInitialized ? (
              <button 
                onClick={handleTriggerShiftClose}
                className="w-full py-1.5 bg-rose-50 hover:bg-rose-100/70 border border-rose-200 text-rose-700 font-bold rounded-md flex items-center justify-center gap-1.5 transition text-[10px] uppercase cursor-pointer"
              >
                <span>Close Real Shift</span>
              </button>
            ) : (
              <span className="text-[10px] text-slate-500 italic">No shift active</span>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Primary Page Container */}
      <div className="flex-1 flex flex-col min-w-0" id="app-primary-main">
        
        {/* Top persistent Navbar matching Screen 1 details */}
        <header className="h-16 bg-white border-b border-slate-100 px-5 flex items-center justify-between shadow-5xs text-slate-700 select-none shrink-0" id="app-top-header">
          <div className="flex items-center gap-5">
            {/* Mobile drawer toggle */}
            <div className="flex md:hidden items-center gap-2">
              <span className="p-2 bg-slate-900 text-white rounded">
                <Store className="w-4 h-4" />
              </span>
              <span className="text-xs font-black uppercase text-slate-900 tracking-tight font-display truncate max-w-[120px]" title={zatcaConfig.storeNameEn || 'Mada System'}>
                {zatcaConfig.storeNameEn || 'Mada System'}
              </span>
            </div>

            {/* Current route display details */}
            <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-slate-400">
              <span className="text-slate-600 font-medium truncate max-w-[200px]" title={zatcaConfig.storeNameEn || 'Olaya Riyadh Outlet'}>
                {zatcaConfig.storeNameEn || 'Olaya Riyadh Outlet'}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-950 font-extrabold uppercase bg-slate-100 px-2 py-0.5 rounded tracking-wider">
                {activeTab === 'pos' && 'Sale Terminal Checkout'}
                {activeTab === 'last_invoice' && 'Last Session Invoice Tracker'}
                {activeTab === 'inventory' && 'SKU Management Hub'}
                {activeTab === 'settings' && 'System Config Desk'}
                {activeTab === 'closed_shifts' && 'Closed Shifts Reprint Archive'}
              </span>
            </div>
          </div>

          {/* Right Status indicators */}
          <div className="flex items-center gap-3.5">
            
            {/* Sync trigger button (Screen 1 details) */}
            <button
              onClick={() => {
                alert('ZATCA E-Invoice Sync successfully established. Active device sequence hashes match core records.');
                setZatcaConfig(prev => ({ ...prev, totalPending: 0 }));
              }}
              className="hidden lg:flex items-center gap-1.5 bg-[#001726] hover:bg-[#00243b] text-emerald-400 border border-[#002740] font-bold text-xs py-1.5 px-3 rounded-lg transition active:scale-97 cursor-pointer"
              id="top-sync-zatca-btn"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sync ZATCA Direct</span>
            </button>

            {/* Real-time Clock Indicator */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-mono bg-slate-50 p-1.5 px-3 border rounded-lg whitespace-nowrap shadow-3xs hover:bg-slate-100 transition-colors">
              <CalendarClock className="w-3.5 h-3.5 text-sky-600 animate-pulse shrink-0" />
              <span className="font-extrabold text-slate-800">{formattedClock}</span>
            </div>

            {/* Notifications icon with counter badge */}
            <button 
              onClick={() => {
                setNotificationCount(0);
                alert('Alerts details: All simplified tax invoices from this tablet pre-cleared successfully by Saudi tax authority servers.');
              }}
              className="p-2 hover:bg-slate-50 border rounded-lg relative text-slate-400 hover:text-slate-800 shrink-0 transition"
              id="bell-alert"
            >
              <Bell className="w-4 h-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 font-mono text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center scale-90">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Shift Balance indicators */}
            <div className="bg-slate-50 border p-1 rounded-lg px-3 hidden lg:block text-right">
              <span className="text-[8px] text-slate-400 font-bold uppercase block leading-none">Register float</span>
              <strong className="text-[12px] font-mono text-slate-900">
                SAR {shiftState.cashReceived.toFixed(2)}
              </strong>
            </div>

          </div>
        </header>

        {/* 3. Embedded tab layouts rendering desk */}
        <main className="flex-1 overflow-y-auto p-5" id="app-viewport-desk">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.16 }}
              className="h-full"
            >
              {activeTab === 'pos' && (
                <POSView 
                  products={products}
                  categories={categories}
                  shiftState={shiftState}
                  setShiftState={setShiftState}
                  zatcaConfig={zatcaConfig}
                  setZatcaConfig={setZatcaConfig}
                  onAddTransaction={handleAddTransactionFromCart}
                  paymentMethods={paymentMethods}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryView 
                  products={products}
                  setProducts={setProducts}
                  categories={categories}
                  setCategories={setCategories}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView 
                  zatcaConfig={zatcaConfig}
                  setZatcaConfig={setZatcaConfig}
                  operators={operators}
                  setOperators={setOperators}
                  paymentMethods={paymentMethods}
                  setPaymentMethods={setPaymentMethods}
                />
              )}

              {activeTab === 'closed_shifts' && (
                <ClosedShiftsView 
                  closures={closures}
                  onPrintEOD={(cls) => setSelectedClosureForEOD(cls)}
                  shiftState={shiftState}
                />
              )}

              {activeTab === 'last_invoice' && (
                <LastInvoiceView 
                  shiftState={shiftState}
                  zatcaConfig={zatcaConfig}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* 4. Small screen mobile/tablet lower footer tabs bar */}
        <footer className="md:hidden h-14 bg-[#001726] text-slate-400 border-t border-[#01253d] flex justify-around select-none shrink-0" id="mobile-navigation-bar">
          <button 
            onClick={() => setActiveTab('pos')}
            className={`flex flex-col items-center justify-center w-full ${activeTab === 'pos' ? 'text-emerald-400 bg-[#002035]' : 'text-slate-400 hover:text-white'}`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-[9px] font-bold mt-1 uppercase">Sale POS</span>
          </button>

          <button 
            onClick={() => setActiveTab('last_invoice')}
            className={`flex flex-col items-center justify-center w-full ${activeTab === 'last_invoice' ? 'text-emerald-400 bg-[#002035]' : 'text-slate-400 hover:text-white'}`}
          >
            <Receipt className="w-4 h-4" />
            <span className="text-[9px] font-bold mt-1 uppercase">Last Inv</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`flex flex-col items-center justify-center w-full ${activeTab === 'inventory' ? 'text-emerald-400 bg-[#002035]' : 'text-slate-400 hover:text-white'}`}
          >
            <Box className="w-4 h-4" />
            <span className="text-[9px] font-bold mt-1 uppercase">Stock</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center w-full ${activeTab === 'settings' ? 'text-emerald-400 bg-[#002035]' : 'text-slate-400 hover:text-white'}`}
          >
            <Settings className="w-4 h-4" />
            <span className="text-[9px] font-bold mt-1 uppercase">Configs</span>
          </button>
        </footer>

      </div>

      {/* ============================================================= */}
      {/* GLOBAL POPUP: EOD Day closure receipt overview dialog (Screen 2) */}
      {/* ============================================================= */}
      <EODReportView 
        closure={selectedClosureForEOD}
        onClose={() => setSelectedClosureForEOD(null)}
      />

      {/* ============================================================= */}
      {/* GLOBAL POPUP: Custom Close Shift Confirmation & Report Breakdown Workspace */}
      {/* ============================================================= */}
      <CloseShiftConfirmationModal
        isOpen={isShiftCloseModalOpen}
        shiftState={shiftState}
        categories={categories}
        onConfirm={handleConfirmShiftClose}
        onClose={() => setIsShiftCloseModalOpen(false)}
      />

    </div>
  );
}
