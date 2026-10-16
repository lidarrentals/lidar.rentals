import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Enable CORS for all incoming origins ('*')
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  app.use(express.json());

  // Helper to dynamically extract the client application's origin domain
  const getRequestOrigin = (req: express.Request): string => {
    if (req.headers.origin && typeof req.headers.origin === 'string') {
      return req.headers.origin;
    }
    if (req.headers.referer && typeof req.headers.referer === 'string') {
      try {
        return new URL(req.headers.referer).origin;
      } catch {
        // fallback
      }
    }
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || `localhost:${PORT}`;
    return `${proto}://${host}`;
  };

  // Backend Stripe Checkout session creation endpoint handler
  const handleStripeCheckout: express.RequestHandler = async (req, res) => {
    try {
      const { items, shippingCost } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Your cart is empty. Please add items before checking out.' });
      }

      const clientOrigin = getRequestOrigin(req);

      // Process rental items array & map unit_amount properly into cents
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: any) => {
        const qty = Math.max(1, Number(item.quantity) || 1);
        let unitCents = 0;

        if (item.unitPrice != null && !isNaN(Number(item.unitPrice))) {
          unitCents = Math.round(Number(item.unitPrice) * 100);
        } else if (item.lineTotal != null && !isNaN(Number(item.lineTotal))) {
          unitCents = Math.round((Number(item.lineTotal) / qty) * 100);
        }

        const periodLabel = item.rentalPeriod
          ? typeof item.rentalPeriod === 'number'
            ? ` (${item.rentalPeriod} Day Rental)`
            : ` (${item.rentalPeriod})`
          : '';

        let dateDesc = '';
        if (item.startDate && item.endDate) {
          dateDesc = `Rental duration: ${item.startDate} to ${item.endDate}`;
        }

        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${item.name || 'Rental Equipment'}${periodLabel}`,
              description: dateDesc || undefined,
            },
            unit_amount: Math.max(50, unitCents),
          },
          quantity: qty,
        };
      });

      // Handle the shippingCost line item if provided
      const numericShipping = Number(shippingCost) || 0;
      if (numericShipping > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Round-Trip Insured Delivery & Return Courier',
              description: 'Insured transit both ways including return airway bill and protective cases',
            },
            unit_amount: Math.round(numericShipping * 100),
          },
          quantity: 1,
        });
      }

      // Initialize Stripe Checkout Session if STRIPE_SECRET_KEY is provided
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

      if (stripeSecretKey && stripeSecretKey.startsWith('sk_')) {
        const stripe = new Stripe(stripeSecretKey);

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          line_items: lineItems,
          success_url: `${clientOrigin}/#/checkout?success=true`,
          cancel_url: `${clientOrigin}/#/checkout?cancel=true`,
        });

        return res.json({ url: session.url });
      }

      // If no valid Stripe secret key is present in environment, generate simulated success checkout URL
      console.warn('[Stripe Checkout] STRIPE_SECRET_KEY is not configured or in mock test mode. Returning test redirect.');
      return res.json({
        url: `${clientOrigin}/#/checkout?success=true`,
        mock: true,
      });
    } catch (err: any) {
      console.error('Error creating Stripe checkout session:', err);
      return res.status(500).json({ error: err.message || 'Internal server error processing Stripe checkout' });
    }
  };

  app.post('/api/checkout', handleStripeCheckout);
  app.post('/.netlify/functions/create-stripe-session', handleStripeCheckout);

  // Shipping rates helper endpoint for live estimation
  const handleShippingRates: express.RequestHandler = async (_req, res) => {
    res.json({
      rates: [
        {
          id: 'rate_standard',
          provider: 'FedEx',
          service: 'Ground Insured Freight (2-3 Business Days)',
          amount: '145.00',
          currency: 'CAD',
        },
        {
          id: 'rate_priority',
          provider: 'FedEx',
          service: 'Priority Overnight Hazardous/Lithium Insured',
          amount: '285.00',
          currency: 'CAD',
        },
        {
          id: 'rate_whiteglove',
          provider: 'Direct Carrier',
          service: 'Direct Hand-Delivery & Onsite Calibration Tech (within 200km)',
          amount: '450.00',
          currency: 'CAD',
        },
      ],
    });
  };

  app.post('/api/shipping-rates', handleShippingRates);
  app.post('/.netlify/functions/get-live-rates', handleShippingRates);

  // Mount Vite development middlewares in dev mode, or serve static build in production
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Serve transformed index.html for all non-API navigation requests (Express 5 compatible)
    app.use(async (req, res, next) => {
      if (req.method !== 'GET') {
        return next();
      }
      if (
        req.path.startsWith('/api') ||
        req.path.startsWith('/.netlify') ||
        (req.path.includes('.') && !req.path.endsWith('.html'))
      ) {
        return next();
      }

      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
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
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
