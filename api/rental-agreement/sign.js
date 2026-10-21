import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

export const config = { api: { bodyParser: { sizeLimit: '3mb' } } };

const AGREEMENT_VERSION = 'lidar-rentals-equipment-rental-v1-2026-10-21';
const json = (res, status, body) => res.status(status).json(body);

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  try {
    const { agreementVersion, customer, items, typedName, signaturePngDataUrl, accepted, userAgent, termsText } = req.body || {};
    if (agreementVersion !== AGREEMENT_VERSION) return json(res, 400, { error: 'Agreement version is invalid. Refresh checkout and try again.' });
    if (!customer?.customer_name?.trim() || !customer?.customer_email?.trim() || !typedName?.trim() ||
        typedName.trim().toLocaleLowerCase() !== customer.customer_name.trim().toLocaleLowerCase()) {
      return json(res, 400, { error: 'Customer name, email, and matching typed signature are required.' });
    }
    if (accepted !== true || !Array.isArray(items) || items.length === 0 || items.length > 50 ||
        items.some(item => item.itemType !== 'equipment' || !item.name || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) {
      return json(res, 400, { error: 'This agreement can only be signed for valid equipment rental items after consent.' });
    }
    if (typeof signaturePngDataUrl !== 'string' ||
        !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(signaturePngDataUrl) ||
        signaturePngDataUrl.length > 2_000_000) {
      return json(res, 400, { error: 'A valid drawn PNG signature is required.' });
    }
    if (typeof termsText !== 'string' || termsText.length < 500 || termsText.length > 30000) {
      return json(res, 400, { error: 'The agreement text snapshot is missing or invalid.' });
    }
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return json(res, 503, { error: 'Secure agreement storage is not configured.' });

    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const signature = Buffer.from(signaturePngDataUrl.slice('data:image/png;base64,'.length), 'base64');
    if (signature.length > 1_400_000) return json(res, 400, { error: 'Signature image is too large.' });
    const id = randomUUID();
    const path = id + '/signature.png';
    const upload = await supabase.storage.from('signed-rental-agreements').upload(path, signature, { contentType: 'image/png', upsert: false });
    if (upload.error) return json(res, 500, { error: 'Could not save the signature image securely.' });

    const saved = await supabase.from('rental_agreements').insert({
      id, customer_name: customer.customer_name.trim(), customer_email: customer.customer_email.trim(),
      customer_phone: String(customer.customer_phone || '').trim(), company: String(customer.company || '').trim(),
      shipping_address: String(customer.shipping_address || '').trim(), agreement_version: agreementVersion,
      terms_text: termsText, items_snapshot: items, typed_name: typedName.trim(),
      signature_object_path: path, accepted_at: new Date().toISOString(), user_agent: String(userAgent || '').slice(0, 1000)
    }).select('id').single();
    if (saved.error) {
      await supabase.storage.from('signed-rental-agreements').remove([path]);
      console.error('[rental-agreement/sign] database insert failed:', saved.error.message);
      return json(res, 500, { error: 'Could not save the signed agreement record.' });
    }
    return json(res, 201, { agreementId: saved.data.id });
  } catch (error) {
    console.error('[rental-agreement/sign] failed:', error);
    return json(res, 500, { error: 'Unable to save the signed agreement securely.' });
  }
}
