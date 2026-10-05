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

  const handleCalculateShipping = async () => {
    if (!address.street1 || !address.city || !address.zip) {
      setError('Please provide your street address, city, and postal code.');
      return;
    }

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
        throw new Error('Could not fetch rates. Please check address parameter layout.');
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
    onRateSelect(parseFloat(rate.amount));
  };

  return (
    <div className="p-6 bg-white">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
        <MapPin size={20} className="text-blue-600" /> Calculate Delivery Fees
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Recipient Full Name</label>
          <input type="text" name="name" placeholder="John Smith" value={address.name} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Street Address</label>
          <input type="text" name="street1" placeholder="123 Main Street" value={address.street1} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
            <input type="text" name="city" placeholder="Toronto" value={address.city} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Province</label>
            <input type="text" name="state" placeholder="ON" value={address.state} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Postal Code</label>
            <input type="text" name="zip" placeholder="M5V 2T6" value={address.zip} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <button 
          type="button" 
          onClick={handleCalculateShipping}
          disabled={loading} 
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Get Round-Trip Rates'}
        </button>
      </div>

      {error && <p className="text-red-600 mt-3 text-sm font-medium">{error}</p>}

      {rates.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
            <Truck size={18} className="text-slate-600" /> Quotes:
          </h3>
          <div className="flex flex-col gap-2.5">
            {rates.map((rate) => (
              <label key={rate.id} className={`flex justify-between items-center p-4 border rounded-xl cursor-pointer transition-all ${selectedRate?.id === rate.id ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50/80'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="shippingRate" checked={selectedRate?.id === rate.id} onChange={() => handleSelectRate(rate)} className="cursor-pointer h-4 w-4 accent-blue-600" />
                  <div>
                    <strong className="block text-sm text-slate-900">{rate.provider}</strong>
                    <span className="text-xs text-slate-500">{rate.service}</span>
                  </div>
                </div>
                <span className="font-bold text-base text-slate-900">${rate.amount}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
