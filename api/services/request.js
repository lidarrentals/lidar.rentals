import { createClient } from '@supabase/supabase-js';

const reply = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  const event = { httpMethod: req.method, body: JSON.stringify(req.body || {}), headers: req.headers };
  const send = (status, body) => res.status(status).set('Cache-Control', 'no-store').json(body);
  if (event.httpMethod !== 'POST') return send(405, { error: 'Method not allowed.' });
  let requestId;
  try {
    const body = JSON.parse(event.body || '{}');
    const { serviceId, startDate, endDate, servicePeriod, customer, notes } = body;
    if (!serviceId || !/^\d{4}-\d{2}-\d{2}$/.test(startDate || '') || !/^\d{4}-\d{2}-\d{2}$/.test(endDate || '') ||
        !['2day','3day','1week'].includes(servicePeriod)) return send(400, { error: 'Select a service, duration, and valid dates.' });
    if (startDate > endDate) return send(400, { error: 'End date must be on or after start date.' });
    if (!customer?.customer_name?.trim() || !emailPattern.test(String(customer.customer_email || '').trim())) {
      return send(400, { error: 'Enter your full name and a valid email address.' });
    }
    if (!customer?.shipping_address?.trim()) return send(400, { error: 'Enter the project site address.' });
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return send(503, { error: 'Service request storage is not configured.' });
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: service, error: serviceError } = await supabase.from('services')
      .select('id,name,is_active,price_2day,price_3day,price_1week').eq('id', serviceId).maybeSingle();
    if (serviceError || !service || service.is_active === false) return send(400, { error: 'That service is unavailable. Please refresh and try again.' });
    const priceKey = ({'2day':'price_2day','3day':'price_3day','1week':'price_1week'})[servicePeriod];
    const price = Number(service[priceKey]);
    if (!Number.isFinite(price) || price < 0) return send(400, { error: 'The selected service duration has no valid price configured.' });

    const { data: inserted, error: insertError } = await supabase.from('service_intake_requests').insert({
      service_id: service.id, service_name: service.name, customer_name: customer.customer_name.trim(),
      customer_email: customer.customer_email.trim(), customer_phone: String(customer.customer_phone || '').trim(),
      company: String(customer.company || '').trim(), site_address: customer.shipping_address.trim(),
      start_date: startDate, end_date: endDate, service_period: servicePeriod, quoted_price: price,
      notes: String(notes || '').trim().slice(0, 10000), status: 'pending_review'
    }).select('id,created_at').single();
    if (insertError) {
      console.error('[services/request] database insert failed:', insertError.message);
      return send(500, { error: 'We could not save your service request. Please try again.' });
    }
    requestId = inserted.id;

    // Email is attempted after saving. If not configured or email fails, the request remains saved as pending review.
    if (process.env.RESEND_API_KEY) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'LiDAR.Rentals Requests <onboarding@resend.dev>',
          to: ['lidar.rentals@gmail.com'],
          subject: 'Service request pending review: ' + service.name + ' (' + inserted.id + ')',
          text: [
            'A new service request requires manual review. No payment has been taken.',
            'Request ID: ' + inserted.id,
            'Service: ' + service.name,
            'Customer: ' + customer.customer_name.trim(),
            'Email: ' + customer.customer_email.trim(),
            'Phone: ' + String(customer.customer_phone || ''),
            'Company: ' + String(customer.company || ''),
            'Site: ' + customer.shipping_address.trim(),
            'Dates: ' + startDate + ' to ' + endDate,
            'Duration: ' + servicePeriod,
            'Displayed quote: ' + price,
            'Notes: ' + String(notes || '').trim().slice(0, 10000)
          ].join('\n')
        })
      });
      if (!emailResponse.ok) console.error('[services/request] request saved, email delivery failed:', await emailResponse.text());
    } else {
      console.error('[services/request] request saved but RESEND_API_KEY is not configured; email not sent.');
    }
    return send(201, { requestId, status: 'pending_review', emailConfigured: Boolean(process.env.RESEND_API_KEY) });
  } catch (error) {
    console.error('[services/request] failed:', error);
    return send(500, { error: 'We could not submit your service request. Please try again.' });
  }
};
