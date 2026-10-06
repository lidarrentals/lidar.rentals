import { useEffect, ReactNode } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

export default function Layout({ children }: { children: ReactNode }) {
  
  useEffect(() => {
    // Standard direct browser script setup module
    (window as any).$crisp = [];
    const d = document;
    const s = d.createElement("script");
    s.src = "https://crisp.chat";
    s.async = true;
    
    // Explicitly add your exact web profile ID signature directly into the script data attribute parameters
    s.setAttribute("data-id", "eaf1a794-6341-4d01-8c6a-354bf0d7b0d2");
    
    d.head.appendChild(s);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
