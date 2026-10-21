import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { navigate } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import ShippingCalculator from '@/components/ShippingCalculator';
import CheckoutSummary from '@/components/CheckoutSummary';
import RentalAgreementAcceptance from '@/components/RentalAgreementAcceptance';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [paymentVerification, setPaymentVerification] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [agreementId, setAgreementId] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
  const [serviceSubmitting, setServiceSubmitting] = useState(false);
  const [serviceSubmitted, setServiceSubmitted] = useState('');
  const [serviceError, setServiceError] = useState('');
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    company: '',
    shipping_address: '',
    notes: '',
  });

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active || !user) return;
      setForm(current => ({
        ...current,
        customer_name: current.customer_name || String(user.user_metadata?.full_name || user.user_metadata?.name || ''),
        customer_email: current.customer_email || user.email || '',
      }));
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const query = window.location.search || window.location.hash.split('?')[1] || '';
    const params = new URLSearchParams(query);
    const sessionId = params.get('session_id');
    if (params.get('success') !== 'true' || !sessionId) return;
    let active = true;
    setPaymentVerification('Verifying payment with Stripe…');
    fetch('/api/checkout/verify?session_id=' + encodeURIComponent(sessionId))
      .then(async response => {
        const data = await response.json();
        if (!response.ok || !data.paid) throw new Error(data.error || 'Stripe has not confirmed payment.');
        if (!active) return;
        setOrderId(sessionId);
        setSuccess(true);
        setPaymentVerification('');
        clearCart();
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash.split('?')[0]);
      })
      .catch(error => {
        if (!active) return;
        setPaymentVerification(error instanceof Error ? error.message : 'Payment could not be verified. Please contact LiDAR.Rentals before retrying.');
      });
    return () => { active = false; };
  }, [clearCart]);

  const equipmentItems = items.filter(item => item.itemType === 'equipment');
  const serviceItems = items.filter(item => item.itemType === 'service');
  const mixedCart = equipmentItems.length > 0 && serviceItems.length > 0;

  const submitServiceRequest = async () => {
    setServiceError('');
    setServiceSubmitted('');
    if (serviceItems.length !== 1) {
      setServiceError('Submit one service request at a time. Remove extra services from your cart first.');
      return;
    }
    if (!form.customer_name.trim() || !form.customer_email.trim() || !form.shipping_address.trim()) {
      setServiceError('Please provide your full name, valid email, and project site address above.');
      return;
    }
    const item = serviceItems[0];
    setServiceSubmitting(true);
    try {
      const response = await fetch('/api/services/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: item.itemId, startDate: item.startDate, endDate: item.endDate, servicePeriod: item.rentalPeriod, customer: form, notes: serviceNotes })
      });
      const data = await response.json();
      if (!response.ok || !data.requestId) throw new Error(data.error || 'Service request could not be submitted.');
      setServiceSubmitted(data.requestId);
      clearCart();
    } catch (error) {
      setServiceError(error instanceof Error ? error.message : 'Service request could not be submitted.');
    } finally {
      setServiceSubmitting(false);
    }
  };

  if (paymentVerification && !success) {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center"><h2 className="text-2xl font-bold text-slate-900">Payment verification</h2><p role="status" className="mt-4 text-slate-600">{paymentVerification}</p><p className="mt-3 text-sm text-slate-500">Do not submit another payment until the status is confirmed. Contact LiDAR.Rentals if this message persists.</p></div>;
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-slate-900">Payment return received</h2>
        <p className="text-xl text-slate-600 mt-3">Order reference: <strong className="text-blue-600 font-mono">{orderId}</strong></p>
        <p className="text-sm text-slate-500 mt-4">This page return alone does not verify payment. Check the Stripe dashboard for the final payment status.</p>
        <button onClick={() => navigate('/')} className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">Back to Home</button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-3 text-slate-600">Add equipment to your cart before checkout.</p>
        <button onClick={() => navigate('/equipment')} className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-white font-semibold">Browse equipment</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <button onClick={() => navigate('/equipment')} className="flex items-center gap-1 text-sm text-slate-500">
        <ArrowLeft className="w-4 h-4" /> Continue shopping
      </button>
      <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
      {mixedCart && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">Equipment rentals and services must be checked out separately. Remove one type from your cart before continuing. Service requests follow the separate intake and manual-review process.</p>}
      {serviceItems.length > 0 && equipmentItems.length === 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Service request intake</h2>
          <p className="text-sm text-slate-600">This submits a request for manual review, not a confirmed booking. No payment is taken at this stage.</p>
          {serviceItems.map(item => <div key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm"><strong>{item.name}</strong><div>{item.startDate} to {item.endDate} · {item.periodLabel || item.rentalPeriod}</div></div>)}
          <label className="block text-sm font-medium text-slate-700">Project details / requirements
            <textarea value={serviceNotes} onChange={e => setServiceNotes(e.target.value)} rows={4} maxLength={10000} className="mt-1 w-full rounded-lg border border-slate-300 p-3" placeholder="Describe the site, deliverables, access requirements, or questions." />
          </label>
          {serviceError && <p role="alert" className="text-sm text-red-700">{serviceError}</p>}
          {serviceSubmitted ? <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"><strong>Request submitted for manual review.</strong><p className="mt-1">Reference: {serviceSubmitted}. No payment has been taken.</p></div> :
            <button type="button" onClick={submitServiceRequest} disabled={serviceSubmitting || serviceItems.length !== 1 || mixedCart} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{serviceSubmitting ? 'Submitting request…' : 'Submit service request for review'}</button>}
        </section>
      )}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-5">
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Contact information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">Full name *
                <input required autoComplete="name" value={form.customer_name} onChange={e => setForm({...form, customer_name:e.target.value})} className="mt-1 w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Email *
                <input required type="email" autoComplete="email" value={form.customer_email} onChange={e => setForm({...form, customer_email:e.target.value})} className="mt-1 w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Phone
                <input type="tel" autoComplete="tel" value={form.customer_phone} onChange={e => setForm({...form, customer_phone:e.target.value})} className="mt-1 w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm" />
              </label>
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">Company (optional)
                <input autoComplete="organization" value={form.company} onChange={e => setForm({...form, company:e.target.value})} className="mt-1 w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm" />
              </label>
            </div>
          </section>
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Delivery / site address</h2>
            <textarea rows={3} value={form.shipping_address} onChange={e => setForm({...form, shipping_address:e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm resize-none" placeholder="Job site address" />
          </section>
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Delivery options</h2>
            <ShippingCalculator onRateSelect={setShippingCost} />
            <p className="mt-3 text-sm text-amber-800">Delivery quotes are currently estimates only and are not included in the online payment. Confirm delivery pricing with LiDAR.Rentals before paying.</p>
          </section>
          {serviceItems.length > 0 && equipmentItems.length === 0 && (
            <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Service request intake</h2>
              <p className="text-sm text-slate-600">Submitting this form requests service availability and review. It does not take payment or confirm a booking. LiDAR.Rentals will review the request and contact you.</p>
              {serviceItems.map(item => <div key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm"><strong>{item.name}</strong><div>{item.startDate} to {item.endDate} · {item.periodLabel || item.rentalPeriod}</div></div>)}
              <label className="block text-sm font-medium text-slate-700">Project details / requirements
                <textarea value={serviceNotes} onChange={e => setServiceNotes(e.target.value)} rows={4} maxLength={10000} className="mt-1 w-full rounded-lg border border-slate-300 p-3" placeholder="Describe the site, deliverables, access requirements, or questions." />
              </label>
              {serviceError && <p role="alert" className="text-sm text-red-700">{serviceError}</p>}
              {serviceSubmitted ? <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"><strong>Request submitted for manual review.</strong><p className="mt-1">Reference: {serviceSubmitted}. No payment has been taken.</p><p className="mt-1">Email notification depends on server email configuration.</p></div> :
                <button type="button" onClick={submitServiceRequest} disabled={serviceSubmitting || serviceItems.length !== 1} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{serviceSubmitting ? 'Submitting request…' : 'Submit service request for review'}</button>}
            </section>
          )}
          {equipmentItems.length > 0 && !mixedCart && (
            <RentalAgreementAcceptance customer={form} items={equipmentItems} onSaved={setAgreementId} />
          )}
          {equipmentItems.length > 0 && <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Online payment is temporarily disabled while delivery fees and taxes are connected to secure server-side pricing. Your signed agreement can be saved, but no payment will be taken until the full amount is verified.</p>}
          {agreementId && <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">Signed agreement saved securely. Agreement reference: {agreementId}</p>}
        </div>
        <div>
          <CheckoutSummary
            items={items}
            total={total}
            shippingCost={shippingCost}
            agreementId={agreementId}
            customer={form}
            disabled={mixedCart || serviceItems.length > 0 || equipmentItems.length > 0}
          />
        </div>
      </div>
    </div>
  );
}
