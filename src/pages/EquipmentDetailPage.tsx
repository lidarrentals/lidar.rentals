import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { Calendar, Shield, ShoppingCart, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/pricing';
import { navigate, getRouteParams } from '@/lib/router';
import type { Equipment } from '@/types';
import AccessoryModal from '@/components/AccessoryModal';

export default function EquipmentDetailPage() {
  const params = getRouteParams();
  const { addToCart, setIsOpen } = useCart();
  
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [rentalDays, setRentalDays] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Dynamic modular pop-up visibility gate trackers
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (params?.id) {
      fetchProductDetails(params.id);
    }
    // Listen for public session auth context tokens instantly
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, [params?.id]);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      setRentalDays(diffDays);
    }
  }, [startDate, endDate]);

  const fetchProductDetails = async (id: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', id)
      .single();
    setEquipment(data);
    setLoading(false);
  };

  const handleAddToCartClick = () => {
    if (!startDate || !endDate) {
      alert('Please select your preferred rental timeline windows first.');
      return;
    }
    // Intercept the silently adding process and wake up your new companion accessory bundle matrix!
    setIsModalOpen(true);
  };

  const handleFinishBundleAddToCart = (selectedAccessories: Equipment[]) => {
    if (!equipment) return;

    // 1. Add your core primary machine item choice first
    addToCart(equipment, rentalDays, startDate, endDate, quantity);

    // 2. Loop through and append every checked accessory choice right behind it using the same rental timeline windows
    selectedAccessories.forEach(acc => {
      addToCart(acc, rentalDays, startDate, endDate, 1);
    });

    setIsModalOpen(false);
    setIsOpen(true); // Automatically opens your slide-out checkout CartDrawer right away!
  };

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  if (!equipment) {
    return (
      <div className="max-w-md mx-auto my-20 text-center">
        <h3 className="text-lg font-bold text-slate-900">Equipment item record not found</h3>
        <button onClick={() => navigate('/equipment')} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Return to Catalog</button>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => navigate('/equipment')} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors group">
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Equipment Catalog</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
        {/* Left Side: Product Showcase Gallery Images Container View */}
        <div className="space-y-4">
          <div className="aspect-[4/3] bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
            {equipment.image_url ? (
              <img src={equipment.image_url} alt={equipment.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 text-6xl">📦</div>
            )}
          </div>
          <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed pt-2">
            <h3 className="text-slate-900 font-bold text-sm uppercase tracking-wider mb-2">Technical Specifications</h3>
            <p>{equipment.description}</p>
          </div>
        </div>

        {/* Right Side: Rental Pricing Operations Form Dashboard */}
        <div className="flex flex-col justify-between h-full space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 inline-block mb-3">Professional Asset</span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">{equipment.name}</h1>
            <p className="text-sm text-slate-400 font-mono mt-1">Serial SKU ID: {equipment.id.slice(0, 8).toUpperCase()}</p>

            <div className="my-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Daily Standard Lease Rate</span>
                {isLoggedIn ? (
                  <span className="text-2xl font-black text-slate-900 mt-0.5">{formatCurrency(equipment.price_1day)} <span className="text-xs text-slate-500 font-normal">/ day</span></span>
                ) : (
                  <span className="text-base font-bold text-blue-600 block mt-1">Gated: Authorized Accounts Only</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Availability Pool</span>
                <span className="text-sm font-bold text-slate-800 bg-white px-2.5 py-1 border rounded-lg inline-block mt-1 shadow-sm">{equipment.quantity} units ready</span>
              </div>
            </div>

            {/* Selection Inputs Form Box elements */}
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1"><Calendar size={12} /> Lease Start</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1"><Calendar size={12} /> Lease Return</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Lease Quantity (Units)</label>
                <select value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full p-2.5 border rounded-xl text-sm bg-white cursor-pointer font-semibold">
                  {[...Array(equipment.quantity || 1)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1} Unit{i > 0 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            {startDate && endDate && (
              <div className="flex justify-between items-center text-sm p-3 bg-slate-50 border rounded-xl">
                <span className="text-slate-500 font-medium">Timeline Duration Summary:</span>
                <span className="font-bold text-slate-800">{rentalDays} rental operation days</span>
              </div>
            )}

            {isLoggedIn ? (
              <button onClick={handleAddToCartClick} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer text-sm">
                <ShoppingCart size={16} className="group-hover:scale-105 transition-transform" />
                <span>Reserve Equipment & Select Add-ons</span>
              </button>
            ) : (
              <button onClick={() => navigate('/account')} className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer">
                <span>Secure Sign-In Required to Process Lease Requests</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Render the modular accessory options bundle sheet tag overlay safely before closing the tree template canvas */}
      <AccessoryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        primaryItem={equipment}
        onConfirm={handleFinishBundleAddToCart}
      />
    </div>
  );
}
