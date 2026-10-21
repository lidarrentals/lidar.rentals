import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
    const app = express();
    const PORT = 3000;
    const isProd = process.env.NODE_ENV === 'production';

    app.use(
        cors({
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        })
    );

    app.use(express.json());

    const getRequestOrigin = (req: express.Request): string => {
        if (req.headers.origin && typeof req.headers.origin === 'string') {
            return req.headers.origin;
        }
        if (req.headers.referer && typeof req.headers.referer === 'string') {
            try {
                return new URL(req.headers.referer).origin;
            } catch { }
        }
        const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
        const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || `localhost:${PORT}`;
        return `${proto}://${host}`;
    };


    // Save signed equipment-rental evidence server-side. The service-role key is
    // server-only; the browser never receives it or direct access to the private bucket.
    app.post('/api/rental-agreement/sign', async (req, res) => {
        try {
            const {
                agreementVersion, customer, items, typedName,
                signaturePngDataUrl, accepted, userAgent, termsText
            } = req.body ?? {};

            if (agreementVersion !== 'lidar-rentals-equipment-rental-v1-2026-10-21') {
                return res.status(400).json({ error: 'The agreement version is invalid. Refresh checkout and try again.' });
            }
            if (!customer?.customer_name?.trim() || !customer?.customer_email?.trim() ||
                !typedName?.trim() || typedName.trim().toLocaleLowerCase() !== customer.customer_name.trim().toLocaleLowerCase()) {
                return res.status(400).json({ error: 'Customer name, email, and matching typed signature are required.' });
            }
            if (accepted !== true || !Array.isArray(items) || items.length === 0 ||
                items.some((item: any) => item.itemType !== 'equipment')) {
                return res.status(400).json({ error: 'This agreement can only be signed for equipment rentals after consent.' });
            }
            if (typeof signaturePngDataUrl !== 'string' ||
                !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(signaturePngDataUrl) ||
                signaturePngDataUrl.length > 2_000_000) {
                return res.status(400).json({ error: 'A valid drawn PNG signature is required.' });
            }
            if (typeof termsText !== 'string' || termsText.length < 500 || termsText.length > 30000) {
                return res.status(400).json({ error: 'The agreement text snapshot is missing or invalid.' });
            }

            const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (!supabaseUrl || !serviceKey) {
                return res.status(503).json({ error: 'Agreement storage is not configured. No signature was saved; please contact LiDAR.Rentals.' });
            }

            const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
                auth: { persistSession: false, autoRefreshToken: false }
            });
            const png = Buffer.from(signaturePngDataUrl.slice('data:image/png;base64,'.length), 'base64');
            const agreementId = randomUUID();
            const objectPath = `${agreementId}/signature.png`;
            const upload = await supabaseAdmin.storage.from('signed-rental-agreements').upload(objectPath, png, {
                contentType: 'image/png',
                upsert: false
            });
            if (upload.error) throw new Error('Could not store the signature image: ' + upload.error.message);

            const insert = await supabaseAdmin.from('rental_agreements').insert({
                id: agreementId,
                customer_name: customer.customer_name.trim(),
                customer_email: customer.customer_email.trim(),
                customer_phone: String(customer.customer_phone || '').trim(),
                company: String(customer.company || '').trim(),
                shipping_address: String(customer.shipping_address || '').trim(),
                agreement_version: agreementVersion,
                terms_text: termsText,
                items_snapshot: items,
                typed_name: typedName.trim(),
                signature_object_path: objectPath,
                accepted_at: new Date().toISOString(),
                user_agent: String(userAgent || '').slice(0, 1000)
            }).select('id').single();

            if (insert.error) {
                await supabaseAdmin.storage.from('signed-rental-agreements').remove([objectPath]);
                throw new Error('Could not save the signed agreement record: ' + insert.error.message);
            }
            return res.status(201).json({ agreementId: insert.data.id });
        } catch (err: any) {
            console.error('[Rental Agreement] Save failed:', err);
            return res.status(500).json({ error: 'Unable to save the signed agreement securely. Please try again.' });
        }
    });

    app.post('/api/checkout', async (req, res) => {
        try {
            const { items, shippingCost, order_id } = req.body;

            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'Your cart is empty.' });
            }

            const clientOrigin = getRequestOrigin(req);
            const targetOrderId = order_id || 'ORD-' + Math.floor(100000 + Math.random() * 900000);

            const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: any) => {
                const qty = Math.max(1, Number(item.quantity) || 1);
                let unitCents = 0;

                if (item.unitPrice != null && !isNaN(Number(item.unitPrice))) {
                    unitCents = Math.round(Number(item.unitPrice) * 100);
                } else if (item.lineTotal != null && !isNaN(Number(item.lineTotal))) {
                    unitCents = Math.round((Number(item.lineTotal) / qty) * 100);
                }

                return {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${item.name || 'Rental Equipment'}${item.rentalPeriod ? ` (\${item.rentalPeriod} Day Rental)` : ''}`,
                        },
                        unit_amount: Math.max(50, unitCents),
                    },
                    quantity: qty,
                };
            });

            const numericShipping = Number(shippingCost) || 0;
            if (numericShipping > 0) {
                lineItems.push({
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Round-Trip Insured Delivery & Return Courier',
                        },
                        unit_amount: Math.round(numericShipping * 100),
                    },
                    quantity: 1,
                });
            }

            const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

            if (stripeSecretKey && stripeSecretKey.startsWith('sk_')) {
                const stripe = new Stripe(stripeSecretKey);

                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    mode: 'payment',
                    line_items: lineItems,
                    success_url: `${clientOrigin}/#/checkout?success=true&order_id=${targetOrderId}`,
                    cancel_url: `${clientOrigin}/#/checkout?cancel=true`,
                });

                return res.json({ url: session.url });
            }

            console.warn('[Stripe Checkout] STRIPE_SECRET_KEY fallback trigger.');
            return res.json({
                url: `${clientOrigin}/#/checkout?success=true&order_id=${targetOrderId}`,
                mock: true,
            });
        } catch (err: any) {
            return res.status(500).json({ error: err.message || 'Internal server error' });
        }
    });

    const handleShippingRates: express.RequestHandler = async (_req, res) => {
        res.json({
            rates: [
                { id: 'rate_standard', provider: 'FedEx', service: 'Ground Insured Freight (2-3 Business Days)', amount: '145.00', currency: 'CAD' },
                { id: 'rate_priority', provider: 'FedEx', service: 'Priority Overnight Insured', amount: '285.00', currency: 'CAD' },
                { id: 'rate_whiteglove', provider: 'Direct Carrier', service: 'Direct Hand-Delivery & Calibration Tech', amount: '450.00', currency: 'CAD' },
            ],
        });
    };

    app.post('/api/shipping-rates', handleShippingRates);
    app.post('/.netlify/functions/get-live-rates', handleShippingRates);

    if (!isProd) {
        const vite = await createViteServer({
            server: { middlewareMode: true, host: '0.0.0.0', port: PORT, watch: { ignored: ['**/.vs/**', '**/node_modules/**'] } },
            appType: 'spa',
        });
        app.use(vite.middlewares);

        app.use(async (req, res, next) => {
            if (req.method !== 'GET' || req.path.startsWith('/api') || (req.path.includes('.') && !req.path.endsWith('.html'))) {
                return next();
            }
            try {
                let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
                template = await vite.transformIndexHtml(req.originalUrl, template);
                res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
            } catch (e: any) {
                vite.ssrFixStacktrace(e);
                next(e);
            }
        });
    } else {
        app.use(express.static(path.join(__dirname, 'dist')));
        app.use((req, res, next) => {
            if (req.method === 'GET') {
                res.sendFile(path.join(__dirname, 'dist', 'index.html'));
            } else {
                next();
            }
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server listening on http://0.0.0:${PORT}`);
    });
}

startServer();
