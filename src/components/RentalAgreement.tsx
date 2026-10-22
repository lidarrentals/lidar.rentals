import { useEffect, useRef, useState } from 'react';

export interface AgreementCustomer {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company: string;
  shipping_address: string;
}

export interface AgreementCartItem {
  itemType?: 'equipment' | 'service';
  itemId?: string;
  id?: string;
  name: string;
  quantity: number;
  rentalPeriod: string | number;
  startDate: string;
  endDate: string;
  unitPrice?: number;
  lineTotal: number;
}

interface RentalAgreementProps {
  items: AgreementCartItem[];
  customer: AgreementCustomer;
  onSaved: (agreementId: string) => void;
}

const AGREEMENT_VERSION = 'lidar-rentals-equipment-rental-v1-2026-10-21';

export default function RentalAgreement({ items, customer, onSaved }: RentalAgreementProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [typedName, setTypedName] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasInk, setHasInk] = useState(false);

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

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    drawing.current = true;
    canvas.setPointerCapture(event.pointerId);
    const point = getPoint(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
    setHasInk(true);
  };

  const stopDrawing = () => { drawing.current = false; };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  };

  const saveAgreement = async () => {
    setError('');
    if (!customer.customer_name.trim() || !customer.customer_email.trim()) {
      setError('Enter your full name and email in Contact Information before signing.');
      return;
    }
    if (!typedName.trim() || typedName.trim().toLocaleLowerCase() !== customer.customer_name.trim().toLocaleLowerCase()) {
      setError('Type your full legal name exactly as entered in Contact Information.');
      return;
    }
    if (!accepted) {
      setError('Please confirm that you have read and agree to the rental terms.');
      return;
    }
    if (!hasInk || !canvasRef.current) {
      setError('Please draw your signature in the signature box.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/rental-agreement/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementVersion: AGREEMENT_VERSION,
          customer: {
            customer_name: customer.customer_name.trim(),
            customer_email: customer.customer_email.trim(),
            customer_phone: customer.customer_phone.trim(),
            company: customer.company.trim(),
            shipping_address: customer.shipping_address.trim(),
          },
          items: items.map(item => ({
            itemType: item.itemType || 'equipment',
            itemId: item.itemId || item.id,
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
          accepted: true,
          userAgent: navigator.userAgent,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.agreementId) {
        throw new Error(data.error || 'Unable to securely save the signed agreement.');
      }
      onSaved(data.agreementId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save the signed agreement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wide font-bold text-blue-700">Equipment rentals only</p>
        <h2 className="text-xl font-bold text-slate-900 mt-1">Equipment Rental Agreement</h2>
        <p className="text-sm text-slate-600 mt-2">Please read the terms below. Signing is required before equipment rental payment.</p>
      </div>

      <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 p-4 text-sm text-slate-700 space-y-4">
        <p><strong>1. Parties and rental.</strong> This agreement is between the customer identified at checkout (“Renter”) and LiDAR.Rentals (“Owner”) for the equipment listed in this checkout. The rental period is the start and end dates shown in the order summary. The order is subject to Owner’s written confirmation and successful payment.</p>
        <p><strong>2. Fees and payment.</strong> Renter agrees to pay the displayed rental fees and selected delivery charges. Any deposit, tax, shipping charge, extension, or other fee must be disclosed before it is charged. A payment authorization or checkout session alone does not guarantee equipment availability.</p>
        <p><strong>3. Care, use and return.</strong> Renter will use the equipment only for its intended purpose, follow manufacturer instructions, keep it secure and protected from moisture, impact, dust and other avoidable hazards, and return all equipment and accessories by the agreed deadline in the condition received, ordinary wear from proper use excepted. Renter will not modify, open, lend, sub-rent, or transfer the equipment without Owner’s written consent.</p>
        <p><strong>4. Loss, damage and theft.</strong> Renter must promptly notify Owner of loss, theft, malfunction or damage and cooperate with reasonable investigation. To the extent permitted by applicable law, Renter is responsible for reasonable, documented repair costs or replacement value for loss or damage caused by Renter’s negligence, misuse, breach of this agreement, or failure to take reasonable care. Renter is not responsible for pre-existing defects or loss caused by Owner’s negligence. Owner will not charge undisclosed or arbitrary amounts.</p>
        <p><strong>5. Late returns and extensions.</strong> Renter must request any extension before the return deadline. An extension is effective only when confirmed by Owner in writing. Where equipment is returned late without an approved extension, additional rental charges may apply only at rates disclosed to Renter or otherwise agreed in writing, subject to applicable law.</p>
        <p><strong>6. Inspection and technical limitations.</strong> Renter should inspect the equipment promptly on receipt and report apparent damage or missing items. LiDAR.Rentals does not guarantee that equipment or resulting measurements will be suitable for a particular project; Renter remains responsible for validating equipment setup, calibration, data quality and fitness for the intended application.</p>
        <p><strong>7. Liability and indemnity.</strong> Nothing in this agreement excludes or limits liability where prohibited by law, including liability that cannot lawfully be waived. Subject to that limit, each party is responsible for its own acts and omissions. Renter will be responsible for third-party claims to the extent caused by Renter’s negligent or wrongful use of the equipment or breach of this agreement. No term requires Renter to indemnify Owner for Owner’s own negligence or wilful misconduct.</p>
        <p><strong>8. Insurance.</strong> Renter is responsible for maintaining any insurance specifically agreed in writing for this rental and providing evidence when reasonably requested. This clause does not create an insurance requirement or coverage amount that was not disclosed and agreed before checkout.</p>
        <p><strong>9. Cancellation and availability.</strong> Cancellation, rescheduling, refund and delivery terms are those disclosed by LiDAR.Rentals before payment or subsequently agreed in writing. Mandatory rights under applicable Ontario and Canadian law remain unaffected. If Owner cannot supply the equipment, Owner will contact Renter and refund amounts paid for equipment not supplied.</p>
        <p><strong>10. Governing law and entire agreement.</strong> This agreement is governed by the laws of Ontario and applicable laws of Canada. Any amendment must be in writing. If a provision is unenforceable, the remaining provisions continue to apply to the extent permitted by law.</p>
        <p><strong>11. Electronic signature and consent.</strong> By signing below, Renter confirms that they have read and understood these terms, intend their electronic signature to authenticate this agreement, and agree to be bound by it. The electronic record of the agreement and signature may be retained as evidence of acceptance.</p>
        <p className="text-xs text-slate-500">Draft agreement version: {AGREEMENT_VERSION}. These terms should be reviewed by an Ontario lawyer before being relied upon as the final legal agreement.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="rental-typed-name" className="block text-sm font-semibold text-slate-800">Type your full legal name</label>
        <input id="rental-typed-name" value={typedName} onChange={e => setTypedName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" placeholder={customer.customer_name || 'Full legal name'} autoComplete="name" />
      </div>

      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <label className="block text-sm font-semibold text-slate-800">Draw your signature</label>
          <button type="button" onClick={clearSignature} className="text-sm text-blue-700 underline">Clear signature</button>
        </div>
        <canvas ref={canvasRef} width={900} height={220} onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerCancel={stopDrawing} onPointerLeave={stopDrawing} aria-label="Draw your signature here" className="w-full h-32 rounded-lg border border-slate-300 bg-white touch-none cursor-crosshair" />
        <p className="text-xs text-slate-500 mt-1">Use your mouse, trackpad, or touchscreen to sign.</p>
      </div>

      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-1" />
        <span>I have read and agree to the Equipment Rental Agreement above, and I intend my typed name and drawn signature to serve as my electronic signature.</span>
      </label>

      {error && <p role="alert" className="text-sm text-red-700 bg-red-50 rounded-lg p-3">{error}</p>}
      <button type="button" onClick={saveAgreement} disabled={saving} className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold py-3.5 px-4">
        {saving ? 'Saving signed agreement securely…' : 'Sign Agreement & Continue to Payment'}
      </button>
    </section>
  );
}
