import React, { useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/pricing';

interface RentalItem {
  id: string; // Needed for backend lookup
  name: string;
  quantity: number;
  rentalPeriod: number;
  startDate: string;
  endDate: string;
  lineTotal: number;
}

interface SummaryProps {
  items: RentalItem[];
  total: number;
  shippingCost: number;
}

export default function CheckoutSummary({ items, total, shippingCost }: SummaryProps) {
  const [isLoading, setIsLoading] = useState(false);

  const renderSafeDate = (dateVal: any) => {
    if (!dateVal) return 'N/A';
    try {
      const parsedDate = new Date(dateVal);
      if (isNaN(parsedDate.getTime())) return String(dateVal);
      return formatDate(parsedDate);
    } catch (e) {
      return String(dateVal);
    }
  };

  // Securely hand off cart data to your server
  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, shippingCost }),
      });

      const { url, error } = await response.json();
      
      if (error) {
        alert(`Checkout Error: ${error}`);
        return;
      }

      // Redirect the user securely to Stripe's hosted page
      if (url) window.location.href = url;
    } catch (err) {
      console.error("Payment routing error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h2>
        
        {/* Cart items list */}
        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto mb-4 pr-2">
          {items.map((item, idx) => (
            <div key={idx} className="py-3 flex justify-between items-start gap-4">
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

        {/* Pricing Totals */}
        <div className="border-t border-slate-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Rental Subtotal</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Round-Trip Shipping</span>
            <span>{shippingCost > 0 ? formatCurrency(shippingCost) : 'Calculated in form'}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100 mb-4">
            <span>Estimated Total</span>
            <span>{formatCurrency(total + shippingCost)}</span>
          </div>
        </div>

        {/* Stripe Call to Action */}
        <button
          onClick={handleCheckout}
          disabled={isLoading || items.length === 0}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition disabled:bg-slate-300 disabled:cursor-not-allowed text-sm flex justify-center items-center"
        >
          {isLoading ? (
            <span className="animate-pulse">Processing Order...</span>
          ) : (
            `Pay ${formatCurrency(total + shippingCost)} with Stripe`
          )}
        </button>
      </div>
    </div>
  );
}
