const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
    const { items, shippingCost, total } = JSON.parse(event.body || '{}');

    // 1. Build an array item structure containing your specific rental items mapping
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'cad',
        product_data: {
          name: item.name,
          description: `${item.rentalPeriod} Day Rental (${item.startDate} to ${item.endDate})`,
        },
        unit_amount: Math.round(item.unitPrice * 100), // Convert base price into sub-cents logic parameters
      },
      quantity: item.quantity || 1,
    }));

    // 2. Add your dynamic live shipping fee as an independent line cost entry row
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'Round-Trip Courier Delivery Logistics',
            description: 'Includes prepaid return label instructions packet',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // 3. Initialize the official secure Stripe Hosted page redirect link
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: `${event.headers.origin || 'https://yoursite.com'}/#/checkout?success=true`,
      cancel_url: `${event.headers.origin || 'https://yoursite.com'}/#/checkout?cancel=true`,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ url: session.url })
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
