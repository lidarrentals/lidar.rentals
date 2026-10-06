import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, User, Menu, X, Shield } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { navigate } from '@/lib/router';

export default function Header() {
  const currentRoute = typeof window !== 'undefined' ? window.location.hash : '';
  const { cart, setIsOpen } = useCart();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Brand Logo Navigation Anchor Section */}
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-3 group text-left cursor-pointer"
          >
            <img 
              src="/icon-192.svg" 
              alt="lidar.rentals logo" 
              className="w-11 h-11 object-contain rounded-xl shadow-sm group-hover:scale-105 transition-transform" 
            />
            <span className="text-xl font-black text-slate-900 tracking-tight">
              lidar<span className="text-blue-600">.rentals</span>
            </span>
          </button>

          {/* Desktop Navigation Link Arrays */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => navigate('/equipment')} 
              className={`text-sm font-semibold transition-colors cursor-pointer ${
                currentRoute.includes('equipment') ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Equipment
            </button>
            <button 
              onClick={() => navigate('/services')} 
              className={`text-sm font-semibold transition-colors cursor-pointer ${
                currentRoute.includes('services') ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Services
            </button>
          </nav>

          {/* User Controls Panel Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Safe optional chaining check added here to prevent blank page crashes */}
            {user && user.email === 'your-admin-email@domain.com' && (
              <button 
                onClick={() => navigate('/admin')} 
                className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-1.5 text-xs font-bold border border-slate-200"
              >
                <Shield size={16} className="text-blue-600" />
                <span>Admin Panel</span>
              </button>
            )}

            <button 
              onClick={() => setIsOpen(true)} 
              className="relative p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all cursor-pointer group"
            >
              <ShoppingCart size={21} className="group-hover:scale-105 transition-transform" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>

            <button 
              onClick={() => navigate('/account')} 
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
              onClick={() => setIsOpen(true)} 
              className="relative p-2 text-slate-600"
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
              className="p-2 text-slate-600"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </div>

      {/* Responsive Slide Out Mobile Context Panel Drawer Grid Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-inner animate-in slide-in-from-top-4 duration-200">
          <button 
            onClick={() => { setMobileMenuOpen(false); navigate('/equipment'); }} 
            className="block w-full text-left py-2 text-base font-bold text-slate-700 hover:text-blue-600"
          >
            Equipment Catalog
          </button>
          <button 
            onClick={() => { setMobileMenuOpen(false); navigate('/services'); }} 
            className="block w-full text-left py-2 text-base font-bold text-slate-700 hover:text-blue-600"
          >
            Drone Services
          </button>
          <hr className="border-slate-100" />
          <button 
            onClick={() => { setMobileMenuOpen(false); navigate('/account'); }} 
            className="block w-full text-center py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm"
          >
            {user ? 'Go to Dashboard' : 'Sign Into Portal'}
          </button>
        </div>
      )}
    </header>
  );
}
