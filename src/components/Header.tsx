import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Menu, X, User } from 'lucide-react';
import { formatCurrency } from '@/lib/pricing';

export default function Header() {
  const { total, itemsCount, setIsOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <a href="#/" className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-lg">L</span>
              lidar.rentals
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            <a href="#/equipment" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors">Equipment</a>
            <a href="#/services" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors">Services</a>
          </nav>

          {/* Desktop Right Side Action Group */}
          <div className="hidden md:flex items-center gap-4">
            {/* Added: Account Portal Navigation Button */}
            <a 
              href="#/account" 
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 rounded-lg transition-colors hover:bg-slate-50"
            >
              <User size={18} />
              <span>My Account</span>
            </a>

            {/* Shopping Cart Drawer Trigger Button */}
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm group"
            >
              <ShoppingCart size={16} className="text-slate-400 group-hover:text-white transition-colors" />
              <span>{itemsCount > 0 ? `${itemsCount} items` : 'Cart'}</span>
              {total > 0 && <span className="border-l border-slate-700 pl-2 ml-1 text-slate-300 font-medium">{formatCurrency(total)}</span>}
            </button>
          </div>

          {/* Mobile Menu Icon Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={() => setIsOpen(true)} className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg relative">
              <ShoppingCart size={20} />
              {itemsCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{itemsCount}</span>}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg">
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Flyout Panel Links */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 shadow-inner animate-in fade-in slide-in-from-top-2 duration-200">
          <a href="#/equipment" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50">Equipment</a>
          <a href="#/services" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50">Services</a>
          <a href="#/account" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-xl text-base font-medium text-blue-600 bg-blue-50/50 font-semibold flex items-center gap-2"><User size={18} /> My Account Dashboard</a>
        </div>
      )}
    </header>
  );
}
