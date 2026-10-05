import { useState } from 'react';
import { ArrowLeft, CreditCard, CheckCircle2, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { formatCurrency, formatDate } from '@/lib/pricing';
import ShippingCalculator from '@/components/ShippingCalculator';

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
        <p className="text-slate-500 mt-2">Add some equipment or services to proceed.</p>
        <button
          onClick={() => navigate('/equipment')}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Browse Equipment
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Order Confirmed!</h2>
        <p className="text-slate-600 mt-3">
          Thank you for your rental request. We've sent a confirmation to your email.
          Our team will contact you within 24 hours to finalize details.
        </p>
        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 inline-block">
          <span className="text-sm text-slate-500">Order Reference:</span>
          <div className="text-lg font-bold text-slate-900 font-mono">{orderId}</div>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
          <button
            onClick={() => navigate('/equipment')}
            className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name || !form.customer_email) {
      alert('Please fill out your Full Name and Email Address.');
      return;
    }
    setSubmitting(true);

    try {
      const finalGrandTotal = total + shippingCost;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...form,
          shipping_cost: shippingCost,
          total: finalGrandTotal,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        item_type: item.itemType,
        item_id: item.itemId,
        item_name: item.name,
        rental_period: item.rentalPeriod,
        start_date: item.startDate,
        end_date: item.endDate,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: item.lineTotal,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      setOrderId(order.id);
      clearCart();
      setSuccess(true);
    } catch (err) {
      console.error('Checkout error:', err);
      alert('There was an error processing your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/equipment')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Continue shopping
      </button>

      <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column: Form Details */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Contact Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                <input
                  required
                  type="text"
                  value={form.customer_name}
                  onChange={e => setForm({ ...form, customer_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                <input
                  required
                  type="email"
                  value={form.customer_email}
                  onChange={e => setForm({ ...form, customer_email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={form.customer_phone}
                  onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Company</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ABC Construction LLC"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Delivery / Site Address</h2>
            <textarea
              rows={3}
              value={form.shipping_address}
              onChange={e => setForm({ ...form, shipping_address: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="1234 Job Site Rd, City, State 12345"
            />
          </div>

          {/* Fully Connected Calculator Component Box */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <ShippingCalculator onRateSelect={(amount) => setShippingCost(amount)} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Additional Notes</h2>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Any special handling instructions..."
            />
          </div>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Place Rental Order ({formatCurrency(total + shippingCost)})
              </>
            )}
          </button>
        </div>

        {/* Right Column: Order Summary Calculations Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h2>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto mb-4 pr-2">
              {items.map((item, idx) => (
                <div key={idx} className="py-3 first:pt-0 last:pb-0 flex justify-between items-start gap-4">
{item.name}

{item.quantity}x • {item.rentalPeriod} days ({formatDate(item.startDate)} - {formatDate(item.endDate)})


{formatCurrency(item.lineTotal)}

))}
Rental Subtotal
{formatCurrency(total)}


Round-Trip Shipping
{shippingCost > 0 ? formatCurrency(shippingCost) : 'Calculated in form'}


Estimated Total
{formatCurrency(total + shippingCost)}






);
}
