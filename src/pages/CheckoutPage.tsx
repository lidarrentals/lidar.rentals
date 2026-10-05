import { useState } from 'react';
import { ArrowLeft, CreditCard, CheckCircle2, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { formatCurrency } from '@/lib/pricing';
import ShippingCalculator from '@/components/ShippingCalculator';
import CheckoutSummary from '@/components/CheckoutSummary';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [shippingCost, setShippingCost] = useState<number>(0);

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    company: '',
    shipping_address: '',
    notes: '',
  });

  if (items.length === 0 && !success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900">Your cart is empty</h2>
        <button onClick={() => navigate('/equipment')} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold">Browse Equipment</button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-slate-900">Order Confirmed!</h2>
        <p className="text-slate-600 mt-3">Order Reference: <strong>{orderId}</strong></p>
        <button onClick={() => navigate('/')} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold">Back to Home</button>
      </div>
    );
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name || !form.customer_email) {
      alert('Please fill out your Full Name and Email Address before payment.');
      return;
    }
    
    if (shippingCost === 0) {
      alert('Please input your address metrics and calculate a delivery option first.');
      return;
    }

    setSubmitting(true);

    try {
      // Create the live session links matrix
      const response = await fetch('/.netlify/functions/create-stripe-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items,
          shippingCost: shippingCost,
          total: total
        })
      });

      const sessionData = await response.json();

      if (sessionData.url) {
        // Cache your customer info data placeholder records to Supabase before leaving the view if wanted
        await supabase.from('orders').insert({
          ...form,
          shipping_cost: shippingCost,
          total: total + shippingCost,
          status: 'pending'
        });

        // Automatically send the browser page layout focus onto Stripe's payment screen portal
        window.location.href = sessionData.url;
      } else {
        throw new Error(sessionData.error || 'Failed to create payment session token links.');
      }
    } catch (err: any) {
      console.error('Checkout error layout:', err);
      alert('Payment initialization stalled: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/equipment')} className="flex items-center gap-1 text-sm text-slate-500 mb-6"><ArrowLeft className="w-4 h-4" /> Continue shopping</button>
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Contact Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                <input required type="text" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm" placeholder="John Smith" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                <input required type="email" value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm" placeholder="john@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                <input type="tel" value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm" placeholder="(555) 123-4567" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Delivery / Site Address</h2>
            <textarea rows={3} value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm resize-none" placeholder="1234 Job Site Rd" />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <ShippingCalculator onRateSelect={(amount) => setShippingCost(amount)} />
          </div>
          <button type="button" onClick={handleSubmit} disabled={submitting} className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CreditCard className="w-5 h-5" /> Place Rental Order ({formatCurrency(total + shippingCost)})</>}
          </button>
        </div>
        <CheckoutSummary items={items} total={total} shippingCost={shippingCost} />
      </div>
    </div>
  );
}
