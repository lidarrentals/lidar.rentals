import Stripe from 'stripe';

const reply = (res, status, body) => res.status(status).set('Cache-Control', 'no-store').json(body);

export default async function handler(req, res) {
  if (req.method !== 'GET') return reply(res, 405, { error: 'Method not allowed.' });
  const sessionId = String(req.query?.session_id || '');
  if (!sessionId.startsWith('cs_')) return reply(res, 400, { error: 'A valid Stripe session ID is required.' });
  if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_')) return reply(res, 503, { error: 'Stripe verification is not configured.' });
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') return reply(res, 200, { paid: false, status: session.payment_status });
    if (!session.metadata?.rental_agreement_id || !session.customer_details?.email) {
      return reply(res, 409, { error: 'Payment is paid but required rental records are missing. Contact LiDAR.Rentals before returning equipment.' });
    }
    return reply(res, 200, {
      paid: true,
      sessionId: session.id,
      customerEmail: session.customer_details.email,
      amountTotal: session.amount_total,
      currency: session.currency,
      agreementId: session.metadata.rental_agreement_id
    });
  } catch (error) {
    console.error('[checkout/verify] failed:', error);
    return reply(res, 500, { error: 'Could not verify payment status.' });
  }
}
