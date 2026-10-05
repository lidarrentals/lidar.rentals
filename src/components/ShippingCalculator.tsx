import React, { useState } from 'react';
import { Truck, MapPin, Loader2 } from 'lucide-react';

interface ShippingCalculatorProps {
  onRateSelect: (amount: number) => void;
}

export default function ShippingCalculator({ onRateSelect }: ShippingCalculatorProps) {
  const [address, setAddress] = useState({
    name: '',
    street1: '',
    city: '',
    state: '',
    zip: '',
    country: 'CA'
  });

  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRate, setSelectedRate] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleCalculateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRates([]);

    try {
      const response = await fetch('/.netlify/functions/get-live-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerAddress: address })
      });

      if (!response.ok) {
        throw new Error('Could not fetch rates. Please check your address details.');
      }

      const data = await response.json();
      setRates(data.rates || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRate = (rate: any) => {
    setSelectedRate(rate);
    // Convert the string amount (e.g. "24.50") to a clean number and pass it out
    onRateSelect(parseFloat(rate.amount));
  };

  return (
    <div className="p-4 family-sans">
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 mb-4">
        <MapPin size={18} /> Shipping Address (Round-Trip)
      </h2>

      <form onSubmit={handleCalculateShipping} className="flex flex-col gap-3">
        <input type="text" name="name" placeholder="Full Name" required value={address.name} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="text" name="street1" placeholder="Street Address" required value={address.street1} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        
        <div className="flex gap-2">
          <input type="text" name="city" placeholder="City" required value={address.city} onChange={handleChange} className="flex-1 min-w-0 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" name="state" placeholder="Prov" required value={address.state} onChange={handleChange} className="w-16 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" name="zip" placeholder="Postal Code" required value={address.zip} onChange={handleChange} className="w-28 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
          {loading ? <Loader2 className="animate-spin" size={16} /> : 'Calculate Shipping'}
        </button>
      </form>

      {error && <p className="text-red-600 mt-2 text-xs">{error}</p>}

      {rates.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
            <Truck size={16} /> Choose Delivery Option:
          </h3>
          <div className="flex flex-col gap-2">
            {rates.map((rate) => (
              <label key={rate.id} className={`flex justify-between items-center p-3 border rounded-xl cursor-pointer transition-all ${selectedRate?.id === rate.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="shippingRate" checked={selectedRate?.id === rate.id} onChange={() => handleSelectRate(rate)} className="cursor-pointer accent-blue-600" />
                  <div>
                    <strong className="block text-sm text-slate-900">{rate.provider}</strong>
                    <span className="text-xs text-slate-500">{rate.service}</span>
                  </div>
                </div>
                <span className="font-bold text-sm text-slate-900">\${rate.amount}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
