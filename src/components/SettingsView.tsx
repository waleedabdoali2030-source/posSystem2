import React, { useState } from 'react';
import { 
  Building2, QrCode, CreditCard, ShieldCheck, CheckCircle2, 
  Trash2, Plus, Wifi, Save, RotateCcw, AlertTriangle, KeyRound,
  FileText, Receipt
} from 'lucide-react';
import { ZATCAConfig, Operator, CustomPaymentMethod } from '../types';

interface SettingsViewProps {
  zatcaConfig: ZATCAConfig;
  setZatcaConfig: React.Dispatch<React.SetStateAction<ZATCAConfig>>;
  operators: Operator[];
  setOperators: React.Dispatch<React.SetStateAction<Operator[]>>;
  paymentMethods: CustomPaymentMethod[];
  setPaymentMethods: React.Dispatch<React.SetStateAction<CustomPaymentMethod[]>>;
}

export default function SettingsView({
  zatcaConfig,
  setZatcaConfig,
  operators,
  setOperators,
  paymentMethods,
  setPaymentMethods
}: SettingsViewProps) {
  // Settings view sidebar menu
  const [activeTab, setActiveTab] = useState<'store-info' | 'zatca' | 'payment' | 'users' | 'invoice'>('invoice');

  // Interactive configurations form state
  const [storeNameEn, setStoreNameEn] = useState(zatcaConfig.storeNameEn);
  const [storeNameAr, setStoreNameAr] = useState(zatcaConfig.storeNameAr);
  const [vatNumber, setVatNumber] = useState(zatcaConfig.vatNumber);
  const [apiKey, setApiKey] = useState(zatcaConfig.apiKey);
  const [invoiceHeader, setInvoiceHeader] = useState(zatcaConfig.invoiceHeader || '');
  const [invoiceTitle, setInvoiceTitle] = useState(zatcaConfig.invoiceTitle || '');

  // Digital keypad inputs in Payments configuration (Screen 3)
  const [cashLimit, setCashLimit] = useState('5000.00');
  const [activeConfigField, setActiveConfigField] = useState<'cashLimit' | 'minMada'>('cashLimit');

  // Payment Method manager states
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  
  const [paymentFormName, setPaymentFormName] = useState('');
  const [paymentFormNameAr, setPaymentFormNameAr] = useState('');
  const [paymentFormIcon, setPaymentFormIcon] = useState('💳');
  const [paymentFormType, setPaymentFormType] = useState<'cash' | 'mada' | 'creditCard' | 'wallet' | 'custom'>('custom');
  const [paymentFormStatus, setPaymentFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [paymentFormDescription, setPaymentFormDescription] = useState('');

  const handleOpenAddPayment = () => {
    setIsAddingMethod(true);
    setEditingMethodId(null);
    setPaymentFormName('');
    setPaymentFormNameAr('');
    setPaymentFormIcon('💳');
    setPaymentFormType('custom');
    setPaymentFormStatus('Active');
    setPaymentFormDescription('');
  };

  const handleOpenEditPayment = (method: CustomPaymentMethod) => {
    setEditingMethodId(method.id);
    setIsAddingMethod(false);
    setPaymentFormName(method.name);
    setPaymentFormNameAr(method.nameAr);
    setPaymentFormIcon(method.icon);
    setPaymentFormType(method.type);
    setPaymentFormStatus(method.status);
    setPaymentFormDescription(method.description || '');
  };

  const handleDeletePayment = (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this payment method? It will be removed from the POS Terminal.');
    if (confirmDelete) {
      setPaymentMethods(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleSavePaymentMethod = () => {
    if (!paymentFormName) return;

    if (editingMethodId) {
      // Edit mode
      setPaymentMethods(prev => prev.map(m => m.id === editingMethodId ? {
        ...m,
        name: paymentFormName,
        nameAr: paymentFormNameAr,
        icon: paymentFormIcon,
        type: paymentFormType,
        status: paymentFormStatus,
        description: paymentFormDescription
      } : m));
      setEditingMethodId(null);
    } else {
      // Create mode
      const newMethod: CustomPaymentMethod = {
        id: `pm-${Date.now()}`,
        name: paymentFormName,
        nameAr: paymentFormNameAr,
        icon: paymentFormIcon,
        type: paymentFormType,
        status: paymentFormStatus,
        description: paymentFormDescription
      };
      setPaymentMethods(prev => [...prev, newMethod]);
      setIsAddingMethod(false);
    }
    // reset form
    setPaymentFormName('');
    setPaymentFormNameAr('');
    setPaymentFormIcon('💳');
    setPaymentFormDescription('');
  };

  // Operators input
  const [newOpName, setNewOpName] = useState('');
  const [newOpPassword, setNewOpPassword] = useState('');
  const [newOpRole, setNewOpRole] = useState<'Supervisor' | 'Cashier' | 'Admin'>('Cashier');

  // Submit and save configuration safely
  const handleSaveConfigs = (e: React.FormEvent) => {
    e.preventDefault();
    setZatcaConfig(prev => ({
      ...prev,
      storeNameEn,
      storeNameAr,
      vatNumber,
      apiKey,
      invoiceHeader,
      invoiceTitle
    }));
    alert('Global settings stored to RAM context safely!');
  };

  // Add operator
  const handleAddOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpName || !newOpPassword) {
      alert('Please enter active name and password');
      return;
    }

    const newOp: Operator = {
      id: `op-${Date.now()}`,
      name: newOpName,
      password: newOpPassword,
      role: newOpRole,
      activeSales: 0,
      status: 'Active'
    };

    setOperators(prev => [...prev, newOp]);
    setNewOpName('');
    setNewOpPassword('');
  };

  // Toggle status operator
  const toggleOperatorStatus = (id: string) => {
    setOperators(prev => prev.map(o => {
      if (o.id === id) {
        return { ...o, status: o.status === 'Active' ? 'Inactive' : 'Active' };
      }
      return o;
    }));
  };

  // Keypad actions for Cash limits in Payments method (Screen 3 layout)
  const handlePaymentKeypadPress = (val: string) => {
    if (val === 'C') {
      setCashLimit('0.00');
      return;
    }
    setCashLimit(prev => {
      if (prev === '0.00' || prev === '5000.00') return val;
      return prev + val;
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-5 animate-fade-in" id="settings-workbench">
      
      {/* 1. Left settings segment navigation (Screen 3/5 layout) */}
      <div className="w-full md:w-56 shrink-0 flex flex-col bg-white border border-slate-100 rounded-xl p-3 space-y-1 shadow-2xs" id="settings-sidebar">
        <button
          onClick={() => setActiveTab('store-info')}
          className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
            activeTab === 'store-info' ? 'bg-slate-900 text-white font-bold' : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span>Store Information</span>
        </button>

        <button
          onClick={() => setActiveTab('zatca')}
          className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
            activeTab === 'zatca' ? 'bg-slate-900 text-white font-bold' : 'text-slate-650 hover:bg-slate-50 hover:text-slate-905'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <QrCode className="w-4 h-4 shrink-0" />
            <span>ZATCA E-Invoicing</span>
          </div>
          <span className="bg-emerald-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded scale-90">
            ACTIVE
          </span>
        </button>

        <button
          onClick={() => setActiveTab('invoice')}
          className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
            activeTab === 'invoice' ? 'bg-slate-900 text-white font-bold' : 'text-slate-650 hover:bg-slate-50 hover:text-slate-905'
          }`}
        >
          <Receipt className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Invoice Customizer</span>
        </button>

        <button
          onClick={() => setActiveTab('payment')}
          className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
            activeTab === 'payment' ? 'bg-slate-900 text-white font-bold' : 'text-slate-650 hover:bg-slate-50 hover:text-slate-905'
          }`}
        >
          <CreditCard className="w-4 h-4 shrink-0" />
          <span>Payment Methods</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
            activeTab === 'users' ? 'bg-slate-900 text-white font-bold' : 'text-slate-650 hover:bg-slate-50 hover:text-slate-905'
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>User Permissions</span>
        </button>
      </div>

      {/* 2. Main content panes */}
      <div className="flex-1 bg-white border border-slate-100 rounded-xl p-5 shadow-2xs min-w-0" id="settings-content-pane">
        
        {/* ========================================================== */}
        {/* TAB A: STORE INFORMATION                                   */}
        {/* ========================================================== */}
        {activeTab === 'store-info' && (
          <form onSubmit={handleSaveConfigs} className="space-y-4" id="store-info-form">
            <div>
              <h2 className="text-sm font-black text-slate-950 font-display">Store Identity</h2>
              <p className="text-[10px] text-slate-400">Configure your store metadata displayed on e-invoice receipts</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Company name (English)</label>
                <input 
                  type="text" 
                  value={storeNameEn}
                  onChange={(e) => setStoreNameEn(e.target.value)}
                  className="w-full text-xs font-bold border rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">اسم المؤسسة (Arabic)</label>
                <input 
                  type="text" 
                  value={storeNameAr}
                  onChange={(e) => setStoreNameAr(e.target.value)}
                  className="w-full text-xs font-bold text-right border rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Commercial Registration (CR)</label>
                <input 
                  type="text" 
                  defaultValue="1010482940" 
                  className="w-full text-xs border rounded-lg p-2.5 text-slate-500 font-mono" 
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Store Outlet Address</label>
                <input 
                  type="text" 
                  defaultValue="Olaya District, King Fahd Road, Riyadh" 
                  className="w-full text-xs border rounded-lg p-2.5 text-slate-500" 
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-50">
              <button 
                type="submit" 
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer transition active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>Save Store Info</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================== */}
        {/* TAB E: INVOICE CUSTOMIZATION                               */}
        {/* ========================================================== */}
        {activeTab === 'invoice' && (
          <form onSubmit={handleSaveConfigs} className="space-y-5 animate-fade-in text-slate-800" id="invoice-customizer-form">
            <div>
              <h2 className="text-sm font-black text-slate-950 font-display">Invoice Customization Hub</h2>
              <p className="text-[10px] text-slate-400">Personalize corporate headers, display titles, and verify mandatory Saudi VAT registration details for your printed simplified invoices</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column - Customizer Controls */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Configure Invoice Metadata</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Store Name (English)</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Al-Modern Express Stores"
                        value={storeNameEn}
                        onChange={(e) => setStoreNameEn(e.target.value)}
                        className="w-full text-xs font-bold border rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500"
                        id="invoice-store-name-en-input"
                      />
                      <span className="text-[9px] text-slate-400 block mt-1">
                        System brand identity
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">اسم المتجر (Arabic)</label>
                      <input 
                        type="text" 
                        required
                        placeholder="اسم المتجر بالكامل"
                        value={storeNameAr}
                        onChange={(e) => setStoreNameAr(e.target.value)}
                        className="w-full text-xs font-bold text-right border rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500"
                        dir="rtl"
                        id="invoice-store-name-ar-input"
                      />
                      <span className="text-[9px] text-slate-400 block mt-1 text-right">
                        اسم المنشأة الرسمي المعرب
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Company VAT Registration Number (15 digits)</label>
                    <input 
                      type="text" 
                      required
                      pattern="\d{15}"
                      maxLength={15}
                      placeholder="e.g. 310294827400003"
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-xs font-mono font-bold border rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-[9px] text-slate-400 block mt-1">
                      Complying with GCC ZATCA rules. This is automatically printed at the very top of each consumer invoice.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Invoice Display Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. SIMPLIFIED TAX INVOICE"
                      value={invoiceTitle}
                      onChange={(e) => setInvoiceTitle(e.target.value)}
                      className="w-full text-xs font-bold border rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-[9px] text-slate-400 block mt-1">
                      Sets the prominent classification title of the receipt (e.g., TAX INVOICE, RETAIL MEMO).
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Custom Invoice Header Text</label>
                    <textarea 
                      rows={4}
                      placeholder="Welcome message, branch details or telephone..."
                      value={invoiceHeader}
                      onChange={(e) => setInvoiceHeader(e.target.value)}
                      className="w-full text-xs font-bold border rounded-lg p-2.5 font-mono focus:ring-1 focus:ring-emerald-500 whitespace-pre-wrap leading-relaxed"
                    />
                    <span className="text-[9px] text-slate-400 block mt-1">
                      Write multi-line instructions, custom addresses, slogans, or contact numbers to display under the store name.
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column - Live Invoice Template Top Preview */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex-1 flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2.5 block text-center">Live Receipt Header Preview</span>
                  
                  {/* Outer simulated thermal ticket paper */}
                  <div className="bg-white border rounded shadow-md p-4 flex-1 font-mono text-[9px] leading-snug text-slate-800 flex flex-col justify-between max-w-sm mx-auto w-full relative">
                    <div className="absolute top-1 left-1.5 text-[7px] text-slate-350 select-none">Live thermal sheet</div>
                    
                    {/* Receipts top header with dynamic company names and values */}
                    <div className="text-center space-y-1 pt-1.5">
                      <div className="bg-amber-100 hover:bg-amber-205 text-amber-900 border border-amber-300 text-[8px] font-bold py-0.5 px-2 rounded inline-block mb-1 cursor-pointer select-none" title="Company Name configuration also controls entire system's brand identity.">
                        🚀 Syncs System Identity
                      </div>
                      
                      {/* Company English and Arabic Names - system-wide */}
                      <h1 className="text-[11px] font-black tracking-tight text-slate-950 uppercase">{storeNameEn || 'YOUR COMPANY NAME (EN)'}</h1>
                      <h2 className="text-[10px] font-extrabold text-slate-900" dir="rtl">{storeNameAr || 'اسم مؤسستك بالكامل (AR)'}</h2>
                      
                      {/* VAT Registration Number (15 digits) prominently added at the top */}
                      <div className="bg-slate-100 border border-slate-250 py-1.5 px-2.5 rounded-lg my-1 text-center scale-95">
                        <p className="text-[8.5px] text-slate-700 font-extrabold">VAT REGISTRATION NUMBER</p>
                        <p className="text-[10px] text-emerald-700 font-black tracking-widest mt-0.5">
                          {vatNumber ? vatNumber.replace(/(\d{3})(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4 $5') : '15-DIGIT VAT NUMBER'}
                        </p>
                      </div>

                      {/* Custom multiline Invoice Header */}
                      <p className="text-[8px] text-slate-600 whitespace-pre-wrap leading-relaxed border-t border-b border-dotted border-slate-200 py-1.5 my-1.5 animate-pulse-subtle">
                        {invoiceHeader || 'Add your corporate email, website, phone or address lines...' }
                      </p>

                      {/* Customized Invoice Title */}
                      <div className="bg-slate-900 text-white rounded p-1 mb-1 shadow-3xs">
                        <span className="text-[8.5px] font-black uppercase block tracking-wider">{invoiceTitle || 'SIMPLIFIED TAX INVOICE'}</span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-slate-300 my-2 pt-2 text-[8px] text-slate-400 flex items-center justify-between">
                      <span>Inv: #019283-A</span>
                      <span>Total: 0.00 SAR</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save invoice change dispatch */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-3 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer transition active:scale-98 animate-pulse-subtle"
              >
                <Save className="w-4 h-4" />
                <span>Save Invoice Config & Brand Identity</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================== */}
        {/* TAB B: ZATCA E-INVOICING (Screen 5 layout)                 */}
        {/* ========================================================== */}
        {activeTab === 'zatca' && (
          <form onSubmit={handleSaveConfigs} className="space-y-5 animate-fade-in" id="zatca-e-invoicing-settings">
            <div>
              <h2 className="text-sm font-black text-slate-950 font-display">ZATCA Compliance Phase II Integration</h2>
              <p className="text-[10px] text-slate-400">Manage client cryptographic certificates, simulation API connections, and device registrations</p>
            </div>

            {/* Top stats info cards (Screen 5) */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100" id="zatca-credentials-dashboard">
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block">CSID Status</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Certificate Active
                </span>
                <p className="text-[8px] text-slate-400 mt-1">Expires 15 May 2027</p>
              </div>

              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Integration State</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-700 mt-0.5">
                  <Wifi className="w-3.5 h-3.5 text-indigo-600" />
                  All 3/3 Steps Active
                </span>
                <p className="text-[8px] text-slate-400 mt-1">Device UUID pre-registered</p>
              </div>

              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Simplified Invoices</span>
                <span className="text-sm font-black text-slate-950 font-mono block mt-0.5">
                  {zatcaConfig.totalReported} Syncs
                </span>
                <p className="text-[8px] text-emerald-600 font-bold uppercase">0 pending syncs</p>
              </div>
            </div>

            <div className="space-y-4" id="zatca-fields">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Company VAT Registration Number (15 digits)</label>
                  <input 
                    type="text" 
                    required
                    pattern="\d{15}"
                    maxLength={15}
                    placeholder="e.g. 310294827400003"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    className="w-full text-xs font-mono font-bold border rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-[8px] text-slate-400 block mt-1">Must be exactly 15 numeric digits complying with GCC unified tax rules.</span>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Simulated clearance API Token key</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-[10px]"><KeyRound className="w-3.5 h-3.5" /></span>
                    <input 
                      type="text" 
                      required
                      placeholder="Enter security api key..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full text-xs font-mono border rounded-lg p-2.5 pl-9 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-[8px] text-slate-400 block mt-1">Private device authorization used to authenticate secure XML submissions.</span>
                </div>
              </div>
            </div>

            {/* Discard / Save Changes triggers */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-50">
              <button 
                type="button"
                onClick={() => {
                  setVatNumber(zatcaConfig.vatNumber);
                  setApiKey(zatcaConfig.apiKey);
                }}
                className="py-2.5 px-4 border rounded-lg text-xs font-extrabold text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              >
                Discard
              </button>
              <button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer transition active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>Save ZATCA Config</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================== */}
        {/* TAB C: PAYMENT METHODS CONFIGURATION PANEL (Screen 3)      */}
        {/* ========================================================== */}
        {activeTab === 'payment' && (
          <div className="space-y-4 animate-fade-in" id="payment-gateways-config">
            <div className="flex justify-between items-center bg-slate-50 border border-slate-150 p-4 rounded-xl">
              <div>
                <h2 className="text-sm font-black text-slate-950 font-display">Store payment routes</h2>
                <p className="text-[10px] text-slate-400">Adjust cash drawer thresholds and configure active payment modes dynamically</p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddPayment}
                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1 text-[10px] font-extrabold shadow-3xs cursor-pointer transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Payment Route</span>
              </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-5" id="payments-pad-layout">
              {/* Payment Methods Info Lists (Left) */}
              <div className="flex-1 space-y-3" id="payments-methods-lists">
                {paymentMethods.map((method) => {
                  const isActive = method.status === 'Active';
                  return (
                    <div key={method.id} className="p-4 border border-slate-200/80 rounded-xl bg-slate-50/45 hover:bg-slate-50 transition-all space-y-2.5 relative group">
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-2 text-xs font-black text-slate-900 leading-none">
                            <span className="p-1 px-2 bg-slate-100 rounded-md text-sm">{method.icon || '💳'}</span>
                            <span className="flex flex-col">
                              <span>{method.name}</span>
                              {method.nameAr && (
                                <span className="text-[9px] text-slate-400 font-medium" dir="rtl">
                                  {method.nameAr}
                                </span>
                              )}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[8.5px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-500'
                          }`}>
                            {method.status}
                          </span>
                          <span className="bg-slate-100 text-slate-600 text-[8.5px] font-mono px-1.5 py-0.5 rounded uppercase">
                            {method.type}
                          </span>
                        </div>
                      </div>

                      {method.description && (
                        <p className="text-[10px] text-slate-450 leading-relaxed">
                          {method.description}
                        </p>
                      )}

                      {method.type === 'cash' && (
                        <div className="flex justify-between items-baseline pt-2 border-t border-slate-150">
                          <span className="text-[8.5px] text-slate-400 uppercase font-bold tracking-wider">Max Safe Drawer Hold Limit</span>
                          <span className="text-xs font-mono font-black text-slate-955">SAR {cashLimit}</span>
                        </div>
                      )}

                      {/* Action buttons nicely organized */}
                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 mt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditPayment(method)}
                          className="px-2 py-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded text-[9px] font-bold transition-all"
                        >
                          Edit Gateway
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePayment(method.id)}
                          className="px-2 py-1 border border-rose-100 bg-rose-50/15 hover:bg-rose-50 text-rose-600 rounded text-[9px] font-bold transition-all flex items-center gap-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Padkey quick entry or Add/Edit Portal on Right */}
              <div className="shrink-0">
                {isAddingMethod || editingMethodId ? (
                  /* Dynamic Editor Panel */
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSavePaymentMethod(); }} 
                    className="w-full lg:w-72 bg-slate-900 border border-slate-800 text-white rounded-xl p-4 flex flex-col gap-3 shadow-md animate-fade-in"
                  >
                    <div className="flex justify-between items-center border-b border-slate-850 pb-2 mb-1">
                      <span className="text-[9.5px] text-emerald-400 font-bold uppercase tracking-wider font-mono">
                        {editingMethodId ? 'Edit Payment Route' : 'Add Payment Route'}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => { setIsAddingMethod(false); setEditingMethodId(null); }}
                        className="text-slate-400 hover:text-white text-[10px] cursor-pointer bg-slate-800 hover:bg-slate-750 px-2 py-0.5 rounded transition"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                          Gateway Name (English)
                        </label>
                        <input 
                          type="text" 
                          value={paymentFormName}
                          onChange={(e) => setPaymentFormName(e.target.value)}
                          placeholder="e.g. Apple Pay"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-white font-semibold focus:outline-hidden focus:border-emerald-500 text-[11px]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                          Gateway Name (Arabic)
                        </label>
                        <input 
                          type="text" 
                          value={paymentFormNameAr}
                          onChange={(e) => setPaymentFormNameAr(e.target.value)}
                          placeholder="مثال: ابل باي"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-white font-semibold text-right focus:outline-hidden focus:border-emerald-500 text-[11px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                            Icon / Emoji
                          </label>
                          <input 
                            type="text" 
                            value={paymentFormIcon}
                            onChange={(e) => setPaymentFormIcon(e.target.value)}
                            placeholder="💳 / 📱"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-center text-white font-semibold focus:outline-hidden focus:border-emerald-500 text-[11px]"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                            Gateway Type
                          </label>
                          <select
                            value={paymentFormType}
                            onChange={(e) => setPaymentFormType(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-white font-semibold focus:outline-hidden focus:border-emerald-500 text-[11px]"
                          >
                            <option value="mada">Mada</option>
                            <option value="cash">Cash</option>
                            <option value="creditCard">Credit Card</option>
                            <option value="wallet">Wallet</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                          Status
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentFormStatus('Active')}
                            className={`flex-1 py-1 px-2.5 rounded border text-center font-bold font-mono text-[9px] ${
                              paymentFormStatus === 'Active' 
                                ? 'bg-emerald-900/40 border-emerald-500 text-emerald-400' 
                                : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                            }`}
                          >
                            ACTIVE
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentFormStatus('Inactive')}
                            className={`flex-1 py-1 px-2.5 rounded border text-center font-bold font-mono text-[9px] ${
                              paymentFormStatus === 'Inactive' 
                                ? 'bg-slate-800 border-slate-700 text-slate-350' 
                                : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                            }`}
                          >
                            INACTIVE
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                          Short Description
                        </label>
                        <textarea 
                          value={paymentFormDescription}
                          onChange={(e) => setPaymentFormDescription(e.target.value)}
                          placeholder="e.g. Dynamic checkout payment gateway"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-white focus:outline-hidden focus:border-emerald-500 text-[10px] h-12 resize-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 transition font-black text-xs text-white uppercase rounded-lg tracking-wider active:scale-95 cursor-pointer shadow-sm mt-1"
                    >
                      {editingMethodId ? 'Apply Changes' : 'Register Route'}
                    </button>
                  </form>
                ) : (
                  /* Padkey quick entry (Screen 3 Right panel numeric interface) */
                  <div className="w-full lg:w-64 bg-slate-900 border border-slate-800 text-white rounded-xl p-4 flex flex-col justify-between space-y-3.5 shadow-md" id="padkey-quick-entry animate-fade-in">
                    <div>
                      <span className="text-[9.5px] text-slate-450 uppercase font-mono tracking-wider">Adjustment Panel</span>
                      <label className="block text-xs font-extrabold text-white mt-1">Configure Target Float Limit</label>
                      
                      <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-right mt-2 font-mono text-emerald-400 font-extrabold text-md">
                        SAR {cashLimit}
                      </div>
                    </div>

                    {/* Padkey Grid layout */}
                    <div className="grid grid-cols-3 gap-1.5" id="padkey-matrix">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'Enter'].map((char) => {
                        const isClear = char === 'C';
                        const isEnter = char === 'Enter';
                        return (
                          <button
                            key={char}
                            type="button"
                            onClick={() => {
                              if (isEnter) {
                                alert('Saved Safe Drawer Limit adjustment successfully!');
                              } else {
                                handlePaymentKeypadPress(char);
                              }
                            }}
                            className={`p-2.5 font-bold font-mono text-xs text-center border rounded transition-all active:scale-95 ${
                              isEnter 
                                ? 'col-span-1 bg-emerald-600 border-emerald-500 text-white font-extrabold' 
                                : isClear 
                                  ? 'bg-rose-950/40 border-rose-900/50 text-rose-300'
                                  : 'bg-slate-950 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white'
                            }`}
                          >
                            {char}
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-3 bg-slate-955 rounded text-[8.5px] text-slate-450 leading-relaxed text-center">
                      Values entered here calibrate individual drawer cash drops and auto flagging on excess thresholds.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom active metrics bar matching Screen 3 bottom */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs pt-4" id="settings-payment-metrics">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Volume Mada Cards</span>
                <strong className="text-slate-950 font-mono text-sm block mt-0.5">12,402.15 SAR</strong>
                <span className="text-[8px] text-slate-450 block">Device network verified</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Cash in hand</span>
                <strong className="text-slate-950 font-mono text-sm block mt-0.5">4,850.00 SAR</strong>
                <span className="text-[8px] text-emerald-600 font-extrabold block">Secure balance</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Merchant API Uptime</span>
                <strong className="text-emerald-700 font-black text-sm block mt-0.5 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  99.9% Up
                </strong>
                <span className="text-[8px] text-slate-450 block">ZATCA clearing endpoints</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Compliance mode</span>
                <strong className="text-slate-905 font-mono text-sm block mt-0.5">B2C Simplified</strong>
                <span className="text-[8px] text-slate-450 block">Standard phase II active</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB D: USER PERMISSIONS AND OPERATORS                      */}
        {/* ========================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-fade-in" id="settings-users-permissions">
            <div>
              <h2 className="text-sm font-black text-slate-950 font-display">Operators and access clearances</h2>
              <p className="text-[10px] text-slate-400">Enroll store managers who have print report and close days authority</p>
            </div>

            {/* Fast input add operator form */}
            <form onSubmit={handleAddOperator} className="flex flex-col sm:flex-row gap-3 items-end bg-slate-50 p-4 border rounded-xl" id="add-user-form">
              <div className="flex-1 w-full">
                <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Operator Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Khalid Al-Shehri"
                  className="w-full text-xs p-2 bg-white border rounded-md"
                  value={newOpName}
                  onChange={(e) => setNewOpName(e.target.value)}
                />
              </div>

              <div className="w-full sm:w-44">
                <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Password</label>
                <input 
                  type="text" 
                  required
                  placeholder="Password"
                  className="w-full text-xs p-2 bg-white border rounded-md"
                  value={newOpPassword}
                  onChange={(e) => setNewOpPassword(e.target.value)}
                />
              </div>

              <div className="w-full sm:w-36">
                <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Store Role</label>
                <select
                  className="w-full text-xs p-2 bg-white border rounded-md font-extrabold"
                  value={newOpRole}
                  onChange={(e) => setNewOpRole(e.target.value as any)}
                >
                  <option value="Cashier">Cashier</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full sm:w-auto py-2.5 px-4 bg-slate-900 text-white rounded-md text-[10px] font-bold uppercase hover:bg-slate-800 transition shadow-xs cursor-pointer"
              >
                Enroll
              </button>
            </form>

            {/* Operators layout list */}
            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs text-xs" id="operators-list">
              <div className="bg-slate-50 p-3 font-bold border-b text-[10.5px] uppercase tracking-wide text-slate-500">
                Authorized Device Operators Registered
              </div>
              
              <div className="divide-y divide-slate-100 bg-white">
                {operators.map((op) => {
                  const isActive = op.status === 'Active';
                  const isSystemDefaultAdmin = op.name.toLowerCase() === 'admin';
                  return (
                    <div key={op.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50/20 transition">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${
                          op.role === 'Admin' ? 'bg-rose-100 text-rose-700' :
                          op.role === 'Supervisor' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {op.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-extrabold text-slate-900">{op.name}</p>
                          <p className="text-[10px] text-slate-400">
                            Role: <strong className="text-slate-705 uppercase">{op.role}</strong> • Pass: <strong className="font-mono text-slate-800">{op.password || '123'}</strong> • {op.activeSales} shifts assigned
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button 
                          type="button"
                          onClick={() => toggleOperatorStatus(op.id)}
                          className={`text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded border transition ${
                            isActive 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          {op.status}
                        </button>

                        {!isSystemDefaultAdmin ? (
                          <button 
                            onClick={() => setOperators(prev => prev.filter(o => o.id !== op.id))}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded"
                            title="Revoke operator"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-bold px-2 py-1 bg-slate-100 rounded select-none cursor-not-allowed">
                            Permanent Admin
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
