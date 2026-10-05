exports.handler = async (event, context) => {
  // Handle preflight browser security checks
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const requestData = JSON.parse(event.body || '{}');
    const customerAddress = requestData.customerAddress;

    if (!customerAddress || !customerAddress.zip) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing required postal details." })
      };
    }

    // Secure payload packet configuration built manually
    const shipmentPayload = {
      address_from: {
        name: "RentPro Equipment",
        street1: "123 Main Street",
        city: "Toronto",
        state: "ON",
        zip: "M5V 2T6",
        country: "CA"
      },
      address_to: {
        name: customerAddress.name || "Customer",
        street1: customerAddress.street1,
        city: customerAddress.city,
        state: customerAddress.state || "ON",
        zip: customerAddress.zip,
        country: "CA"
      },
      parcels: [{
        length: "12",
        width: "10",
        height: "6",
        distance_unit: "in",
        weight: "5",
        mass_unit: "lb"
      }],
      async: false
    };

    // Direct fetch lookup straight to Shippo's endpoint core bypassing local package setups
    const response = await fetch('https://goshippo.com', {
      method: 'POST',
      headers: {
        'Authorization': `ShippoToken ${process.env.SHIPPO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shipmentPayload)
    });

    const shipment = await response.json();

    // Catch account restrictions or invalid token indicators returned by Shippo's portal
    if (!response.ok || !shipment.rates) {
      console.error("Shippo Core Error:", shipment);
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ 
          rates: [], 
          message: "Account initialization hold. Verify Shippo API key settings or token tier status." 
        })
      };
    }

    // Map the rate outputs safely into clean matching line structures
    const liveRates = shipment.rates.map(rate => ({
      id: rate.object_id,
      provider: rate.provider,
      service: rate.servicelevel?.name || 'Standard Shipping',
      amount: (parseFloat(rate.amount) * 1.80).toFixed(2), // Factoring the round-trip return leg fee
      currency: rate.currency
    }));

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ rates: liveRates })
    };

  } catch (error) {
    console.error("Internal Error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to calculate live rate quotes.", details: error.message })
    };
  }
};
