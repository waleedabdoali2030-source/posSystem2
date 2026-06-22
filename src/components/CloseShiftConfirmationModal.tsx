import React from 'react';
import { X, CheckCircle2, ShieldAlert, BarChart3, Receipt, Wallet, Coins, CreditCard } from 'lucide-react';
import { ShiftState, Category } from '../types';

interface CloseShiftConfirmationModalProps {
  isOpen: boolean;
  shiftState: ShiftState;
  categories: Category[];
  onConfirm: (
    categorySales: { name: string; count: number; volume: number }[],
    paymentSales: { name: string; volume: number }[],
    productSales: { name: string; quantity: number; volume: number }[]
  ) => void;
  onClose: () => void;
}

export default function CloseShiftConfirmationModal({
  isOpen,
  shiftState,
  categories,
  onConfirm,
  onClose
}: CloseShiftConfirmationModalProps) {
  if (!isOpen) return null;

  // Let's compute shift status based on salesList
  const categorySalesMap: Record<string, { count: number; volume: number }> = {};
  const productSalesMap: Record<string, { quantity: number; volume: number }> = {};

  const totalSalesFromSales = shiftState.salesList?.reduce((sum, s) => sum + s.totalSales, 0) || 0;
  const totalVatFromSales = shiftState.salesList?.reduce((sum, s) => sum + s.totalVat, 0) || 0;

  // Track if we have actual transactions, otherwise build defaults
  if (shiftState.salesList && shiftState.salesList.length > 0) {
    shiftState.salesList.forEach(sale => {
      sale.items.forEach(item => {
        // Group by category name
        if (!categorySalesMap[item.categoryName]) {
          categorySalesMap[item.categoryName] = { count: 0, volume: 0 };
        }
        categorySalesMap[item.categoryName].count += item.quantity;
        categorySalesMap[item.categoryName].volume += item.total;

        // Group by Product name
        if (!productSalesMap[item.name]) {
          productSalesMap[item.name] = { quantity: 0, volume: 0 };
        }
        productSalesMap[item.name].quantity += item.quantity;
        productSalesMap[item.name].volume += item.total;
      });
    });
  }

  // Format arrays for category & product sales
  const computedCategories = Object.keys(categorySalesMap).map(name => ({
    name,
    count: categorySalesMap[name].count,
    volume: categorySalesMap[name].volume
  }));

  const computedProducts = Object.keys(productSalesMap).map(name => ({
    name,
    quantity: productSalesMap[name].quantity,
    volume: productSalesMap[name].volume
  }));

  // Fallback to shiftState standard sales values if salesList is empty
  const cashTotal = shiftState.cashSales;
  const madaTotal = shiftState.madaSales;
  const creditTotal = shiftState.creditCardSales;
  const walletTotal = shiftState.walletSales;

  const totalGrossSales = totalSalesFromSales || (cashTotal + madaTotal + creditTotal + walletTotal);
  const totalVatCalculated = totalVatFromSales || (totalGrossSales * 0.15);
  const totalNetSales = totalGrossSales - totalVatCalculated;

  const computedPayments = [
    { name: 'Mada Routing', volume: madaTotal || (shiftState.salesList?.filter(s => s.paymentMethod === 'mada').reduce((sum, s) => sum + s.totalSales, 0) || 0) },
    { name: 'Drawer Cash', volume: cashTotal || (shiftState.salesList?.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.totalSales, 0) || 0) },
    { name: 'Credit Cards', volume: creditTotal || (shiftState.salesList?.filter(s => s.paymentMethod === 'creditCard').reduce((sum, s) => sum + s.totalSales, 0) || 0) },
    { name: 'Digital Wallets', volume: walletTotal || (shiftState.salesList?.filter(s => s.paymentMethod === 'wallet').reduce((sum, s) => sum + s.totalSales, 0) || 0) }
  ];

  // Adjust default Categories if nothing was computed
  const finalCategories = computedCategories.length > 0 ? computedCategories : [
    { name: 'General Retail Items', count: Math.ceil(totalGrossSales / 45) || 0, volume: totalGrossSales }
  ];

  const handleFinalizeClose = () => {
    onConfirm(finalCategories, computedPayments, computedProducts);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" id="close-shift-confirm-overlay">
      <div className="bg-white border border-slate-200 text-slate-800 rounded-xl shadow-2xl max-w-xl w-full overflow-hidden animate-fade-in my-8 flex flex-col max-h-[90vh]" id="close-shift-confirm-container">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-slate-950 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-50 border border-rose-100 rounded text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-black font-display uppercase tracking-tight">Shift Control Office</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wider">Terminal ID: {shiftState.terminalId} • Day #{shiftState.dayNumber}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-150 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Workspace Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 font-sans text-xs">
          
          {/* Warning banner */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/60 leading-relaxed text-[11px] text-amber-850">
            <p className="font-extrabold flex items-center gap-1">
              ⚠️ Finalizing Terminal Register Closure
            </p>
            <p className="mt-1">
              Closing this shift records all sales to the system logs, clears active drawer balances, and locks historical records for ZATCA sequence clearance. This action is automatic and irreversible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Col - Sales totals summaries */}
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3">
              <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1 border-b pb-1.5">
                <Receipt className="w-3.5 h-3.5 text-slate-650" />
                Shift Tally Summary
              </h4>
              
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Opening Float:</span>
                  <span className="font-bold text-slate-950 font-mono">SAR {shiftState.openingBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Net Sales (Ex VAT):</span>
                  <span className="font-bold text-slate-950 font-mono">SAR {totalNetSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Tax Standard (15% VAT):</span>
                  <span className="font-bold text-slate-950 font-mono">SAR {totalVatCalculated.toFixed(2)}</span>
                </div>

                <div className="border-t border-slate-200/70 pt-2 flex justify-between items-center text-xs font-black text-slate-950">
                  <span>GRAND TOTAL SALES:</span>
                  <span className="font-mono text-emerald-600">SAR {totalGrossSales.toFixed(2)}</span>
                </div>

                <div className="border-t border-dashed border-slate-200 pt-2 flex justify-between items-center text-[10px] text-slate-500">
                  <span>Estimated Drawer Cash:</span>
                  <span className="font-bold font-mono">SAR {shiftState.cashReceived.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Right Col - Payments breakdowns */}
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3">
              <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1 border-b pb-1.5">
                <Wallet className="w-3.5 h-3.5 text-slate-650" />
                Payments Compiled
              </h4>

              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Coins className="w-3 h-3 text-emerald-600" /> Cash Sales
                  </span>
                  <span className="font-bold text-slate-900 font-mono">SAR {cashTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1 text-slate-600">
                    <CreditCard className="w-3 h-3 text-blue-600" /> Mada Network
                  </span>
                  <span className="font-bold text-slate-900 font-mono">SAR {madaTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1 text-slate-600">
                    <CreditCard className="w-3 h-3 text-purple-600" /> Credit Cards
                  </span>
                  <span className="font-bold text-slate-900 font-mono">SAR {creditTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Wallet className="w-3 h-3 text-amber-600" /> Digital Wallets
                  </span>
                  <span className="font-bold text-slate-900 font-mono">SAR {walletTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Product and category breakdowns nested page view */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-3">
            <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1 border-b pb-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-slate-650" />
              Category of Products Sold Breakdown
            </h4>

            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-[11px]">
              <div className="grid grid-cols-12 font-extrabold text-slate-500 uppercase text-[9px] tracking-wider border-b pb-1">
                <span className="col-span-6">Category Group</span>
                <span className="col-span-2 text-center">Items</span>
                <span className="col-span-4 text-right">Volume (Inc VAT)</span>
              </div>
              {finalCategories.map((cat, id) => (
                <div key={id} className="grid grid-cols-12 items-center text-slate-700 py-0.5 border-b border-slate-100 last:border-none">
                  <span className="col-span-6 font-bold text-slate-900">{cat.name}</span>
                  <span className="col-span-2 text-center font-semibold text-slate-500">{cat.count}</span>
                  <span className="col-span-4 text-right font-black font-mono text-slate-950">SAR {cat.volume.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* If there are products listed, render them elegantly */}
          {computedProducts.length > 0 && (
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-3">
              <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1 border-b pb-1.5">
                <Receipt className="w-3.5 h-3.5 text-slate-650" />
                Product Units Performance
              </h4>

              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-[11px]">
                <div className="grid grid-cols-12 font-extrabold text-slate-500 uppercase text-[9px] tracking-wider border-b pb-1">
                  <span className="col-span-7">Item Description</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-3 text-right">Total Net Volume</span>
                </div>
                {computedProducts.map((prod, id) => (
                  <div key={id} className="grid grid-cols-12 items-center text-slate-700 py-0.5 border-b border-slate-100 last:border-none">
                    <span className="col-span-7 font-semibold text-slate-800 truncate pr-0.5">{prod.name}</span>
                    <span className="col-span-2 text-center font-bold text-slate-500">{prod.quantity}</span>
                    <span className="col-span-3 text-right font-black font-mono text-slate-950">SAR {prod.volume.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-150 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-600 font-bold transition text-xs active:scale-98"
          >
            Go Back
          </button>
          
          <button
            type="button"
            onClick={handleFinalizeClose}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg flex items-center gap-1.5 font-extrabold text-xs shadow-md transition active:scale-98 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm and Close Shift</span>
          </button>
        </div>

      </div>
    </div>
  );
}
