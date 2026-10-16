const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
// Enable CORS for all incoming origins
app.use(cors({ origin: '*' })); 
app.use(express.json());

// Initialize Stripe with secret key from environment or fallback test key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_STRIPE_SECRET_KEY';
const stripe = new Stripe(stripeSecretKey);

// Helper function to extract the dynamic request origin domain
const getRequestOrigin = (req) => {
  if (req.headers.origin) {
    return req.headers.origin;
  }
  if (req.headers.referer) {
    try {
      return new URL(req.headers.referer).origin;
    } catch {
      // fallback
    }
  }
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  return `${protocol}://${host}`;
};

app.post('/api/checkout', async (req, res) => {
  try {
    const { items = [], shippingCost = 0 } = req.body;

    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${item.name} (${item.rentalPeriod || 1} Day Rental)`,
        },
        unit_amount: Math.round(((item.lineTotal || 0) / (item.quantity || 1)) * 100), 
      },
      quantity: item.quantity || 1,
    }));

    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Round-Trip Insured Delivery' },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const origin = getRequestOrigin(req);

    // If live Stripe secret key is present, create Stripe checkout session
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${origin}/#/checkout?success=true`,
        cancel_url: `${origin}/#/checkout?cancel=true`,
      });

      return res.json({ url: session.url });
    }

    // Fallback simulated checkout URL when no live Stripe key is configured in preview sandbox
    return res.json({
      url: `${origin}/#/checkout?success=true`,
      mock: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`Stripe backend server running on port ${PORT}`));
