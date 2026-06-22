import React, { useState } from 'react';
import { Printer, Search, Calendar, User, ShieldCheck, HelpCircle, Eye, RefreshCw, Layers } from 'lucide-react';
import { Closure, ShiftState } from '../types';

interface ClosedShiftsViewProps {
  closures: Closure[];
  onPrintEOD: (cls: Closure) => void;
  shiftState: ShiftState;
}

export default function ClosedShiftsView({ closures, onPrintEOD, shiftState }: ClosedShiftsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Calculate active draft shift details
  const activeSales = shiftState.salesList || [];
  const activeTotalSales = activeSales.reduce((sum, s) => sum + s.totalSales, 0);
  const activeTotalVat = activeSales.reduce((sum, s) => sum + s.totalVat, 0);

  const mapShiftToClosure = (shift: ShiftState): Closure => {
    const sales = shift.salesList || [];
    const totalSales = sales.reduce((sum, s) => sum + s.totalSales, 0);
    const totalVat = sales.reduce((sum, s) => sum + s.totalVat, 0);

    const categoryMap: { [name: string]: { count: number; volume: number } } = {};
    const productMap: { [name: string]: { quantity: number; volume: number } } = {};
    const paymentMap: { [name: string]: number } = {
      'Mada Network / Cards': shift.madaSales,
      'Drawer Cash': shift.cashSales,
      'Credit Cards': shift.creditCardSales,
      'Digit Wallet / QR codes': shift.walletSales,
    };

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const catName = item.categoryName || 'General Items';
        if (!categoryMap[catName]) {
          categoryMap[catName] = { count: 0, volume: 0 };
        }
        categoryMap[catName].count += item.quantity;
        categoryMap[catName].volume += item.total;

        const prodName = item.name;
        if (!productMap[prodName]) {
          productMap[prodName] = { quantity: 0, volume: 0 };
        }
        productMap[prodName].quantity += item.quantity;
        productMap[prodName].volume += item.total;
      });

      const payName = sale.paymentMethod === 'mada' ? 'Mada Network / Cards' : 
                      sale.paymentMethod === 'cash' ? 'Drawer Cash' : 
                      sale.paymentMethod === 'credit' ? 'Credit Cards' : 
                      sale.paymentMethod === 'wallet' ? 'Digit Wallet / QR codes' : sale.paymentMethod;
      if (payName) {
        paymentMap[payName] = (paymentMap[payName] || 0) + sale.totalSales;
      }
    });

    const categorySales = Object.keys(categoryMap).map(key => ({
      name: key,
      count: categoryMap[key].count,
      volume: categoryMap[key].volume
    }));

    const productSales = Object.keys(productMap).map(key => ({
      name: key,
      quantity: productMap[key].quantity,
      volume: productMap[key].volume
    }));

    const paymentSales = Object.keys(paymentMap)
      .map(key => ({
        name: key,
        volume: paymentMap[key]
      }))
      .filter(pm => pm.volume > 0);

    return {
      id: `draft-shift-${shift.dayNumber}`,
      dayNumber: shift.dayNumber,
      date: shift.startTime ? shift.startTime.substring(0, 10) : new Date().toISOString().substring(0, 10),
      closedBy: shift.isInitialized ? 'Live Operator Session' : 'Uninitialized Shift',
      totalSales,
      totalVat,
      zatcaStatus: 'Pending',
      categorySales: categorySales.length > 0 ? categorySales : [
        { name: 'General Retail Items', count: sales.length, volume: totalSales }
      ],
      productSales: productSales,
      paymentSales: paymentSales.length > 0 ? paymentSales : [
        { name: 'Mada Network / Cards', volume: shift.madaSales },
        { name: 'Drawer Cash', volume: shift.cashSales }
      ].filter(p => p.volume > 0)
    };
  };

  const activeShiftClosure = mapShiftToClosure(shiftState);

  // 2. Statistics includes closed history + open work in progress option
  const totalClosedShifts = closures.length;
  const totalVolumeAllTime = closures.reduce((curr, c) => curr + c.totalSales, 0);
  const totalTaxAllTime = closures.reduce((curr, c) => curr + c.totalVat, 0);

  // 3. Filter closures based on search query (operator name, date, day number)
  const filteredClosures = closures.filter(c => {
    const closedByMatch = c.closedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const dateMatch = c.date.includes(searchQuery);
    const dayNumberMatch = `day ${c.dayNumber}`.includes(searchQuery.toLowerCase()) || c.dayNumber.toString().includes(searchQuery);
    return closedByMatch || dateMatch || dayNumberMatch;
  });

  return (
    <div className="space-y-6" id="closed-shifts-view-hub">
      {/* Upper header */}
      <div className="bg-white border border-slate-150 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4" id="closed-shifts-header">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-100 rounded-md text-[10px] font-black uppercase tracking-wider">
              Audit Register Hub
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[10px] font-black uppercase tracking-wider">
              Thermal 80mm Roll Configured
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 font-display">
            Daily Shifts & Registers Log
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Track daily open/active sessions and previous closed days. Instantly preview or print real-time X-Draft reports and official closed Z-Reports.
          </p>
        </div>

        {/* Search Bar filter */}
        <div className="relative max-w-sm w-full" id="shift-search-wrap">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search day #, supervisor, date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/25 transition"
          />
        </div>
      </div>

      {/* Tally Stats indicators strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="closures-stats-strip">
        <div className="bg-white border border-slate-150 p-5 rounded-2xl space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Closed History Logs</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-950 font-mono">{totalClosedShifts}</h3>
            <span className="text-[10px] text-slate-400 font-bold">Z-Report Batches</span>
          </div>
        </div>

        <div className="bg-white border border-slate-150 p-5 rounded-2xl space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Archived Sales Volume</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-emerald-600 font-mono">SAR {totalVolumeAllTime.toFixed(2)}</h3>
            <span className="text-[10px] text-slate-400 font-bold">With 15% VAT</span>
          </div>
        </div>

        <div className="bg-white border border-slate-150 p-5 rounded-2xl space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Government Taxes</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-950 font-mono">SAR {totalTaxAllTime.toFixed(2)}</h3>
            <span className="text-[10px] text-emerald-600 font-extrabold font-mono">15% VAT</span>
          </div>
        </div>
      </div>

      {/* Main Shift listing table representing open/close statuses */}
      <div className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden shadow-xs" id="closures-table-dashboard">
        <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between shrink-0">
          <h3 className="text-xs font-black uppercase text-slate-450 tracking-wider font-mono">
            Register History Log (Open / Closed Shift Register)
          </h3>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold bg-white px-2 py-1 rounded border border-slate-200">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Click 'Preview' or 'Reprint' to print on thermal rolls</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-150">
                <th className="py-3 px-5 text-center">Day #</th>
                <th className="py-3 px-4 text-center">Register Status</th>
                <th className="py-3 px-4">Date / Opened At</th>
                <th className="py-3 px-4">Terminal Session Handler</th>
                <th className="py-3 px-4 text-right">Standard Taxes (15%)</th>
                <th className="py-3 px-4 text-right">Sales Volume</th>
                <th className="py-3 px-4 text-center">Breakdowns</th>
                <th className="py-3 px-5 text-right">Reprint Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              
              {/* CURRENT ACTIVE SHIFT ROW */}
              {(!searchQuery || `day ${activeShiftClosure.dayNumber}`.toLowerCase().includes(searchQuery.toLowerCase()) || activeShiftClosure.dayNumber.toString().includes(searchQuery)) && (
                <tr className="bg-emerald-50/40 hover:bg-emerald-50/60 transition-colors border-l-4 border-emerald-500">
                  {/* Day Number */}
                  <td className="py-3.5 px-5 text-center">
                    <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-250 font-black font-mono rounded-md">
                      Day {activeShiftClosure.dayNumber}
                    </span>
                  </td>

                  {/* Register Status Indicator */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      STILL OPEN
                    </span>
                  </td>

                  {/* Current Date */}
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{activeShiftClosure.date} (Today)</span>
                    </div>
                  </td>

                  {/* Session User */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-800 font-bold">{shiftState.isInitialized ? 'Live Cashier / General' : 'Awaiting Opening Float'}</span>
                    </div>
                  </td>

                  {/* Taxes */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-500">
                    SAR {activeTotalVat.toFixed(2)}
                  </td>

                  {/* Volume */}
                  <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700">
                    SAR {activeTotalSales.toFixed(2)}
                  </td>

                  {/* Breakdowns counts */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-extrabold uppercase">
                      {activeSales.length} Live Sales Registered
                    </span>
                  </td>

                  {/* Actions for Live Draft / X-Report */}
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => onPrintEOD(activeShiftClosure)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 px-3 rounded-lg text-[10.5px] font-black flex items-center gap-1.5 shadow-sm transition active:scale-97 cursor-pointer"
                        title="Print real-time interim X-Report draft on thermal printer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Live Draft (X-Report)</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* PAST ARCHIVED SHIFTS ROWS */}
              {filteredClosures.map((cls) => {
                const productSalesCount = cls.productSales?.reduce((sum, p) => sum + p.quantity, 0) || 0;
                return (
                  <tr key={cls.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Day Number */}
                    <td className="py-3.5 px-5 text-center">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-200 font-black font-mono text-slate-900 rounded-md">
                        Day {cls.dayNumber}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 text-slate-650 border border-slate-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        CLOSED
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{cls.date}</span>
                      </div>
                    </td>

                    {/* Operator */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-sky-450 shrink-0" />
                        <span>{cls.closedBy}</span>
                      </div>
                    </td>

                    {/* Taxes */}
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-500">
                      SAR {cls.totalVat.toFixed(2)}
                    </td>

                    {/* Total Sales */}
                    <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                      SAR {cls.totalSales.toFixed(2)}
                    </td>

                    {/* Category counting */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-[10px] bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded font-bold uppercase">
                        {cls.paymentSales ? `${cls.paymentSales.length} methods` : '1 payment'} • {productSalesCount > 0 ? `${productSalesCount} items` : 'Consolidated'}
                      </span>
                    </td>

                    {/* Reprint Button */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => onPrintEOD(cls)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 p-1.5 px-2.5 rounded-lg text-[10.5px] font-bold flex items-center gap-1.5 transition active:scale-97 cursor-pointer"
                          title="Quick preview report layout on-screen"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Preview</span>
                        </button>
                        
                        <button
                          onClick={() => onPrintEOD(cls)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 px-3 rounded-lg text-[10.5px] font-black flex items-center gap-1.5 shadow-xs transition active:scale-97 cursor-pointer"
                          title="Reprint official Z-Report directly to POS roll printer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Reprint Official Z-Report</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Helpful Info banner */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h5 className="text-xs font-extrabold text-slate-800">Thermal Printing roll tip (80mm / 3 inch)</h5>
          <p className="text-[11px] text-slate-500 max-w-3xl leading-relaxed">
            The reprinted daily Z-Reports are automatically form-fitted for thermal paper roll widths. Spooled margins, dotted line dividers, and high-contrast styling are applied to minimize thermal ink wear and speed up daily supervisor signoffs.
          </p>
        </div>
      </div>
    </div>
  );
}
