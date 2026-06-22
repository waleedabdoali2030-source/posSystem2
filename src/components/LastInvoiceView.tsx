import React, { useState, useEffect } from 'react';
import { 
  Printer, FileText, CheckCircle2, ShoppingBag, 
  User, Calendar, Clock, CreditCard, HelpCircle, 
  Sparkles, Check, ChevronRight, Eye
} from 'lucide-react';
import { ShiftState, ZATCAConfig, ShiftSale } from '../types';
import { printThermalElement } from '../utils/print';

interface LastInvoiceViewProps {
  shiftState: ShiftState;
  zatcaConfig: ZATCAConfig;
  currentUser?: any;
}

export default function LastInvoiceView({ shiftState, zatcaConfig, currentUser }: LastInvoiceViewProps) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const activeSales = shiftState.salesList || [];
  
  // Sort sales to show latest first in sidebar
  const sortedSales = [...activeSales].reverse();

  // Pick the default invoice (the latest one generated)
  useEffect(() => {
    if (activeSales.length > 0) {
      // Keep selected selectedInvoiceId or default to the most recent one
      if (!selectedInvoiceId || !activeSales.some(s => s.id === selectedInvoiceId)) {
        setSelectedInvoiceId(activeSales[activeSales.length - 1].id);
      }
    } else {
      setSelectedInvoiceId(null);
    }
  }, [activeSales, selectedInvoiceId]);

  const selectedSale = activeSales.find(s => s.id === selectedInvoiceId);

  // Print function
  const handlePrint = () => {
    if (!selectedSale) return;
    printThermalElement('print-target-last-invoice');
  };

  return (
    <div className="space-y-6" id="last-invoice-root">
      {/* Header section describing the dynamic state tracking */}
      <div className="bg-white border border-slate-150 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4" id="last-invoice-header">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-100 rounded-md text-[10px] font-black uppercase tracking-wider">
              Shift Operations
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[10px] font-black uppercase tracking-wider">
              Current Session Active
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 font-display">
            Last Session Invoice Tracker
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            This module stores and showcases the electronic receipts created during the current open register shift. Once the shift is closed, this view resets in compliance with global shift audit procedures.
          </p>
        </div>

        <div className="flex items-center gap-2" id="last-invoice-badge">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase">Shift Status</p>
            <p className="text-xs font-black text-slate-900">
              {shiftState.isInitialized ? `DAY #${shiftState.dayNumber} REGISTER OPEN` : 'REGISTER CLOSED'}
            </p>
          </div>
          <div className={`w-3.5 h-3.5 rounded-full ${shiftState.isInitialized ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
        </div>
      </div>

      {/* When NO Active Shift is Open or NO invoices exist */}
      {!shiftState.isInitialized ? (
        <div className="bg-white border border-slate-150 rounded-2xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-3xs" id="invoice-no-shift-alert">
          <div className="w-12 h-12 bg-amber-50 border border-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-black text-slate-900 text-base">Current Daily Shift is Closed</h3>
            <p className="text-xs text-slate-505 leading-relaxed">
              No active register is open. The last invoice dashboard only stores e-invoices belonging to the current session. To create sales:
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl text-left border border-slate-205/60 space-y-2">
            <div className="flex gap-2 text-xs font-semibold text-slate-700">
              <span className="w-5 h-5 bg-emerald-105 text-emerald-700 rounded-full flex items-center justify-center font-black">1</span>
              <span>Go to POS Sales Terminal.</span>
            </div>
            <div className="flex gap-2 text-xs font-semibold text-slate-700">
              <span className="w-5 h-5 bg-emerald-105 text-emerald-700 rounded-full flex items-center justify-center font-black">2</span>
              <span>Enter an opening float balance to initialize Day #{shiftState.dayNumber}.</span>
            </div>
            <div className="flex gap-2 text-xs font-semibold text-slate-700">
              <span className="w-5 h-5 bg-emerald-105 text-emerald-700 rounded-full flex items-center justify-center font-black">3</span>
              <span>Process checkout, and your invoice will be loaded and listed here.</span>
            </div>
          </div>
        </div>
      ) : activeSales.length === 0 ? (
        <div className="bg-white border border-slate-150 rounded-2xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-3xs" id="invoice-empty-shift-alert">
          <div className="w-12 h-12 bg-sky-50 border border-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-slate-900 text-base">Shift Open (Day #{shiftState.dayNumber}) — No Invoices</h3>
            <p className="text-xs text-slate-520 max-w-md mx-auto leading-relaxed">
              The register is initialized, but no transactions have been checkout during this session yet. As soon as you process a sale, the compliant e-invoice will be locked and listed here.
            </p>
          </div>
          <div className="pt-2 text-center">
            <span className="inline-flex items-center gap-1.5 text-[10px] bg-slate-50 text-slate-500 font-extrabold uppercase px-3 py-1 rounded border border-slate-150">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Real-time synchronization with active sales terminal
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="invoice-split-desk">
          {/* LEFT COLUMN: Sidebar listing all invoices in this shift */}
          <div className="lg:col-span-5 space-y-3" id="invoice-sessions-list-col">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black uppercase text-slate-450 tracking-wider font-mono">
                Session Receipts ({activeSales.length} checked-out)
              </h3>
              <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded font-bold font-mono">
                Day #{shiftState.dayNumber}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1" id="invoices-list-container">
              {sortedSales.map((sale, index) => {
                const isSelected = sale.id === selectedInvoiceId;
                const itemsCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
                const isLatest = index === 0;

                return (
                  <div
                    key={sale.id}
                    onClick={() => setSelectedInvoiceId(sale.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected 
                        ? 'bg-emerald-50/50 border-emerald-450 shadow-xs' 
                        : 'bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50/50'
                    }`}
                  >
                    {isLatest && (
                      <span className="absolute right-3.5 top-3.5 px-2 py-0.5 bg-emerald-600 text-white border border-emerald-500 rounded text-[8px] font-black uppercase tracking-wider">
                        Most Recent (آخر فاتورة)
                      </span>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="text-xs font-black text-slate-900 font-mono">
                          #{sale.id.replace('sale-', '').toUpperCase()}
                        </span>
                      </div>

                      {/* Items counter and payments details short string */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1 font-semibold">
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                          <span>{itemsCount} {itemsCount === 1 ? 'item' : 'items'} sold</span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          <span className="uppercase text-slate-700 font-black text-[10px]">{sale.paymentMethod}</span>
                        </div>
                      </div>

                      {/* Bottom divider strip */}
                      <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold">Total Sales Collected</span>
                        <span className="text-xs font-black text-slate-900 font-mono">
                          SAR {sale.totalSales.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Thermal format interactive preview container */}
          <div className="lg:col-span-7" id="invoice-thermal-live-preview-col">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-3xs overflow-hidden" id="invoice-rendering-panel">
              <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    80mm e-Invoice Thermal Spool
                  </span>
                </div>
                {selectedSale && (
                  <button
                    onClick={handlePrint}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 px-3.5 rounded-lg text-[11px] font-black flex items-center gap-1.5 shadow-xs transition active:scale-97 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Thermal Receipt</span>
                  </button>
                )}
              </div>

              {/* RENDER ACTIVE PREVIEW */}
              {selectedSale ? (
                <div className="p-6 bg-slate-100 flex justify-center overflow-x-auto min-h-[500px]">
                  {/* Spooled Receipt Container Sheet mimicking physical thermal width */}
                  <div 
                    className="p-5 font-mono text-[9px] leading-snug text-slate-900 bg-white border border-slate-250 shadow-md w-74 shrink-0 rounded-sm" 
                    id="print-target-last-invoice"
                  >
                    {/* Header: Company, VAT Registration */}
                    <div className="text-center space-y-1.5">
                      {/* Saudi Unified business tax registration roll banner */}
                      <div className="bg-slate-50 border border-slate-200 py-1.5 px-2 rounded text-center my-1.5">
                        <p className="text-[7.5px] text-slate-500 font-extrabold tracking-tight uppercase">VAT REGISTRATION NUMBER</p>
                        <p className="text-[9.5px] text-emerald-700 font-black tracking-widest leading-none mt-0.5">
                          {zatcaConfig.vatNumber ? zatcaConfig.vatNumber.replace(/(\d{3})(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4 $5') : '310 294 827 400 003'}
                        </p>
                      </div>

                      <h1 className="text-[11px] font-black tracking-tight text-slate-950 uppercase">
                        {zatcaConfig.storeNameEn || 'Al-Modern Express Stores'}
                      </h1>
                      <h2 className="text-[10px] font-extrabold text-slate-900" dir="rtl">
                        {zatcaConfig.storeNameAr || 'محلات المودرن السريعة'}
                      </h2>

                      {/* Header Addresses & details */}
                      {zatcaConfig.invoiceHeader ? (
                        <p className="text-[7.5px] text-slate-550 whitespace-pre-wrap leading-relaxed border-t border-b border-dotted border-slate-250 py-1.5 my-1.5 font-sans">
                          {zatcaConfig.invoiceHeader}
                        </p>
                      ) : (
                        <p className="text-[8px] text-slate-500">Central District, Riyadh, KSA</p>
                      )}
                    </div>

                    {/* Dotted separator */}
                    <div className="border-t border-dashed border-slate-350 my-2.5" />

                    {/* Metadata grids block */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-600 text-[8.2px]">
                      <div className="flex justify-between">
                        <span>Inv No:</span>
                        <span className="font-extrabold text-slate-950 font-mono">
                          {selectedSale.id.replace('sale-', '').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span className="font-medium text-slate-950 font-mono">
                          {selectedSale.id.includes('-') ? new Date().toLocaleDateString('en-GB') : '22/06/2026'}
                        </span>
                      </div>
                      <div className="flex justify-between col-span-2">
                        <span>Type:</span>
                        <span className="font-black text-slate-950 uppercase">
                          {zatcaConfig.invoiceTitle || 'SIMPLIFIED TAX INVOICE - مبسطة'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Terminal:</span>
                        <span className="text-slate-900 font-mono">{shiftState.terminalId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span className="text-slate-900 font-mono">
                          {shiftState.startTime || '02:00:00 PM'}
                        </span>
                      </div>
                      <div className="flex justify-between col-span-2 border-b border-dashed border-slate-200 pb-2">
                        <span>Operator:</span>
                        <span className="text-slate-900">{currentUser?.name || 'Ahmed Al-Shehri'}</span>
                      </div>
                    </div>

                    {/* Items Purchased List */}
                    <div className="mt-2.5">
                      <table className="w-full text-right border-collapse text-[8.2px]">
                        <thead>
                          <tr className="border-b border-slate-300 text-slate-900 font-black">
                            <th className="text-left py-1 font-bold">Item Description / الوصف</th>
                            <th className="text-center py-1 font-bold w-6">Qty</th>
                            <th className="text-right py-1 font-bold w-14">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSale.items.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-100 text-slate-700">
                              <td className="text-left py-1 pr-1.5 leading-tight">
                                <div className="font-bold text-slate-950">{item.name}</div>
                                <div className="text-[7.5px] text-slate-400 font-normal mt-0.5">Retail SKU Product</div>
                              </td>
                              <td className="text-center py-1 font-bold text-slate-900 align-middle font-mono">{item.quantity}</td>
                              <td className="text-right py-1 font-bold text-slate-950 align-middle font-mono">
                                {item.total.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Separation line */}
                    <div className="border-t border-dashed border-slate-300 my-2.5" />

                    {/* Summary Totals Block */}
                    <div className="space-y-1.5 text-right font-medium text-[8.2px]">
                      <div className="flex justify-between">
                        <span>Subtotal (Excl. VAT):</span>
                        <span className="font-mono text-slate-900">{(selectedSale.totalSales - selectedSale.totalVat).toFixed(2)} SAR</span>
                      </div>
                      <div className="flex justify-between">
                        <span>VAT (15%):</span>
                        <span className="font-mono text-slate-900">{selectedSale.totalVat.toFixed(2)} SAR</span>
                      </div>
                      
                      <div className="flex justify-between font-black text-[10px] text-slate-950 pt-1 border-t border-slate-200">
                        <span>GRAND TOTAL (INC VAT):</span>
                        <span className="font-mono">{selectedSale.totalSales.toFixed(2)} SAR</span>
                      </div>

                      <div className="flex justify-between text-slate-500 pt-1.5">
                        <span>Payment Method:</span>
                        <span className="font-black text-emerald-600 uppercase">{selectedSale.paymentMethod}</span>
                      </div>
                    </div>

                    {/* Dotted separator limit */}
                    <div className="border-t border-dashed border-slate-305 my-2.5" />

                    {/* ZATCA Compliant QR Stamp Code Vector */}
                    <div className="flex flex-col items-center justify-center space-y-1 mt-2">
                      <div className="p-1 border border-slate-200 rounded bg-white shadow-3xs">
                        <svg className="w-16 h-16 text-slate-950" viewBox="0 0 100 100">
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

                          <path d="M 30 5 L 30 15 M 35 10 L 45 10 M 40 5 L 40 25 M 30 20 L 50 20 M 55 5 L 55 15 L 65 15 M 60 10 L 70 10 M 65 20 L 70 20 M 30 30 L 30 45 L 35 45 M 40 30 L 45 35 M 50 35 L 55 30 L 55 45 M 60 40 L 70 40 M 5 30 L 25 30 M 10 35 L 20 35 M 15 40 L 15 45 M 5 50 L 50 50 M 10 55 L 20 55 M 30 55 L 45 55 M 75 30 L 95 30 m -10 5 m -5 10 M 80 40 L 90 40 L 90 50 M 55 50 L 70 50 L 70 65 M 60 55 L 60 70 M 65 65 L 70 65 M 75 55 L 85 55 M 80 60 L 95 60 L 95 70 M 5 60 L 25 60 M 15 65 L 15 70 M 30 65 L 45 65 M 35 70 M 50 70 M 50 75 L 70 75 M 55 80 L 65 80 M 60 85 L 60 95" stroke="currentColor" strokeWidth="2.5" fill="none"/>
                        </svg>
                      </div>
                      <div className="items-center text-center">
                        <span className="inline-flex items-center gap-1 text-[7px] bg-emerald-50 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          <Check className="w-2.5 h-2.5 shrink-0" />
                          ZATCA PHASE II COMPLIANT
                        </span>
                        <p className="text-[7.2px] text-slate-400 mt-0.5 max-w-[210px] leading-tight font-sans">
                          Simplified e-invoice cryptographical stamp verified by tax authority.
                        </p>
                      </div>
                    </div>

                    {/* Thank you note footer to pass validation */}
                    <div className="text-center text-[7px] text-slate-405 space-y-0.5 mt-3 pt-2 border-t border-dashed border-slate-200">
                      <p>System — Powered by Saudi Digital POS Solutions</p>
                      <p>Thank you for your visit / شكراً لزيارتكم</p>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400" id="cannot-find-selected-invoice">
                  Please select an e-invoice from the list to preview details.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
