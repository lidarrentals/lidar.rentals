import { useEffect, ReactNode } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

export default function Layout({ children }: { children: ReactNode }) {
  
  useEffect(() => {
    // 1. Initialize the global window container configuration arrays
    (window as any).$crisp = [];
    (window as any).CRISP_WEBSITE_ID = "eaf1a794-6341-4d01-8c6a-354bf0d7b0d2";

    // 2. Corrected element injection sequence targeting the document head safely
    const d = document;
    const s = d.createElement("script");
    s.src = "https://crisp.chat";
    s.async = true;
    d.head.appendChild(s); // Uses the direct, bulletproof .head shortcut
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
