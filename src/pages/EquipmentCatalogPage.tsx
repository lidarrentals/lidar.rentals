import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { Shield, Loader2, Search, SlidersHorizontal, Sliders, Smartphone, Download, X } from 'lucide-react';
import { formatCurrency } from '@/lib/pricing';
import { navigate } from '@/lib/router';
import type { Equipment } from '@/types';

export default function EquipmentCatalogPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 1. Mobile PWA Installer state tracking nodes
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    fetchActiveInventory();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    // 2. Intercept the browser's hidden download token and wake up the layout banner natively
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  const fetchActiveInventory = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('equipment')
      .select('*')
      .eq('is_active', true)
      .eq('is_accessory', false); // Hide independent add-ons from the main feed layout
    
    setEquipment(data || []);
    setLoading(false);
  };

  // 3. Native prompt trigger mechanism executing the install loop sequence safely
  const handleTriggerAppInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User installed the lidar.rentals mobile bundle package application.');
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const filteredEquipment = equipment.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* NATIVE APP DOWNLOAD INTERACTIVE PROMPT BANNER OVERLAY */}
      {showInstallBanner && (
        <div className="bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-xl text-white shadow-inner animate-pulse">
              <Smartphone size={22} />
            </div>
            <div>
              <h4 className="font-black text-sm tracking-tight">Download lidar.rentals App</h4>
              <p className="text-xs text-slate-400 font-medium">Install our mobile client to map availability and track logistics instantly.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={handleTriggerAppInstall}
              className="flex-1 sm:flex-none bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Download size={14} strokeWidth={2.5} />
              <span>Install Now</span>
            </button>
            <button 
              onClick={() => setShowInstallBanner(false)}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Catalog Layout View Grid Container Headers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">LiDAR Equipment Inventory</h1>
          <p className="text-sm text-slate-500 font-medium">Professional standalone aerial scanners and drone logistics sensor arrays.</p>
        </div>

        <div className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search gear matrix rows..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="p-2.5 border bg-white border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-colors shadow-sm">
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Grid Loops rendering individual asset cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.length === 0 ? (
          <p className="text-center text-slate-400 py-10 col-span-full">No active fleet hardware matches your text filter matrix strings.</p>
        ) : (
          filteredEquipment.map((item) => (
            <div 
              key={item.id} 
              onClick={() => navigate(`/equipment/${item.id}`)}
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
            >
              <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden border-b border-slate-100">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                )}
              </div>
              
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-1">{item.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2 mt-1">{item.description}</p>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Lease Rate</span>
                    {isLoggedIn ? (
                      <span className="text-base font-black text-slate-900">{formatCurrency(item.price_1day)} <span className="text-xs font-normal text-slate-500">/ day</span></span>
                    ) : (
                      <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 block mt-0.5">Authorized Accounts</span>
                    )}
                  </div>
                  <span className="text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-xl group-hover:bg-blue-600 transition-colors shadow-sm">
                    View Details
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
