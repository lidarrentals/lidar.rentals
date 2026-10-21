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
  let origin;
  let parcel;
  try {
    origin = JSON.parse(process.env.SHIPPO_ORIGIN_ADDRESS_JSON || 'null');
    parcel = JSON.parse(process.env.SHIPPO_PARCEL_JSON || 'null');
  } catch {
    return reply(res, 503, { error: 'Delivery origin or parcel configuration is invalid. Contact LiDAR.Rentals for a delivery quote.' });
  }
  if (!origin?.street1 || !origin?.city || !origin?.zip || !origin?.country ||
      !parcel?.length || !parcel?.width || !parcel?.height || !parcel?.weight ||
      !parcel?.distance_unit || !parcel?.mass_unit) {
    return reply(res, 503, { error: 'Live delivery origin and parcel dimensions are not configured. Contact LiDAR.Rentals for a delivery quote.' });
  }
  try {
    const response = await fetch('https://api.goshippo.com/shipments/', {
      method: 'POST',
      headers: { Authorization: 'ShippoToken ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address_from: {
          name: origin.name || 'LiDAR.Rentals',
          street1: origin.street1, street2: origin.street2 || '',
          city: origin.city, state: origin.state || '', zip: origin.zip,
          country: origin.country, phone: origin.phone || '', email: origin.email || ''
        },
        address_to: {
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
        parcels: [{
          length: String(parcel.length), width: String(parcel.width), height: String(parcel.height),
          distance_unit: parcel.distance_unit, weight: String(parcel.weight), mass_unit: parcel.mass_unit
        }],
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
