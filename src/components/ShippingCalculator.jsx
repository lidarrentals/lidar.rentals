import React, { useState } from 'react';
import { Truck, MapPin, Loader2 } from 'lucide-react';

export default function ShippingCalculator() {
  // 1. Setup state to store address form inputs
  const [address, setAddress] = useState({
    name: '',
    street1: '',
    city: '',
    state: '',
    zip: '',
    country: 'CA' // Defaulting to Canada
  });

  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRate, setSelectedRate] = useState(null);

  // Handle text typing inputs
  const handleChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  // 2. Call your secure Netlify serverless function
  const handleCalculateShipping = async (e) => {
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '20px auto', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', fontFamily: 'sans-serif' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', marginBottom: '16px' }}>
        <MapPin size={20} /> Shipping Address (Round-Trip)
      </h2>

      {/* Address Input Form */}
      <form onSubmit={handleCalculateShipping} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input type="text" name="name" placeholder="Full Name" required value={address.name} onChange={handleChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
        <input type="text" name="street1" placeholder="Street Address" required value={address.street1} onChange={handleChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" name="city" placeholder="City" required value={address.city} onChange={handleChange} style={{ flex: 2, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
          <input type="text" name="state" placeholder="Province (e.g. ON)" required value={address.state} onChange={handleChange} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
          <input type="text" name="zip" placeholder="Postal Code" required value={address.zip} onChange={handleChange} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
        </div>

        <button type="submit" disabled={loading} style={{ background: '#2563eb', color: 'white', padding: '10px', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}>
          {loading ? <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={18} /> : 'Calculate Shipping'}
        </button>
      </form>

      {/* Error State */}
      {error && <p style={{ color: '#dc2626', marginTop: '12px', fontSize: '0.875rem' }}>{error}</p>}

      {/* Live Carrier Rates Results UI */}
      {rates.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Truck size={18} /> Choose Delivery Option:
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rates.map((rate) => (
              <label key={rate.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: selectedRate?.id === rate.id ? '2px solid #2563eb' : '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', background: selectedRate?.id === rate.id ? '#f0fdf4' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="radio" name="shippingRate" checked={selectedRate?.id === rate.id} onChange={() => setSelectedRate(rate)} style={{ cursor: 'pointer' }} />
                  <div>
                    <strong style={{ display: 'block' }}>{rate.provider}</strong>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{rate.service}</span>
                  </div>
                </div>
                <span style={{ fontWeight: 'bold', color: '#1e293b' }}>\${rate.amount} {rate.currency}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* CSS injection for the loading spinner animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
