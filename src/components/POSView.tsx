import React, { useState, useEffect } from 'react';
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, Wifi, 
  CheckCircle2, AlertCircle, X, Printer, Mail, 
  MessageSquare, CreditCard, DollarSign, Tag, Check, ArrowRight
} from 'lucide-react';
import { Product, Category, CartItem, ShiftState, ZATCAConfig, CustomPaymentMethod } from '../types';
import { printThermalElement } from '../utils/print';

interface POSViewProps {
  products: Product[];
  categories: Category[];
  shiftState: ShiftState;
  setShiftState: React.Dispatch<React.SetStateAction<ShiftState>>;
  zatcaConfig: ZATCAConfig;
  setZatcaConfig: React.Dispatch<React.SetStateAction<ZATCAConfig>>;
  onAddTransaction: (salesWithVat: number, vatAmount: number, paymentMethod: string, itemsSold?: CartItem[]) => void;
  paymentMethods: CustomPaymentMethod[];
  currentUser?: any;
}

export default function POSView({
  products,
  categories,
  shiftState,
  setShiftState,
  zatcaConfig,
  setZatcaConfig,
  onAddTransaction,
  paymentMethods,
  currentUser
}: POSViewProps) {
  // POS Search/Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Custom Keypad / Discount Actions
  const [activeCartIndex, setActiveCartIndex] = useState<number | null>(null);
  const [currentKeypadInput, setCurrentKeypadInput] = useState('');
  const [keypadMode, setKeypadMode] = useState<'discount' | 'quantity'>('discount');

  // Popup Modals
  const [showShiftInitModal, setShowShiftInitModal] = useState(!shiftState.isInitialized);
  const [openingBalanceInput, setOpeningBalanceInput] = useState('100.00');
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cashAmountPaid, setCashAmountPaid] = useState('');
  const [activePaymentMethod, setActivePaymentMethod] = useState<string>('mada');

  // Receipt Modal
  const [lastReceipt, setLastReceipt] = useState<{
    invoiceNo: string;
    date: string;
    time: string;
    items: CartItem[];
    subtotal: number;
    vat: number;
    total: number;
    paymentMethod: string;
    cashPaid?: number;
    changeDue?: number;
  } | null>(null);

  // Shift initialization check on mount
  useEffect(() => {
    if (!shiftState.isInitialized) {
      setShowShiftInitModal(true);
    }
  }, [shiftState.isInitialized]);

  // Handle shift initialization
  const handleOpenShift = () => {
    const openingValue = parseFloat(openingBalanceInput) || 0;
    const now = new Date();
    setShiftState({
      isInitialized: true,
      terminalId: 'POS-SA-4920',
      dayNumber: shiftState.dayNumber,
      openingBalance: openingValue,
      cashReceived: openingValue,
      madaSales: 0,
      creditCardSales: 0,
      cashSales: 0,
      walletSales: 0,
      startTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setShowShiftInitModal(false);
  };

  // Keyboard shortcut listener (e.g. F12 for quick Mada Pay)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        if (cart.length > 0 && shiftState.isInitialized) {
          triggerQuickMadaPay();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, shiftState.isInitialized]);

  // Add Item to Cart
  const handleAddToCart = (product: Product) => {
    if (product.stock === 0 && product.status === 'Out of Stock') return;
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1, discountPercent: 0 }];
    });
    // Set auto active focus
    setActiveCartIndex(cart.length);
    setKeypadMode('discount');
    setCurrentKeypadInput('');
  };

  // Update Cart quantities
  const updateCartQuantity = (index: number, change: number) => {
    setCart(prev => {
      return prev.map((item, idx) => {
        if (idx === index) {
          const newQty = item.quantity + change;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  // Remove from Cart
  const handleRemoveFromCart = (index: number) => {
    setCart(prev => prev.filter((_, idx) => idx !== index));
    if (activeCartIndex === index) {
      setActiveCartIndex(null);
    }
  };

  // Calculate Totals
  const calculateCartSubtotal = () => {
    return cart.reduce((sum, item) => {
      const discountedPrice = item.product.price * (1 - item.discountPercent / 100);
      return sum + (discountedPrice * item.quantity);
    }, 0);
  };

  const subtotal = calculateCartSubtotal();
  const vatRate = 0.15; // Saudi ZATCA standard 15%
  const vatAmount = subtotal * vatRate;
  const grandTotal = subtotal + vatAmount;

  // Keypad processing (virtual keypad on screen)
  const handleKeypadPress = (val: string) => {
    if (activeCartIndex === null || activeCartIndex >= cart.length) return;

    if (val === 'C') {
      setCurrentKeypadInput('');
      setCart(prev => prev.map((item, idx) => 
        idx === activeCartIndex 
          ? { ...item, [keypadMode === 'quantity' ? 'quantity' : 'discountPercent']: 0 } 
          : item
      ));
      return;
    }

    if (val === 'backspace') {
      const newInput = currentKeypadInput.slice(0, -1);
      setCurrentKeypadInput(newInput);
      const numericVal = parseFloat(newInput) || 0;
      setCart(prev => prev.map((item, idx) => {
        if (idx === activeCartIndex) {
          if (keypadMode === 'quantity') {
            return { ...item, quantity: Math.max(1, Math.round(numericVal)) };
          } else {
            return { ...item, discountPercent: numericVal };
          }
        }
        return item;
      }));
      return;
    }

    if (val === 'enter') {
      setCurrentKeypadInput('');
      return;
    }

    const newInput = currentKeypadInput + val;
    const numericVal = parseFloat(newInput) || 0;

    if (keypadMode === 'discount' && numericVal > 100) return; // limit to 100% discount
    if (keypadMode === 'quantity' && numericVal > 999) return; // limit quantity

    setCurrentKeypadInput(newInput);

    setCart(prev => prev.map((item, idx) => {
      if (idx === activeCartIndex) {
        if (keypadMode === 'quantity') {
          return { ...item, quantity: Math.max(1, Math.round(numericVal)) };
        } else {
          return { ...item, discountPercent: numericVal };
        }
      }
      return item;
    }));
  };

  // Trigger Quick Mada Payment (F12)
  const triggerQuickMadaPay = () => {
    const madaMethod = paymentMethods.find(m => m.type === 'mada' && m.status === 'Active') || paymentMethods.find(m => m.type === 'mada') || { id: 'mada' };
    setActivePaymentMethod(madaMethod.id);
    handleFinalizeTransaction(madaMethod.id, grandTotal, 0);
  };

  // Trigger manual payment options popup
  const handleOpenPaymentModal = () => {
    if (cart.length === 0) return;
    setCashAmountPaid((grandTotal).toFixed(2));
    const activeFirst = paymentMethods.find(m => m.status === 'Active') || { id: 'cash' };
    setActivePaymentMethod(activeFirst.id);
    setShowPaymentModal(true);
  };

  // Finalize transaction and generate ZATCA compliant invoice
  const handleFinalizeTransaction = (
    method: string,
    paidCash: number,
    changeDue: number
  ) => {
    const timestamp = new Date();
    const invoiceNo = `INV-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const dateStr = timestamp.toLocaleDateString('en-GB'); 
    const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const selectedMethod = paymentMethods.find(m => m.id === method);
    const mType = selectedMethod ? selectedMethod.type : method;

    // 1. Update Shift Stats
    setShiftState(prev => {
      const updated = { ...prev };
      if (mType === 'mada') updated.madaSales += grandTotal;
      else if (mType === 'cash') updated.cashSales += grandTotal;
      else if (mType === 'creditCard') updated.creditCardSales += grandTotal;
      else if (mType === 'wallet') updated.walletSales += grandTotal;
      else updated.madaSales += grandTotal; // fallback
      
      updated.cashReceived = prev.openingBalance + updated.cashSales;
      return updated;
    });

    // 2. Increment ZATCA reported metrics
    setZatcaConfig(prev => ({
      ...prev,
      totalReported: prev.totalReported + 1
    }));

    // 3. Pass values back up to manage Day closings list
    onAddTransaction(grandTotal, vatAmount, method, [...cart]);

    // 4. Save to last receipt state and open Receipt View Modal
    setLastReceipt({
      invoiceNo,
      date: dateStr,
      time: timeStr,
      items: [...cart],
      subtotal,
      vat: vatAmount,
      total: grandTotal,
      paymentMethod: selectedMethod ? selectedMethod.name.toUpperCase() : method.toUpperCase(),
      cashPaid: mType === 'cash' ? paidCash : undefined,
      changeDue: mType === 'cash' ? changeDue : undefined
    });

    // Reset checkout states
    setCart([]);
    setActiveCartIndex(null);
    setCurrentKeypadInput('');
    setShowPaymentModal(false);
  };

  // Calculate change for Cash payment
  const numericPaid = parseFloat(cashAmountPaid) || 0;
  const changeDue = Math.max(0, numericPaid - grandTotal);

  // Filter products by category and search term
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategoryId === 'all' || product.categoryId === selectedCategoryId;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.arabicName.includes(searchQuery) ||
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-full flex-col lg:flex-row gap-4 animate-fade-in" id="pos-terminal-root">
      
      {/* 1. Left Product Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl shadow-xs border border-slate-100 overflow-hidden" id="pos-left-pane">
        
        {/* Search and Category Quickfilters */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50" id="pos-header-search">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-xs transition-focus focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-transparent">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Search SKU, name (العربية / English)..." 
              className="w-full text-sm outline-hidden text-slate-700 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="pos-search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-0.5 hover:bg-slate-100 rounded-full">
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>

          {/* Categories Horizontal Banner */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin" id="pos-category-filters">
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategoryId === 'all' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              id="cat-filter-all"
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedCategoryId === cat.id 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                id={`cat-filter-${cat.id}`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1 rounded-sm ${selectedCategoryId === cat.id ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>
                  {cat.skuCount}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 content-start" id="pos-product-grid-container">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-16 text-center" id="pos-no-items">
              <AlertCircle className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-slate-500 font-medium font-display text-sm">No products found matching filters</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategoryId('all'); }}
                className="mt-2 text-xs text-emerald-600 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" id="pos-grid">
              {filteredProducts.map((prod) => {
                const isOutOfStock = prod.stock === 0 || prod.status === 'Out of Stock';
                const isLowStock = prod.stock > 0 && prod.stock <= 15;
                return (
                  <button
                    key={prod.id}
                    disabled={isOutOfStock}
                    onClick={() => handleAddToCart(prod)}
                    className={`group text-left flex flex-col bg-white border rounded-xl overflow-hidden shadow-2xs hover:shadow-md hover:border-slate-300 transition duration-150 relative cursor-pointer active:scale-97 ${
                      isOutOfStock ? 'opacity-55 cursor-not-allowed border-slate-100' : 'border-slate-200'
                    }`}
                    id={`prod-card-${prod.id}`}
                  >
                    {/* Item Image with Fallback/Unsplash */}
                    <div className="aspect-4/3 w-full bg-slate-100 overflow-hidden relative">
                      <img 
                        src={prod.image} 
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                      {/* Floating Stock Indication Badges */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-3xs flex items-center justify-center">
                          <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                            SOLD OUT
                          </span>
                        </div>
                      )}
                      {!isOutOfStock && isLowStock && (
                        <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                          ONLY {prod.stock} LEFT
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Name - English */}
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1 leading-tight group-hover:text-slate-950 transition-colors">
                          {prod.name}
                        </h4>
                        {/* Name - Arabic */}
                        <div className="text-[10px] mt-0.5 text-slate-400 font-medium line-clamp-1 text-right" dir="rtl">
                          {prod.arabicName}
                        </div>
                        {/* SKU indicator */}
                        <div className="text-[9px] text-slate-350 font-mono mt-1">
                          {prod.sku}
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-slate-50">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">SAR</span>
                        <span className="text-sm font-black text-slate-950">{prod.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Right Cart & Keypad Panel in Matching Glassy Light Slate theme matching #f8fafc */}
      <div className="w-full lg:w-96 shrink-0 flex flex-col bg-[#f8fafc]/55 backdrop-blur-xl text-slate-800 rounded-xl shadow-lg border border-slate-200/60 overflow-hidden" id="pos-right-pane">
        
        {/* Cart Header Panel */}
        <div className="p-4 border-b border-slate-200/50 flex items-center justify-between" id="pos-cart-header">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-slate-100 rounded-lg text-emerald-600 shadow-3xs border border-slate-200/10">
              <ShoppingCart className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-850 tracking-tight">Active Sale</h3>
              <p className="text-[10px] text-slate-450 font-mono">Terminal {shiftState.terminalId || '01-TX'}</p>
            </div>
          </div>
          <button 
            onClick={() => setCart([])}
            disabled={cart.length === 0}
            className="text-[11px] text-rose-650 font-bold hover:text-rose-500 disabled:opacity-40 transition-colors"
          >
            Clear Cart
          </button>
        </div>

        {/* Dynamic Cart items lists */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px]" id="pos-cart-list">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12" id="cart-item-empty">
              <div className="p-3 bg-slate-100/80 rounded-full text-slate-400 mb-2 border border-slate-200/30">
                <ShoppingCart className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 font-semibold">Cart is currently empty</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Select items from the list to begin checkout</p>
            </div>
          ) : (
            cart.map((item, index) => {
              const basePrice = item.product.price;
              const hasDiscount = item.discountPercent > 0;
              const discountedUnitPrice = basePrice * (1 - item.discountPercent / 100);
              const totalPrice = discountedUnitPrice * item.quantity;

              return (
                <div 
                  key={item.product.id}
                  className="p-2.5 rounded-lg border transition-all bg-white hover:bg-slate-50 border-slate-200 relative group shadow-3xs"
                  id={`cart-row-${index}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-8">
                      <h5 className="text-xs font-bold text-slate-800 line-clamp-1">{item.product.name}</h5>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.product.sku}</p>
                      
                      {hasDiscount && (
                        <div className="inline-flex items-center gap-1 mt-1 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded font-mono">
                          <Tag className="w-2.5 h-2.5" />
                          <span>-{item.discountPercent}% OFF</span>
                        </div>
                      )}
                    </div>
                    {/* Delete item button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromCart(index);
                      }}
                      className="absolute top-2.5 right-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition-all cursor-pointer"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quantity, Discount, and Prices */}
                  <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      {/* Quantity Selector */}
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md">
                        <button 
                          onClick={(e) => { e.stopPropagation(); updateCartQuantity(index, -1); }}
                          className="p-1 px-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                          title="Decrease Quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-1.5 text-xs font-mono font-bold text-slate-800">{item.quantity}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); updateCartQuantity(index, 1); }}
                          className="p-1 px-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                          title="Increase Quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Small Discount Input */}
                      <div 
                        className="flex items-center bg-slate-50 border border-slate-200 rounded-md px-1" 
                        onClick={(e) => e.stopPropagation()}
                        title="Discount percent"
                      >
                        <Tag className="w-2.5 h-2.5 text-emerald-600 ml-1 shrink-0" />
                        <input 
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                            setCart(prev => prev.map((it, idx) => idx === index ? { ...it, discountPercent: val } : it));
                          }}
                          className="w-10 text-center bg-transparent border-0 text-xs font-black text-emerald-600 focus:outline-hidden focus:ring-0 p-0.5 pr-0 font-mono"
                        />
                        <span className="text-[10px] text-emerald-600 pr-1.5 font-bold font-mono">%</span>
                      </div>
                    </div>

                    <div className="text-right">
                      {hasDiscount && (
                        <span className="text-[10px] line-through text-slate-400 mr-2">
                          {(basePrice * item.quantity).toFixed(2)}
                        </span>
                      )}
                      <span className="text-sm font-black text-slate-800 font-mono">
                        {totalPrice.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-500 ml-1">SAR</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Totals Panel & Actions */}
        <div className="bg-white/80 border-t border-slate-200 p-4 space-y-4" id="pos-interactive-numpad-pane">
          {/* Pricing breakdown summary */}
          <div className="space-y-1.5 pt-1" id="cart-summary-pricing">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-800 font-mono">{subtotal.toFixed(2)} SAR</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                Tax Standard (VAT 15%)
                <span className="text-[10px] bg-slate-100 border border-slate-200 px-1 rounded text-slate-600 font-bold">GCC</span>
              </span>
              <span className="font-semibold text-slate-800 font-mono">{vatAmount.toFixed(2)} SAR</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="text-sm font-black text-slate-700">TOTAL DUE</span>
              <div className="text-right">
                <span className="text-xl font-black font-mono text-emerald-600">{grandTotal.toFixed(2)}</span>
                <span className="text-xs text-emerald-600 ml-1 font-black">SAR</span>
              </div>
            </div>
          </div>

          {/* Core Payments Trigger Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1" id="cart-actions-checkout">
            <button
              disabled={cart.length === 0 || !shiftState.isInitialized}
              onClick={triggerQuickMadaPay}
              className="py-3 px-2 bg-slate-100/80 hover:bg-slate-200/90 border border-slate-200 transition active:scale-98 text-slate-800 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-3xs"
              id="btn-quick-mada"
              title="Shortcut: F12"
            >
              <div className="flex items-center gap-1.5 text-xs font-black text-sky-600 uppercase">
                <CreditCard className="w-3.5 h-3.5" />
                <span>MADA PAY</span>
              </div>
              <span className="text-[9px] text-slate-500 font-medium">⚡ QUICK F12</span>
            </button>
            <button
              disabled={cart.length === 0 || !shiftState.isInitialized}
              onClick={handleOpenPaymentModal}
              className="py-3 px-2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-650 transition active:scale-98 text-white rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              id="btn-pay-now"
            >
              <div className="flex items-center gap-1.5 text-xs font-black uppercase">
                <span>PAY NOW</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] text-emerald-100">SELECT METHOD</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL DIALOGS ================= */}

      {/* 1. Shift Initialization Opening Balance Modal (Screen 12) */}
      {showShiftInitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4" id="shift-init-modal-overlay">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in" id="shift-init-modal-content">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                <div>
                  <h3 className="text-md font-bold">Shift Initialization</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Terminal ID: POS-SA-4920</p>
                </div>
              </div>
              <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono">
                OFFLINE MODE
              </span>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Before accepting tax-compliant invoices and customer card transactions, input the opening physical drawer cash float.
              </p>

              <div>
                <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                  Opening Float (SAR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono text-sm">
                    SAR
                  </span>
                  <input
                    type="text"
                    className="w-full text-right bg-slate-950 border border-slate-800 rounded-lg py-3 px-3.5 pr-4 text-emerald-400 text-xl font-mono font-bold tracking-tight focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    value={openingBalanceInput}
                    onChange={(e) => setOpeningBalanceInput(e.target.value)}
                    id="opening-balance-input"
                  />
                </div>
              </div>

              {/* Simple virtual numeric keys for Opening Float */}
              <div className="grid grid-cols-3 gap-1" id="balance-keypad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'C'].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      if (num === 'C') {
                        setOpeningBalanceInput('100.00');
                      } else if (num === '.') {
                        if (!openingBalanceInput.includes('.')) {
                          setOpeningBalanceInput(prev => prev + '.');
                        }
                      } else {
                        setOpeningBalanceInput(prev => {
                          if (prev === '0' || prev === '100.00' || prev === '0.00') return num;
                          return prev + num;
                        });
                      }
                    }}
                    type="button"
                    className="p-2 border border-slate-800 bg-slate-950 hover:bg-slate-850 rounded text-slate-300 font-mono text-xs font-bold"
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button
                onClick={handleOpenShift}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-black text-xs text-white uppercase rounded-lg shadow-md transition transform active:scale-98 tracking-wider mt-4"
                id="btn-open-shift"
              >
                Open Day & Start Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive Payment Methods Selection Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4" id="payment-modal-overlay">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in" id="payment-modal-content">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-sm tracking-tight">Checkout Payment Gateway</span>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Invoice Standard Due</span>
                  <p className="text-xl font-black font-mono text-white mt-0.5">{grandTotal.toFixed(2)} SAR</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">VAT (15%) Included</span>
                  <p className="text-xs font-bold font-mono text-slate-350">{vatAmount.toFixed(2)} SAR</p>
                </div>
              </div>

              {/* Payment Methods Selections Grid */}
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                  Select payment route
                </label>
                <div className="grid grid-cols-2 gap-2" id="payment-methods-select-grid">
                  {paymentMethods.filter(m => m.status === 'Active').map(method => {
                    const isActive = activePaymentMethod === method.id;
                    
                    // Choose colors based on payment type
                    let activeStyle = '';
                    if (method.type === 'cash') {
                      activeStyle = 'bg-emerald-955/50 border-emerald-500 text-emerald-400';
                    } else if (method.type === 'mada') {
                      activeStyle = 'bg-sky-955/50 border-sky-500 text-sky-400';
                    } else if (method.type === 'creditCard') {
                      activeStyle = 'bg-violet-955/50 border-violet-500 text-violet-400';
                    } else if (method.type === 'wallet') {
                      activeStyle = 'bg-amber-955/50 border-amber-500 text-amber-400';
                    } else {
                      activeStyle = 'bg-fuchsia-955/50 border-fuchsia-500 text-fuchsia-400';
                    }
                    
                    return (
                      <button
                        key={method.id}
                        onClick={() => setActivePaymentMethod(method.id)}
                        className={`p-3 border rounded-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          isActive 
                            ? activeStyle 
                            : 'bg-slate-955 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-100'
                        }`}
                      >
                        <span className="text-lg leading-none">{method.icon || '💳'}</span>
                        <span className="text-[10px] font-black uppercase tracking-wider">{method.name}</span>
                        {method.nameAr && (
                          <span className="text-[8px] opacity-75 font-medium leading-none mt-0.5" dir="rtl">
                            {method.nameAr}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Input Drawer If Cash Is Selected */}
              {paymentMethods.find(m => m.id === activePaymentMethod)?.type === 'cash' && (
                <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-lg space-y-3 shadow-inner animate-fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Amount Tendered</span>
                    <span className="text-amber-400 font-mono font-bold text-xs">SAR {(parseFloat(cashAmountPaid) || 0).toFixed(2)}</span>
                  </div>
                  
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono text-sm">SAR</span>
                    <input
                      type="text"
                      className="w-full text-right bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 pr-4 text-emerald-400 text-md font-mono font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      value={cashAmountPaid}
                      onChange={(e) => setCashAmountPaid(e.target.value)}
                    />
                  </div>

                  {/* Quick cash options */}
                  <div className="flex gap-1.5 justify-end">
                    {[grandTotal, 10, 50, 100, 200, 500].map((val) => {
                      const displayVal = typeof val === 'number' ? Math.ceil(val) : val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            if (val === grandTotal) {
                              setCashAmountPaid((grandTotal).toFixed(2));
                            } else {
                              setCashAmountPaid((val).toFixed(2));
                            }
                          }}
                          className="px-2 py-1 bg-slate-850 text-slate-300 font-mono text-[10px] font-bold rounded border border-slate-800 hover:text-white hover:bg-slate-800 active:scale-95"
                        >
                          {val === grandTotal ? 'Exact' : displayVal}
                        </button>
                      );
                    })}
                  </div>

                  {/* Change Indicator */}
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800/80">
                    <span className="text-slate-400">Change Due</span>
                    <span className="font-mono text-amber-400 font-bold">{changeDue.toFixed(2)} SAR</span>
                  </div>
                </div>
              )}

              {/* Compliance & Verification Statement */}
              <div className="flex items-start gap-2 bg-slate-950/55 p-3 rounded border border-slate-850">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.2" />
                <p className="text-[10px] text-slate-400 leading-normal">
                  Invoice XML schema validated locally. Real-time cryptographic signatures and simplified receipt hashes will be reported automatically to <strong>ZATCA phase II clearance.</strong>
                </p>
              </div>

              {/* Primary action */}
              <button
                onClick={() => handleFinalizeTransaction(activePaymentMethod, numericPaid, changeDue)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 transition font-black text-xs text-white uppercase rounded-xl tracking-wider active:scale-98 shadow-md"
              >
                Finalize & Generate Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ZATCA Simplified Receipt & Tax Invoice Preview Modal (Screen 6) */}
      {lastReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" id="receipt-modal-overlay">
          <div className="bg-white text-slate-900 rounded-xl max-w-sm w-full overflow-hidden shadow-2xl animate-fade-in my-8" id="receipt-modal-content">
            
            {/* Header toolbar */}
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-slate-600">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ZATCA Verified Receipt
              </span>
              <button 
                onClick={() => setLastReceipt(null)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Area */}
            <div className="p-4 font-mono text-[9px] leading-snug text-slate-800 max-h-[82vh] overflow-y-auto scrollbar-none" id="printable-receipt-area">
              
              {/* Receipt Logo & Store Info */}
              <div className="text-center space-y-1">
                {/* Auto-added Company VAT Registration Number (15 digits) at the very top */}
                <div className="bg-slate-50 border border-slate-200 py-1.5 px-2 rounded text-center my-1">
                  <p className="text-[7.5px] text-slate-500 font-extrabold tracking-tight uppercase">VAT REGISTRATION NUMBER</p>
                  <p className="text-[9.5px] text-emerald-700 font-black tracking-widest leading-none mt-0.5">
                    {zatcaConfig.vatNumber ? zatcaConfig.vatNumber.replace(/(\d{3})(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4 $5') : '310 294 827 400 003'}
                  </p>
                </div>

                <h1 className="text-[11px] font-black tracking-tight text-slate-950 uppercase">{zatcaConfig.storeNameEn}</h1>
                <h2 className="text-[10px] font-extrabold text-slate-900" dir="rtl">{zatcaConfig.storeNameAr}</h2>
                
                {/* Multi-line Invoice Header */}
                {zatcaConfig.invoiceHeader ? (
                  <p className="text-[7.5px] text-slate-550 whitespace-pre-wrap leading-relaxed border-t border-b border-dotted border-slate-250 py-1.5 my-1.5">
                    {zatcaConfig.invoiceHeader}
                  </p>
                ) : (
                  <p className="text-[8px] text-slate-500">Riyadh Branch, Saudi Arabia</p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-slate-300 my-2" />

              {/* Invoice Metadata (Grid to save space) */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-slate-600 text-[8.5px]">
                <div className="flex justify-between">
                  <span>Inv No:</span>
                  <span className="font-extrabold text-slate-900">{lastReceipt.invoiceNo.replace('INV-', '')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-medium text-slate-900">{lastReceipt.date}</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span>Type:</span>
                  <span className="font-black text-slate-950 uppercase">{zatcaConfig.invoiceTitle || 'SIMPLIFIED TAX INVOICE'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span className="text-slate-900">{lastReceipt.time}</span>
                </div>
                <div className="flex justify-between">
                  <span>Terminal:</span>
                  <span className="text-slate-900">{shiftState.terminalId}</span>
                </div>
                <div className="flex justify-between col-span-2 border-b border-dashed border-slate-200 pb-1.5">
                  <span>Operator:</span>
                  <span className="text-slate-900">{currentUser?.name || 'Ahmed Al-Shehri'}</span>
                </div>
              </div>

              {/* Items listing table */}
              <div className="mt-2.5">
                <table className="w-full text-right border-collapse text-[8.5px]">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-905 font-black">
                      <th className="text-left py-1 font-bold">Item Description / الوصف</th>
                      <th className="text-center py-1 font-bold w-8">Qty</th>
                      <th className="text-right py-1 font-bold w-16">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastReceipt.items.map((item, id) => {
                      const basePrice = item.product.price;
                      const unitPriceWithDiscount = basePrice * (1 - item.discountPercent / 100);
                      const lineTotal = unitPriceWithDiscount * item.quantity;
                      return (
                        <tr key={id} className="border-b border-slate-100 text-slate-750">
                          <td className="text-left py-1 pr-1.5 leading-tight">
                            <div className="font-bold text-slate-900">{item.product.name}</div>
                            <div className="text-[7.5px] text-slate-400 font-normal mt-0.5" dir="rtl">{item.product.arabicName}</div>
                            {item.discountPercent > 0 && (
                              <div className="text-[7px] text-emerald-600 font-bold">
                                Discount: {item.discountPercent}% OFF
                              </div>
                            )}
                          </td>
                          <td className="text-center py-1 font-bold text-slate-900 align-middle">{item.quantity}</td>
                          <td className="text-right py-1 font-bold text-slate-900 align-middle">{(lineTotal).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-slate-300 my-2" />

              {/* Summary Totals block */}
              <div className="space-y-1 text-right font-medium text-[8.5px]">
                <div className="flex justify-between">
                  <span>Subtotal (Excl. VAT):</span>
                  <span className="font-mono text-slate-900">{lastReceipt.subtotal.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (15%):</span>
                  <span className="font-mono text-slate-900">{lastReceipt.vat.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between font-black text-[10px] text-slate-950 pt-1 border-t border-slate-200">
                  <span>GRAND TOTAL (INC VAT):</span>
                  <span className="font-mono">{lastReceipt.total.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between text-slate-500 pt-1">
                  <span>Payment Method:</span>
                  <span className="font-bold text-emerald-600 uppercase">{lastReceipt.paymentMethod}</span>
                </div>

                {lastReceipt.cashPaid !== undefined && lastReceipt.cashPaid > 0 && (
                  <>
                    <div className="flex justify-between text-slate-500">
                      <span>Cash Tendered:</span>
                      <span className="font-mono">{lastReceipt.cashPaid.toFixed(2)} SAR</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Change:</span>
                      <span className="font-mono text-slate-900">{lastReceipt.changeDue?.toFixed(2)} SAR</span>
                    </div>
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-slate-300 my-2" />

              {/* ZATCA Cryptographical Stamp Verification QR Code */}
              <div className="flex flex-col items-center justify-center space-y-1 mt-2.5">
                {/* SVG simulated QR Code with real scanning parameters */}
                <div className="p-1.5 border border-slate-200 rounded-md bg-white shadow-3xs">
                  <svg className="w-16 h-16 text-slate-950" viewBox="0 0 100 100">
                    {/* Simulated vector QR layout */}
                    <rect width="100" height="100" fill="white"/>
                    <rect x="5" y="5" width="20" height="20" fill="currentColor"/>
                    <rect x="8" y="8" width="14" height="14" fill="white"/>
                    <rect x="11" y="11" width="8" height="8" fill="currentColor"/>
                    
                    <rect x="75" y="5" width="20" height="20" fill="currentColor"/>
                    <rect x="78" y="8" width="14" height="14" fill="white"/>
                    <rect x="81" y="81" width="8" height="8" fill="currentColor"/>
                    
                    <rect x="5" y="75" width="20" height="20" fill="currentColor"/>
                    <rect x="8" y="78" width="14" height="14" fill="white"/>
                    <rect x="11" y="81" width="8" height="8" fill="currentColor"/>
                    
                    <rect x="75" y="75" width="20" height="20" fill="currentColor"/>
                    <rect x="78" y="78" width="14" height="14" fill="white"/>
                    <rect x="81" y="11" width="8" height="8" fill="currentColor"/>

                    {/* QR Code pseudo-random block grids */}
                    <path d="M 30 5 L 30 15 M 35 10 L 45 10 M 40 5 L 40 25 M 30 20 L 50 20 M 55 5 L 55 15 L 65 15 M 60 10 L 70 10 M 65 20 L 70 20 M 30 30 L 30 45 L 35 45 M 40 30 L 45 35 M 50 35 L 55 30 L 55 45 M 60 40 L 70 40 M 5 30 L 25 30 M 10 35 L 20 35 M 15 40 L 15 45 M 5 50 L 50 50 M 10 55 L 20 55 M 30 55 L 45 55 M 75 30 L 95 30 m -10 5 m -5 10 M 80 40 L 90 40 L 90 50 M 55 50 L 70 50 L 70 65 M 60 55 L 60 70 M 65 65 L 70 65 M 75 55 L 85 55 M 80 60 L 95 60 L 95 70 M 5 60 L 25 60 M 15 65 L 15 70 M 30 65 L 45 65 M 35 70 M 50 70 M 50 75 L 70 75 M 55 80 L 65 80 M 60 85 L 60 95" stroke="currentColor" strokeWidth="2.5" fill="none"/>
                  </svg>
                </div>
                <div className="items-center text-center">
                  <span className="inline-flex items-center gap-1 text-[7px] bg-emerald-50 text-emerald-800 font-extrabold px-1 py-0.5 rounded uppercase tracking-wider">
                    <Check className="w-2 h-2" />
                    ZATCA PHASE II COMPLIANT
                  </span>
                  <p className="text-[7px] text-slate-400 mt-0.5 max-w-[220px] leading-tight">
                    Simplifed e-invoice cryptographical stamp verified by tax authority.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-[7px] text-slate-400 space-y-0.5 mt-4 border-t border-dashed border-slate-200 pt-2.5">
                <p>Mada POS System — Powered by Saudi Digital Enterprise</p>
                <p>Thank you for your visit / شكراً لزيارتكم</p>
              </div>

            </div>

            {/* Quick Action buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-1.5" id="receipt-modal-actions">
              <button 
                onClick={() => printThermalElement('printable-receipt-area', 'POS_Thermal_Receipt')}
                className="w-full py-2 bg-slate-900 text-white rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold hover:bg-slate-800 transition active:scale-98"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <div className="grid grid-cols-2 gap-1.5">
                <button 
                  onClick={() => alert('Mocking Email Receipt Delivery...')}
                  className="py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-center gap-1 text-[10px] font-bold tracking-tight transition"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </button>
                <button 
                  onClick={() => alert('Mocking SMS Receipt Delivery...')}
                  className="py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-center gap-1 text-[10px] font-bold tracking-tight transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>SMS</span>
                </button>
              </div>
              <button 
                onClick={() => setLastReceipt(null)}
                className="w-full mt-2 text-[10px] text-center font-bold text-slate-400 hover:text-slate-650"
              >
                No, Thanks
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
