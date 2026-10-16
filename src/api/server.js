const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
app.use(cors({ origin: 'http://localhost:5173' })); 
app.use(express.json());

// REPLACE THIS STRING WITH YOUR ACTUAL STRIPE TEST SECRET KEY (starts with sk_test_)
const stripe = new Stripe('sk_test_YOUR_STRIPE_SECRET_KEY');

app.post('/api/checkout', async (req, res) => {
  try {
    const { items, shippingCost } = req.body;

    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${item.name} (${item.rentalPeriod} Day Rental)`,
        },
        unit_amount: Math.round((item.lineTotal / item.quantity) * 100), 
      },
      quantity: item.quantity,
    }));

    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Round-Trip Shipping' },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: 'http://localhost:5173/success',
      cancel_url: 'http://localhost:5173/checkout',
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(4000, () => console.log('Stripe backend server running on port 4000'));
