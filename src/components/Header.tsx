import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, User, Menu, X, Shield } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const [currentRoute, setCurrentRoute] = useState(typeof window !== 'undefined' ? window.location.hash : '');
  const cartContext = useCart();
  const cart = cartContext?.cart || [];
  const setIsOpen = cartContext?.setIsOpen;
  
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => setCurrentRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      subscription.unsubscribe();
    };
  }, []);

  const totalItems = Array.isArray(cart) ? cart.reduce((sum, item) => sum + item.quantity, 0) : 0;

  const handleNav = (path: string) => {
    window.location.hash = path;
    setMobileMenuOpen(false);
  };
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Brand Logo Navigation Anchor Section */}
          <button 
            onClick={() => handleNav('/')} 
            className="flex items-center gap-3 group text-left cursor-pointer bg-transparent border-0 p-0"
          >
            {/* Embedded Native Vector Drone Scanner Logo Icon Grid Box Element */}
            <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#07111e] overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 720 720" className="w-full h-full" shape-rendering="geometricPrecision">
                <defs>
                  <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <g transform="translate(36, 40) scale(0.9)">
                  <polygon points="320,130 400,130 460,200 420,320 300,320 260,200" fill="#4faee3" stroke="#0b3152" stroke-width="4"/>
                  <polygon points="320,130 400,130 435,210 360,260 285,210" fill="#86d4ff"/>
                  <circle cx="360" cy="290" r="16" fill="#ffffff" opacity="0.9" filter="url(#laserGlow)"/>
                  <polygon points="280,160 160,90 130,110 270,190" fill="#0f526d" stroke="#072330" stroke-width="3"/>
                  <rect x="120" y="70" width="36" height="45" rx="6" fill="#1b82a3" stroke="#072330" stroke-width="3"/>
                  <circle cx="138" cy="70" r="6" fill="#1b82a3"/>
                  <polygon points="440,160 560,90 590,110 450,190" fill="#0f526d" stroke="#072330" stroke-width="3"/>
                  <rect x="564" y="70" width="36" height="45" rx="6" fill="#1b82a3" stroke="#072330" stroke-width="3"/>
                  <circle cx="582" cy="70" r="6" fill="#1b82a3"/>
                  <polygon points="270,280 140,360 110,340 260,250" fill="#0f526d" stroke="#072330" stroke-width="3"/>
                  <rect x="106" y="340" width="36" height="45" rx="6" fill="#1b82a3" stroke="#072330" stroke-width="3"/>
                  <circle cx="124" cy="340" r="6" fill="#1b82a3"/>
                  <polygon points="450,280 580,360 610,340 460,250" fill="#0f526d" stroke="#072330" stroke-width="3"/>
                  <rect x="578" y="340" width="36" height="45" rx="6" fill="#1b82a3" stroke="#072330" stroke-width="3"/>
                  <circle cx="596" cy="340" r="6" fill="#1b82a3"/>
                  <path d="M 290,320 L 260,400 L 260,430" fill="none" stroke="#badef2" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M 430,320 L 460,400 L 460,430" fill="none" stroke="#badef2" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M 120,530 A 280,280 0 0,0 600,530" fill="none" stroke="#00f3ff" stroke-width="16" stroke-linecap="round" filter="url(#laserGlow)"/>
                  <g stroke="#00f3ff" stroke-width="5" opacity="0.85" stroke-dasharray="2,12" filter="url(#laserGlow)">
                    <line x1="360" y1="360" x2="160" y2="515" stroke-width="6"/>
                    <line x1="360" y1="360" x2="230" y2="538" stroke-width="5"/>
                    <line x1="360" y1="360" x2="300" y2="550" stroke-width="4"/>
                    <line x1="360" y1="360" x2="360" y2="555" stroke-width="6"/>
                    <line x1="360" y1="360" x2="420" y2="550" stroke-width="4"/>
                    <line x1="360" y1="360" x2="490" y2="538" stroke-width="5"/>
                    <line x1="360" y1="360" x2="560" y2="515" stroke-width="6"/>
                  </g>
                  <circle cx="120" cy="530" r="8" fill="#00f3ff" filter="url(#laserGlow)"/>
                  <circle cx="600" cy="530" r="8" fill="#00f3ff" filter="url(#laserGlow)"/>
                </g>
              </svg>
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              lidar<span className="text-blue-600">.rentals</span>
            </span>
          </button>

          {/* Desktop Navigation Link Arrays */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => handleNav('/equipment')} 
              className={`text-sm font-semibold transition-colors cursor-pointer bg-transparent border-0 ${
                currentRoute.includes('equipment') ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Equipment
            </button>
            <button 
              onClick={() => handleNav('/services')} 
              className={`text-sm font-semibold transition-colors cursor-pointer bg-transparent border-0 ${
                currentRoute.includes('services') ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Services
            </button>
          </nav>

          {/* User Controls Panel Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user && user.email === 'your-admin-email@domain.com' && (
              <button 
                onClick={() => handleNav('/admin')} 
                className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-1.5 text-xs font-bold border border-slate-200 cursor-pointer bg-white"
              >
                <Shield size={16} className="text-blue-600" />
                <span>Admin Panel</span>
              </button>
            )}

            <button 
              onClick={() => setIsOpen && setIsOpen(true)} 
              className="relative p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all cursor-pointer group bg-transparent border-0"
            >
              <ShoppingCart size={21} className="group-hover:scale-105 transition-transform" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>

            <button 
              onClick={() => handleNav('/account')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                currentRoute.includes('account')
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <User size={16} />
              <span>{user ? 'My Account' : 'Sign In'}</span>
            </button>
          </div>

          {/* Mobile Menu Action Toggle Button Element */}
          <div className="flex md:hidden items-center gap-3">
            <button 
              onClick={() => setIsOpen && setIsOpen(true)} 
              className="relative p-2 text-slate-600 bg-transparent border-0"
            >
              <ShoppingCart size={22} />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="p-2 text-slate-600 bg-transparent border-0"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Overlay panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-inner">
          <button 
            onClick={() => handleNav('/equipment')} 
            className="block w-full text-left py-2 text-base font-bold text-slate-700 hover:text-blue-600 bg-transparent border-0"
          >
            Equipment Catalog
          </button>
          <button 
            onClick={() => handleNav('/services')} 
            className="block w-full text-left py-2 text-base font-bold text-slate-700 hover:text-blue-600 bg-transparent border-0"
          >
            Drone Services
          </button>
          <hr className="border-slate-100" />
          <button 
            onClick={() => handleNav('/account')} 
            className="block w-full text-center py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm border-0"
          >
            {user ? 'Go to Dashboard' : 'Sign Into Portal'}
          </button>
        </div>
      )}
    </header>
  );
}
