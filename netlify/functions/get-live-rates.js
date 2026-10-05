const { Shippo } = require('shippo');
const shippo = new Shippo({ apiKeyHeader: `ShippoToken ${process.env.SHIPPO_API_KEY}` });

exports.handler = async (event, context) => {
  // Handle preflight browser checks
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
    const { customerAddress } = JSON.parse(event.body);

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
        name: "Your Rental Company",
        street1: "123 Main Street",
        city: "Toronto",
        state: "ON",
        zip: "M5V 2T6",
        country: "CA"
      },
      address_to: {
        name: customerAddress.name,
        street1: customerAddress.street1,
        city: customerAddress.city,
        state: customerAddress.state,
        zip: customerAddress.zip,
        country: customerAddress.country || 'CA'
      },
      parcels: [packageSpecs],
      async: false
    });

    // Check if rates were successfully generated
    if (!shipment.rates || shipment.rates.length === 0) {
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ rates: [], message: "No rates returned. Check address accuracy." })
      };
    }

    // Extract rates using the exact official object properties
    const liveRates = shipment.rates.map(rate => ({
      id: rate.object_id,
      provider: rate.provider,
      service: rate.servicelevel?.name || 'Standard Shipping',
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
