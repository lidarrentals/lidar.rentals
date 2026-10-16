import { useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/pricing';

export interface RentalItem {
  id?: string;
  itemId?: string;
  name: string;
  quantity: number;
  rentalPeriod: number | string;
  startDate: string;
  endDate: string;
  lineTotal: number;
  unitPrice?: number;
}

interface SummaryProps {
  items: RentalItem[] | any[];
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
    } catch {
      return String(dateVal);
    }
  };

  // Securely hand off cart data to the Stripe checkout backend endpoint
  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id || item.itemId,
            name: item.name,
            quantity: item.quantity || 1,
            rentalPeriod: item.rentalPeriod,
            startDate: item.startDate,
            endDate: item.endDate,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          })),
          shippingCost,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to initialize Stripe checkout session');
      }

      // Redirect user to Stripe's checkout session URL
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Payment routing error:', err);
      alert(`Stripe Checkout notice: ${err.message || 'Unable to connect to Stripe checkout server'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h2>

        {/* Cart items list */}
        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto mb-4 pr-2">
          {items.map((item, idx) => (
            <div key={idx} className="py-3 flex justify-between items-start gap-4">
              <div>
                <h4 className="font-medium text-slate-900 text-sm">{item.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {item.quantity}x • {typeof item.rentalPeriod === 'number' ? `${item.rentalPeriod} days` : item.rentalPeriod} ({renderSafeDate(item.startDate)} - {renderSafeDate(item.endDate)})
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
            <span>Round-Trip Delivery</span>
            <span>{shippingCost > 0 ? formatCurrency(shippingCost) : 'Calculated via address'}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100 mb-4">
            <span>Estimated Total</span>
            <span>{formatCurrency(total + shippingCost)}</span>
          </div>
        </div>

        {/* Pay with Stripe Call to Action */}
        <button
          onClick={handleCheckout}
          disabled={isLoading || items.length === 0}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-4 rounded-xl transition duration-150 disabled:bg-slate-300 disabled:cursor-not-allowed text-sm flex justify-center items-center shadow-md hover:shadow-lg cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
              Redirecting to Stripe...
            </span>
          ) : (
            `Pay ${formatCurrency(total + shippingCost)} with Stripe`
          )}
        </button>

        <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1">
          <span>🔒 Secured via 256-bit Stripe Checkout encryption</span>
        </p>
      </div>
    </div>
  );
}
