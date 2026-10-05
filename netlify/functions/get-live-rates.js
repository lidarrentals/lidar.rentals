const { Shippo } = require('shippo');
const shippo = new Shippo({ apiKeyHeader: `ShippoToken ${process.env.SHIPPO_API_KEY}` });

exports.handler = async (event, context) => {
  // Handle preflight browser checks
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
    // Force clean extraction of the address parameters payload object block
    const requestData = JSON.parse(event.body || '{}');
    const customerAddress = requestData.customerAddress;

    if (!customerAddress || !customerAddress.zip) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing required address fields layout properties." })
      };
    }

    // Consolidated package dimensions for your rental pieces
    const packageSpecs = {
      length: "12",
      width: "10",
      height: "6",
      distance_unit: "in",
      weight: "5",
      mass_unit: "lb"
    };

    // Corrected snake_case variables mapped directly for the official shippo engine
    const shipment = await shippo.shipments.create({
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
        country: "CA" // Force Canada target lookup alignment rules
      },
      parcels: [packageSpecs],
      async: false
    });

    if (!shipment.rates || shipment.rates.length === 0) {
      return {
        statusCode: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*" 
        },
        body: JSON.stringify({ rates: [], message: "No carriers returned pricing models for this code." })
      };
    }

    // Extract rates safely with optional chaining selectors
    const liveRates = shipment.rates.map(rate => ({
      id: rate.object_id,
      provider: rate.provider,
      service: rate.servicelevel?.name || 'Standard Carrier Shipping',
      amount: (parseFloat(rate.amount) * 1.80).toFixed(2), // Factor round-trip return labels
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
    console.error("Shipping Calculation Error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to fetch live shipping rates.", details: error.message })
    };
  }
};
