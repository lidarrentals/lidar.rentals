import React from 'react';
import { formatCurrency, formatDate } from '@/lib/pricing';

interface SummaryProps {
  items: any[];
  total: number;
  shippingCost: number;
}

export default function CheckoutSummary({ items, total, shippingCost }: SummaryProps) {
  // Safe Date parsing utility wrapper to prevent layout thread freezing
  const renderSafeDate = (dateVal: any) => {
    if (!dateVal) return 'N/A';
    try {
      const parsedDate = new Date(dateVal);
      // If the date parsing results in an invalid timestamp, fall back gracefully
      if (isNaN(parsedDate.getTime())) {
        return String(dateVal);
      }
      return formatDate(parsedDate);
    } catch (e) {
      return String(dateVal);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h2>
        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto mb-4 pr-2">
          {items.map((item, idx) => (
            <div key={idx} className="py-3 first:pt-0 last:pb-0 flex justify-between items-start gap-4">
              <div>
                <h4 className="font-medium text-slate-900 text-sm">{item.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {item.quantity}x • {item.rentalPeriod} days ({renderSafeDate(item.startDate)} - {renderSafeDate(item.endDate)})
                </p>
              </div>
              <span className="font-semibold text-slate-900 text-sm">{formatCurrency(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Rental Subtotal</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Round-Trip Shipping</span>
            <span>{shippingCost > 0 ? formatCurrency(shippingCost) : 'Calculated in form'}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
            <span>Estimated Total</span>
            <span>{formatCurrency(total + shippingCost)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
