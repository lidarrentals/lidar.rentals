import { useEffect, useRef, useState } from 'react';
import type { CartItem } from '@/types';

export const RENTAL_AGREEMENT_VERSION = 'lidar-rentals-equipment-rental-v1-2026-10-21';

export const RENTAL_AGREEMENT_TEXT = `LiDAR.Rentals Equipment Rental Agreement — Draft for Legal Review

1. Parties and rental record. This Agreement is between LiDAR.Rentals (Lessor) and the customer identified in checkout (Renter). The equipment, quantities, rental dates, delivery details and displayed price in the checkout form part of this Agreement. A business signer confirms they are authorized to bind that business.

2. Rental period and return. The rental period is the start and end date shown in the order. The Renter must return or make equipment available for return by the agreed date and follow the provided packing and shipping instructions. Extensions require written confirmation and may incur disclosed additional charges.

3. Care and permitted use. Equipment must be used lawfully and according to manufacturer instructions and supplied safety guidance. The Renter will ensure operators are competent, protect equipment from hazards beyond its rated specifications, and will not modify, repair, lend, sub-rent or transfer possession without written permission. Stop using equipment that appears unsafe or defective and promptly notify LiDAR.Rentals.

4. Inspection, loss and damage. The Renter should inspect equipment on receipt and promptly report visible damage or missing components. While equipment is in the Renter's care, the Renter is responsible, to the extent permitted by law and subject to any agreed insurance or protection plan, for loss, theft, failure to return and damage beyond ordinary wear and tear. Report theft promptly to the appropriate authorities and provide the report reference to LiDAR.Rentals. Any applicable repair/replacement charge schedule must be disclosed before acceptance.

5. Fees and payment. Checkout displays the rental price and applicable delivery, return, accessory, tax, deposit or other charges. Payment is processed by the payment provider. Additional charges must have a contractual basis and be disclosed as required by law.

6. Late returns, cancellation and refunds. Extensions, late fees, cancellations, rescheduling, deposits and refunds are governed by the policies presented before payment, subject to applicable law. Any fees must be disclosed in advance and be lawful and reasonable.

7. Risk and liability. The Renter is responsible for selecting equipment suitable for the task and complying with applicable laws, site rules and safety requirements. Nothing in this Agreement excludes liability or rights that cannot lawfully be excluded or limited, including protections under Ontario consumer-protection law. Any liability limit, waiver or indemnity must be reviewed by Ontario counsel before this agreement is used.

8. Electronic records and governing law. The Renter agrees that the order details and electronic acceptance record may be retained for transaction documentation, subject to applicable privacy law. The record should include this agreement version, order details, acceptance time and signature. This Agreement is governed by Ontario law and applicable Canadian law, without overriding mandatory legal protections.

IMPORTANT: This is a draft and must be reviewed by an Ontario lawyer before use.`;

type Props = {
  customer: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    company: string;
    shipping_address: string;
  };
  items: CartItem[];
  onSaved: (agreementId: string) => void;
};

export default function RentalAgreementAcceptance({ customer, items, onSaved }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);
  const [typedName, setTypedName] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.lineWidth = 2.2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#0f172a';
  }, []);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current!;
    canvas.setPointerCapture(event.pointerId);
    const p = point(event);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawing.current = true;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    event.preventDefault();
    const p = point(event);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    hasInk.current = true;
  };

  const stopDraw = () => { drawing.current = false; };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
  };

  const saveAgreement = async () => {
    setError('');
    if (!customer.customer_name.trim() || !customer.customer_email.trim()) {
      setError('Enter the customer name and email in checkout first.');
      return;
    }
    if (typedName.trim().toLocaleLowerCase() !== customer.customer_name.trim().toLocaleLowerCase()) {
      setError('Type the customer’s full name exactly as entered in checkout.');
      return;
    }
    if (!accepted) {
      setError('Please check the agreement acceptance box.');
      return;
    }
    if (!hasInk.current || !canvasRef.current) {
      setError('Please draw your signature in the signature box.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/rental-agreement/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementVersion: RENTAL_AGREEMENT_VERSION,
          customer,
          items: items.map(item => ({
            itemType: item.itemType,
            itemId: item.itemId,
            name: item.name,
            quantity: item.quantity,
            rentalPeriod: item.rentalPeriod,
            startDate: item.startDate,
            endDate: item.endDate,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          })),
          typedName: typedName.trim(),
          signaturePngDataUrl: canvasRef.current.toDataURL('image/png'),
          accepted,
          userAgent: navigator.userAgent,
          termsText: RENTAL_AGREEMENT_TEXT,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.agreementId) throw new Error(data.error || 'Could not save the signed agreement.');
      onSaved(data.agreementId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the signed agreement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Equipment Rental Agreement</h2>
      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
        Draft agreement — have an Ontario lawyer review these terms before accepting live customer signatures.
      </p>
      <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{RENTAL_AGREEMENT_TEXT}</div>
      <div className="text-sm text-slate-600">
        <strong>Rental items:</strong>
        <ul className="list-disc pl-5 mt-1">{items.map(item => <li key={item.id}>{item.name} — {item.quantity} × {item.startDate} to {item.endDate}</li>)}</ul>
      </div>
      <label className="block text-sm font-medium text-slate-700">
        Type your full name as your electronic signature
        <input value={typedName} onChange={e => setTypedName(e.target.value)} autoComplete="name" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Draw your signature</p>
        <canvas ref={canvasRef} width={640} height={160} onPointerDown={startDraw} onPointerMove={draw} onPointerUp={stopDraw} onPointerCancel={stopDraw} onPointerLeave={stopDraw} className="w-full h-32 border border-slate-300 rounded-lg bg-white touch-none" aria-label="Draw signature" />
        <button type="button" onClick={clearSignature} className="mt-2 text-sm text-blue-700 underline">Clear signature</button>
      </div>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-1" />
        <span>I have read the agreement above and agree to it for the equipment listed in this checkout. I intend my typed name and drawn signature to record my electronic acceptance.</span>
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="button" onClick={saveAgreement} disabled={saving} className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50">
        {saving ? 'Saving signed agreement…' : 'Sign and Save Agreement'}
      </button>
    </section>
  );
}
