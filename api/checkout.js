import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const VERSION = 'lidar-rentals-equipment-rental-v1-2026-10-21';
const reply = (res, status, body) => res.status(status).set('Cache-Control', 'no-store').json(body);

export default async function handler(req, res) {
  if (req.method !== 'POST') return reply(res, 405, { error: 'Method not allowed.' });
  try {
    const { items, agreementId, customer } = req.body || {};
    if (!Array.isArray(items) || !items.length || items.length > 30) return reply(res, 400, { error: 'Your equipment cart is empty or invalid.' });
    if (items.some(item => item.itemType !== 'equipment')) return reply(res, 400, { error: 'Service requests must use the separate intake process.' });
    if (!agreementId || !customer?.customer_name?.trim() || !customer?.customer_email?.trim()) return reply(res, 400, { error: 'A saved signed agreement and customer contact details are required.' });
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return reply(res, 503, { error: 'Secure agreement verification is not configured.' });
    if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_')) return reply(res, 503, { error: 'Stripe is not configured. No payment was taken.' });
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: agreement, error: agreementError } = await supabase.from('rental_agreements')
      .select('id,customer_name,customer_email,agreement_version,items_snapshot').eq('id', agreementId).maybeSingle();
    if (agreementError || !agreement || agreement.agreement_version !== VERSION ||
        agreement.customer_email.toLowerCase() !== customer.customer_email.trim().toLowerCase() ||
        agreement.customer_name.trim().toLowerCase() !== customer.customer_name.trim().toLowerCase()) {
      return reply(res, 400, { error: 'The signed agreement could not be verified. Please sign again.' });
    }
    const ids = [...new Set(items.map(i => String(i.itemId || '')))];
    if (ids.some(id => !id)) return reply(res, 400, { error: 'An equipment item is missing its product ID.' });
    const { data: equipment, error: equipmentError } = await supabase.from('equipment')
      .select('id,name,is_active,price_1day,price_2day,price_3day,price_1week,price_1month').in('id', ids);
    if (equipmentError || !equipment || equipment.length !== ids.length) return reply(res, 400, { error: 'One or more equipment items could not be verified.' });
    const agreed = Array.isArray(agreement.items_snapshot) ? agreement.items_snapshot : [];
    const line_items = [];
    for (const item of items) {
      const product = equipment.find(p => p.id === item.itemId);
      const snap = agreed.find(i => i.itemId === item.itemId && i.itemType === 'equipment');
      const qty = Number(item.quantity || 1);
      if (!product || product.is_active === false) return reply(res, 400, { error: 'An equipment item is unavailable.' });
      if (!snap || Number(snap.quantity || 1) !== qty || snap.startDate !== item.startDate || snap.endDate !== item.endDate || snap.rentalPeriod !== item.rentalPeriod || !Number.isInteger(qty) || qty < 1 || qty > 50) {
        return reply(res, 400, { error: 'The cart differs from the signed agreement. Please review and sign again.' });
      }
      const keyName = ({'1day':'price_1day','2day':'price_2day','3day':'price_3day','1week':'price_1week','1month':'price_1month'})[item.rentalPeriod];
      const price = Number(keyName ? product[keyName] : NaN);
      if (!Number.isFinite(price) || price <= 0) return reply(res, 400, { error: 'A valid rental price is not configured for ' + product.name + '.' });
      line_items.push({ price_data: { currency: 'usd', product_data: { name: product.name + ' (' + item.rentalPeriod + ' rental)', description: (item.startDate || '') + ' to ' + (item.endDate || '') }, unit_amount: Math.round(price * 100) }, quantity: qty });
    }
    // Shipping is deliberately omitted until its price is verified server-side.
    const origin = req.headers.origin || 'https://lidar.rentals';
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], mode: 'payment', line_items,
      customer_email: customer.customer_email.trim(),
      success_url: origin + '/#/checkout?success=true&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: origin + '/#/checkout?cancel=true',
      metadata: { rental_agreement_id: agreement.id, customer_email: customer.customer_email.trim().slice(0, 500) }
    });
    return reply(res, 200, { url: session.url });
  } catch (error) {
    console.error('[checkout] failed:', error);
    return reply(res, 500, { error: 'Could not start secure checkout. No payment was taken.' });
  }
}
