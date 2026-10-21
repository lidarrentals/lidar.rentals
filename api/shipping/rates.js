const reply = (res, status, body) => res.status(status).set('Cache-Control', 'no-store').json(body);

export default async function handler(req, res) {
  if (req.method !== 'POST') return reply(res, 405, { error: 'Method not allowed.' });
  const token = process.env.SHIPPO_API_KEY;
  if (!token) return reply(res, 503, { error: 'Live delivery quotes are not configured. Contact LiDAR.Rentals for a delivery quote.' });
  let customerAddress = req.body?.customerAddress;
  if (!customerAddress || !String(customerAddress.street1 || '').trim() ||
      !String(customerAddress.city || '').trim() || !String(customerAddress.zip || '').trim()) {
    return reply(res, 400, { error: 'Enter a street address, city, and postal code.' });
  }
  let warehouse;
  let parcel;
  try {
    warehouse = JSON.parse(process.env.SHIPPO_ORIGIN_ADDRESS_JSON || 'null');
    // Standard rental package profile supplied by LiDAR.Rentals. Environment configuration
    // may override it if the standard package changes. Declared value is not insurance.
    parcel = JSON.parse(process.env.SHIPPO_PARCEL_JSON || JSON.stringify({
      length: 26, width: 26, height: 16, weight: 50,
      distance_unit: 'in', mass_unit: 'lb', declared_value: 50000, declared_value_currency: 'USD'
    }));
  } catch {
    return reply(res, 503, { error: 'Warehouse address or parcel configuration is invalid. Contact LiDAR.Rentals for a return-shipping quote.' });
  }
  if (!warehouse?.street1 || !warehouse?.city || !warehouse?.zip || !warehouse?.country ||
      !parcel?.length || !parcel?.width || !parcel?.height || !parcel?.weight ||
      !parcel?.distance_unit || !parcel?.mass_unit) {
    return reply(res, 503, { error: 'The LiDAR.Rentals warehouse address or package dimensions are not configured. Contact LiDAR.Rentals for a return-shipping quote.' });
  }
  try {
    const response = await fetch('https://api.goshippo.com/shipments/', {
      method: 'POST',
      headers: { Authorization: 'ShippoToken ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Return direction: equipment travels from the renter back to the warehouse.
        address_from: {
          name: String(customerAddress.name || 'Customer').slice(0, 100),
          street1: String(customerAddress.street1).trim(),
          street2: String(customerAddress.street2 || '').trim(),
          city: String(customerAddress.city).trim(),
          state: String(customerAddress.state || '').trim(),
          zip: String(customerAddress.zip).trim(),
          country: String(customerAddress.country || 'CA').toUpperCase(),
          phone: String(customerAddress.phone || '').trim(),
          email: String(customerAddress.email || '').trim()
        },
        address_to: {
          name: warehouse.name || 'LiDAR.Rentals',
          street1: warehouse.street1, street2: warehouse.street2 || '',
          city: warehouse.city, state: warehouse.state || '', zip: warehouse.zip,
          country: warehouse.country, phone: warehouse.phone || '', email: warehouse.email || ''
        },
        parcels: [{
          length: String(parcel.length), width: String(parcel.width), height: String(parcel.height),
          distance_unit: parcel.distance_unit, weight: String(parcel.weight), mass_unit: parcel.mass_unit
        }],
        // Request Shippo/XCover insurance in the rate quote. Coverage and eligibility
        // remain subject to Shippo/XCover terms; the quote is not a purchased policy.
        extra: {
          insurance: {
            amount: String(parcel.declared_value || 50000),
            currency: String(parcel.declared_value_currency || 'USD'),
            content: 'Rented LiDAR equipment'
          }
        },
        async: false
      })
    });
    const shipment = await response.json();
    if (!response.ok) {
      console.error('[shipping/rates] Shippo rejected quote request:', response.status, JSON.stringify(shipment).slice(0, 1500));
      return reply(res, 502, { error: 'The carrier could not provide a verified delivery quote. Contact LiDAR.Rentals for a quote.' });
    }
    const rates = (shipment.rates || [])
      .filter(rate => rate.amount && rate.currency && rate.object_id)
      .map(rate => ({
        id: rate.object_id,
        provider: rate.provider || 'Carrier',
        service: rate.servicelevel?.name || 'Delivery service',
        amount: String(rate.amount),
        currency: String(rate.currency).toUpperCase()
      }));
    if (!rates.length) return reply(res, 200, { rates: [], message: 'No carrier rates were returned for this address.' });
    return reply(res, 200, { rates });
  } catch (error) {
    console.error('[shipping/rates] live quote failed:', error);
    return reply(res, 502, { error: 'The carrier could not provide a verified delivery quote. Contact LiDAR.Rentals for a quote.' });
  }
}
