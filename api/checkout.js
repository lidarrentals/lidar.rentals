const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const AGREEMENT_VERSION = 'lidar-rentals-equipment-rental-v1-2026-10-21';
const respond = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed.' });
  try {
    const body = JSON.parse(event.body || '{}');
    const { items, agreementId, customer } = body;
    if (!Array.isArray(items) || !items.length || items.length > 30) return respond(400, { error: 'Your equipment cart is empty or invalid.' });
    if (items.some(item => item.itemType !== 'equipment')) return respond(400, { error: 'Service requests must use the separate intake and manual-review process.' });
    if (!agreementId || !customer?.customer_name?.trim() || !customer?.customer_email?.trim()) return respond(400, { error: 'A saved signed agreement and customer contact details are required.' });
    if (!process.env.SUPABASE_URL && !process.env.VITE_SUPABASE_URL) return respond(503, { error: 'Secure agreement verification is not configured.' });
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return respond(503, { error: 'Secure agreement verification is not configured.' });
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) return respond(503, { error: 'Stripe is not configured. No payment was taken.' });

    const supabase = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: agreement, error: agreementError } = await supabase.from('rental_agreements')
      .select('id, customer_name, customer_email, agreement_version, items_snapshot')
      .eq('id', agreementId).maybeSingle();
    if (agreementError || !agreement || agreement.agreement_version !== AGREEMENT_VERSION ||
        agreement.customer_email.toLowerCase() !== customer.customer_email.trim().toLowerCase() ||
        agreement.customer_name.trim().toLowerCase() !== customer.customer_name.trim().toLowerCase()) {
      return respond(400, { error: 'The signed agreement could not be verified for this customer. Please sign again.' });
    }

    // Price and product name come from Supabase, not from browser-submitted prices.
    const productIds = [...new Set(items.map(i => String(i.itemId || '')))];
    if (productIds.some(id => !id)) return respond(400, { error: 'An equipment item is missing its product ID.' });
    const { data: equipment, error: equipmentError } = await supabase.from('equipment')
      .select('id, name, is_active, price_1day, price_2day, price_3day, price_1week, price_1month')
      .in('id', productIds);
    if (equipmentError || !equipment || equipment.length !== productIds.length) return respond(400, { error: 'One or more equipment items could not be verified.' });

    const agreed = Array.isArray(agreement.items_snapshot) ? agreement.items_snapshot : [];
    const lineItems = [];
    for (const item of items) {
      const product = equipment.find(p => p.id === item.itemId);
      if (!product || product.is_active === false) return respond(400, { error: 'An equipment item is unavailable.' });
      const snapshot = agreed.find(i => i.itemId === item.itemId && i.itemType === 'equipment');
      const quantity = Number(item.quantity || 1);
      if (!snapshot || Number(snapshot.quantity || 1) !== quantity ||
          String(snapshot.startDate || '') !== String(item.startDate || '') ||
          String(snapshot.endDate || '') !== String(item.endDate || '') ||
          String(snapshot.rentalPeriod || '') !== String(item.rentalPeriod || '') ||
          !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
        return respond(400, { error: 'The cart differs from the signed agreement. Please review and sign again.' });
      }
      const period = String(item.rentalPeriod || '');
      const priceKey = ({ '1day': 'price_1day', '2day': 'price_2day', '3day': 'price_3day', '1week': 'price_1week', '1month': 'price_1month' })[period];
      const unitPrice = Number(priceKey ? product[priceKey] : NaN);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) return respond(400, { error: 'A valid price is not configured for ' + product.name + ' (' + period + ').' });
      lineItems.push({
        price_data: { currency: 'usd', product_data: { name: product.name + ' (' + period + ' Rental)', description: (item.startDate || '') + ' to ' + (item.endDate || '') }, unit_amount: Math.round(unitPrice * 100) },
        quantity
      });
    }

    // Shipping amounts supplied by the browser are not authoritative; omit them until rates are calculated server-side.
    const origin = event.headers.origin || (event.headers.referer ? new URL(event.headers.referer).origin : 'https://lidar.rentals');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      customer_email: customer.customer_email.trim(),
      success_url: origin + '/#/checkout?success=true&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: origin + '/#/checkout?cancel=true',
      metadata: { rental_agreement_id: agreement.id, customer_email: customer.customer_email.trim().slice(0, 500) }
    });
    return respond(200, { url: session.url });
  } catch (error) {
    console.error('[checkout] failed:', error);
    return respond(500, { error: 'Could not start secure checkout. No payment was taken.' });
  }
};
