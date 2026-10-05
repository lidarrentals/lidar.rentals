const { Shippo } = require('shippo');
const shippo = new Shippo({ apiKeyHeader: `ShippoToken ${process.env.SHIPPO_API_KEY}` });

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { customerAddress } = JSON.parse(event.body);

    const packageSpecs = {
      length: "12",
      width: "10",
      height: "6",
      distance_unit: "in",
      weight: "5",
      mass_unit: "lb"
    };

    const shipment = await shippo.shipments.create({
      addressFrom: {
        name: "Your Rental Company",
        street1: "123 Main Street",
        city: "Toronto",
        state: "ON",
        zip: "M5V 2T6",
        country: "CA"
      },
      addressTo: {
        name: customerAddress.name,
        street1: customerAddress.street1,
        city: customerAddress.city,
        state: customerAddress.state,
        zip: customerAddress.zip,
        country: customerAddress.country
      },
      parcels: [packageSpecs],
      async: false
    });

    const liveRates = shipment.rates.map(rate => ({
      id: rate.objectId,
      provider: rate.provider,
      service: rate.servicelevel.name,
      amount: (parseFloat(rate.amount) * 1.80).toFixed(2), 
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
      body: JSON.stringify({ error: "Failed to fetch live shipping rates." })
    };
  }
};
