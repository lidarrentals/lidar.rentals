import { useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/pricing';
import type { CartItem } from '@/types';

interface SummaryProps {
  items: CartItem[];
  total: number;
  shippingCost: number;
  agreementId?: string;
  customer?: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    company: string;
    shipping_address: string;
    notes?: string;
  };
  disabled?: boolean;
}

export default function CheckoutSummary({ items, total, shippingCost, agreementId, customer, disabled = false }: SummaryProps) {
  const [isLoading, setIsLoading] = useState(false);

  const renderSafeDate = (dateVal: string) => {
    if (!dateVal) return 'N/A';
    try {
      const parsedDate = new Date(dateVal);
      if (isNaN(parsedDate.getTime())) return String(dateVal);
      return formatDate(parsedDate);
    } catch {
      return String(dateVal);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0 || disabled) return;
    if (items.some(item => item.itemType === 'service')) {
      alert('Service requests must use the separate intake and manual-review process, not equipment Stripe checkout.');
      return;
    }
    if (!agreementId) {
      alert('Please sign and save the equipment rental agreement before payment.');
      return;
    }
    if (!customer?.customer_name.trim() || !customer.customer_email.trim()) {
      alert('Enter your name and email before continuing.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id || item.itemId,
            itemType: item.itemType,
            itemId: item.itemId,
            name: item.name,
            quantity: item.quantity || 1,
            rentalPeriod: item.rentalPeriod,
            startDate: item.startDate,
            endDate: item.endDate,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          })),
          shippingCost,
          agreementId,
          customer,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'Failed to initialize Stripe checkout session');
      if (data.mock) throw new Error('Stripe is not configured for live payment. No payment was taken; please contact LiDAR.Rentals.');
      if (!data.url) throw new Error('Stripe did not return a checkout URL.');
      window.location.href = data.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to connect to checkout server.';
      console.error('Checkout error:', err);
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Order summary</h2>
        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto mb-4 pr-2">
          {items.map(item => (
            <div key={item.id} className="py-3 flex justify-between items-start gap-4">
              <div>
                <h4 className="font-medium text-slate-900 text-sm">{item.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {item.quantity}x · {item.periodLabel || item.rentalPeriod} ({renderSafeDate(item.startDate)} - {renderSafeDate(item.endDate)})
                </p>
              </div>
              <span className="font-semibold text-slate-900 text-sm">{formatCurrency(item.lineTotal)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm text-slate-600"><span>Rental subtotal</span><span>{formatCurrency(total)}</span></div>
          <div className="flex justify-between text-sm text-slate-600"><span>Round-trip delivery</span><span>{shippingCost > 0 ? formatCurrency(shippingCost) : 'Calculated via address'}</span></div>
          <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100 mb-4"><span>Estimated total</span><span>{formatCurrency(total + shippingCost)}</span></div>
        </div>
        <button onClick={handleCheckout} disabled={isLoading || items.length === 0 || disabled} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-4 rounded-xl transition disabled:bg-slate-300 disabled:cursor-not-allowed text-sm flex justify-center items-center">
          {isLoading ? 'Redirecting to Stripe…' : disabled ? 'Online payment temporarily unavailable' : `Pay ${formatCurrency(total + shippingCost)} with Stripe`}
        </button>
        <p className="text-center text-xs text-slate-400 mt-3">Payment is processed by Stripe.</p>
      </div>
    </div>
  );
}
