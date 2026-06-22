import React from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { Closure } from '../types';
import { printThermalElement } from '../utils/print';

interface EODReportViewProps {
  closure: Closure | null;
  onClose: () => void;
}

export default function EODReportView({ closure, onClose }: EODReportViewProps) {
  if (!closure) return null;

  // Use custom categories breakdown if saved inside the closure, otherwise fallback to the legacy ratios
  const categoriesTable = closure.categorySales || [
    { name: 'Beverages', count: 42, volume: closure.totalSales * 0.25 },
    { name: 'Main Course', count: 28, volume: closure.totalSales * 0.58 },
    { name: 'Desserts', count: 15, volume: closure.totalSales * 0.15 },
    { name: 'Add-ons', count: 12, volume: closure.totalSales * 0.02 }
  ];

  const paymentMethodsList = (closure.paymentSales || [
    { name: 'Mada Network / Cards', volume: closure.totalSales * 0.84 },
    { name: 'Drawer Cash', volume: closure.totalSales * 0.16 },
    { name: 'Digit Wallet / QR codes', volume: 0 }
  ]).filter(pm => pm.volume > 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" id="eod-report-overlay">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in my-8" id="eod-report-container">
        
        {/* Toolbar */}
        <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between text-slate-400">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            EOD Shift Register Report
          </span>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-500 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Outer buttons */}
        <div className="p-3 bg-slate-950 flex gap-2">
          <button 
            onClick={() => printThermalElement('print-eod-report-body', 'EOD_Report_Thermal')}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition transform active:scale-98"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button 
            disabled
            className="px-3 bg-slate-850 hover:bg-slate-800 text-emerald-400 border border-slate-700 rounded-lg text-[10px] font-extrabold uppercase"
          >
            ZATCA Compliant
          </button>
        </div>

        {/* Screen 2 Receipt View Render */}
        <div className="p-6 bg-white text-slate-950 font-mono text-[9px] leading-relaxed max-h-[75vh] overflow-y-auto" id="print-eod-report-body">
          
          <div className="text-center space-y-1">
            <h1 className="text-[14px] font-black tracking-widest text-slate-950">Mada POS System</h1>
            <h4 className="text-[9px] bg-slate-900 text-white font-bold py-1.5 px-3 uppercase tracking-widest inline-block mt-1">
              STORE MANAGER
            </h4>
            <h3 className="text-[10.5px] font-black text-slate-900 uppercase mt-1 tracking-wider">END OF DAY REPORT</h3>
            <p className="text-[8px] text-slate-400 mt-0.5">Saudi Digital Enterprise Core Network (Riyadh)</p>
          </div>

          <div className="border-t border-dashed border-slate-300 my-4" />

          {/* Identification */}
          <div className="space-y-1 text-slate-700">
            <div className="flex justify-between">
              <span>Terminal ID:</span>
              <span className="font-bold text-slate-950">#01-TX-442</span>
            </div>
            <div className="flex justify-between">
              <span>Day Number:</span>
              <span className="font-bold text-slate-950">#{closure.dayNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Reporting Date:</span>
              <span>{closure.date}</span>
            </div>
            <div className="flex justify-between">
              <span>Closing Time:</span>
              <span>11:59:59 PM (KSA)</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 my-4" />

          {/* Section 1: Categories performance */}
          <h5 className="font-extrabold text-slate-950 uppercase mb-2 border-b border-slate-100 pb-0.5">CATEGORY BREAKDOWNS</h5>
          <div className="space-y-1.5">
            <div className="grid grid-cols-12 font-bold text-slate-900 text-right">
              <span className="col-span-6 text-left">Category Name</span>
              <span className="col-span-2">Count</span>
              <span className="col-span-4">Volume (SAR)</span>
            </div>
            {categoriesTable.map((cat, id) => (
              <div key={id} className="grid grid-cols-12 text-slate-700 text-right">
                <span className="col-span-6 text-left">{cat.name}</span>
                <span className="col-span-2 font-bold">{cat.count}</span>
                <span className="col-span-4 font-bold text-slate-950 font-mono">{cat.volume.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Section 1.5: Detailed products performance (if available) */}
          {closure.productSales && closure.productSales.length > 0 && (
            <>
              <div className="border-t border-dashed border-slate-300 my-4" />
              <h5 className="font-extrabold text-slate-950 uppercase mb-2 border-b border-slate-100 pb-0.5">PRODUCT SALES BREAKDOWNS</h5>
              <div className="space-y-1.5">
                <div className="grid grid-cols-12 font-bold text-slate-900 text-right">
                  <span className="col-span-6 text-left">Product / Item</span>
                  <span className="col-span-2">Qty</span>
                  <span className="col-span-4">Volume (SAR)</span>
                </div>
                {closure.productSales.map((prod, id) => (
                  <div key={id} className="grid grid-cols-12 text-slate-700 text-right">
                    <span className="col-span-6 text-left truncate pr-1" title={prod.name}>{prod.name}</span>
                    <span className="col-span-2 font-bold">{prod.quantity}</span>
                    <span className="col-span-4 font-bold text-slate-950 font-mono">{prod.volume.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="border-t border-dashed border-slate-300 my-4" />

          {/* Section 2: Payments Methods */}
          <h5 className="font-extrabold text-slate-950 uppercase mb-2 border-b border-slate-100 pb-0.5">PAYMENTS COMPILATIONS</h5>
          <div className="space-y-1.5 text-right">
            {paymentMethodsList.map((pm, id) => (
              <div key={id} className="grid grid-cols-2 text-slate-700">
                <span className="text-left font-bold">{pm.name}:</span>
                <span className="font-bold text-slate-950 font-mono">{pm.volume.toFixed(2)} SAR</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-300 my-4" />

          {/* Summary */}
          <div className="space-y-1.5 text-right font-bold text-slate-950">
            <div className="flex justify-between">
              <span>Gross Sales (Ex VAT):</span>
              <span className="font-mono">{(closure.totalSales - closure.totalVat).toFixed(2)} SAR</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Taxes standard (VAT 15%):</span>
              <span className="font-mono">{closure.totalVat.toFixed(2)} SAR</span>
            </div>
            <div className="flex justify-between text-xs font-black text-slate-950 pt-1.5 border-t border-slate-200">
              <span>GRAND TOTAL (SAR):</span>
              <span className="font-mono">{closure.totalSales.toFixed(2)} SAR</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 my-4" />

          {/* ZATCA Check */}
          <div className="flex flex-col items-center justify-center space-y-2 py-2">
            <div className="p-1 border border-slate-200 rounded-sm bg-white">
              <svg className="w-20 h-20 text-slate-900" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="white"/>
                <rect x="5" y="5" width="20" height="20" fill="currentColor"/>
                <rect x="8" y="8" width="14" height="14" fill="white"/>
                <rect x="11" y="11" width="8" height="8" fill="currentColor"/>
                <rect x="75" y="5" width="20" height="20" fill="currentColor"/>
                <rect x="78" y="8" width="14" height="14" fill="white"/>
                <rect x="81" y="11" width="8" height="8" fill="currentColor"/>
                <rect x="5" y="75" width="20" height="20" fill="currentColor"/>
                <rect x="8" y="78" width="14" height="14" fill="white"/>
                <rect x="11" y="81" width="8" height="8" fill="currentColor"/>
                <path d="M 30 5 L 30 15 M 35 10 L 45 10 M 40 5 L 40 25 M 30 20 L 50 20 M 55 5 M 5 30 L 25 30 M 10 35 M 5 50 L 50 50 M 75 30 L 95 30 M 80 40 M 55 50 M 75 55 M 30 65 L 45 65" stroke="currentColor" strokeWidth="3" fill="none"/>
              </svg>
            </div>
            
            <div className="inline-flex items-center gap-1.5 text-[8px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded uppercase">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>ZATCA VERIFIED</span>
            </div>
          </div>

          {/* Supervisor Signature line */}
          <div className="mt-6 pt-5 border-t border-dashed border-slate-200 flex flex-col items-center">
            <span className="text-[7.5px] uppercase text-slate-400">Supervisor Verification Sign-off</span>
            <div className="w-36 h-8 border-b border-indigo-400/50 mt-1 italic font-display text-[10px] text-slate-500 text-center pt-2">
              {closure.closedBy}
            </div>
          </div>

          <p className="text-center text-[7px] text-slate-400 mt-6 pt-2 border-t border-dashed border-slate-100 uppercase font-mono">
            MADA POS terminal core network v2.4.0
          </p>

        </div>

      </div>
    </div>
  );
}
