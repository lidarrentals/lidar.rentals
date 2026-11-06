const Stripe = require('stripe');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { items = [], shippingCost = 0 } = JSON.parse(event.body || '{}');

    // 1. Build an array item structure containing your specific rental items mapping
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: `${item.rentalPeriod || 1} Day Rental (${item.startDate || ''} to ${item.endDate || ''})`,
        },
        unit_amount: Math.round(((item.lineTotal || 0) / (item.quantity || 1)) * 100),
      },
      quantity: item.quantity || 1,
    }));

    // 2. Add dynamic shipping fee line item
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Round-Trip Courier Delivery Logistics',
            description: 'Includes prepaid return label instructions packet',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    let origin = event.headers.origin;
    if (!origin && event.headers.referer) {
      try {
        origin = new URL(event.headers.referer).origin;
      } catch {
        // fallback
      }
    }
    if (!origin) origin = 'http://localhost:3000';

    // 3. Initialize Stripe checkout session if key is available
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: lineItems,
        success_url: `${origin}/#/checkout?success=true`,
        cancel_url: `${origin}/#/checkout?cancel=true`,
      });

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ url: session.url })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ url: `${origin}/#/checkout?success=true`, mock: true })
    };

  } catch (error) {
    console.error("Stripe Session Creation Failure:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to generate card routing parameters.", details: error.message })
    };
  }
};
