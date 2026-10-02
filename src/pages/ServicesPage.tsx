import { useEffect, useState } from 'react';
import { ScanLine, ArrowRight, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import type { Service } from '@/types';
import ServiceCard from '@/components/ServiceCard';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('services').select('*').eq('is_active', true).order('created_at', { ascending: false });
      setServices(data || []);
      setLoading(false);
    })();
  }, []);

  const process = [
    { step: '01', title: 'Book Online', desc: 'Choose your service and select available dates on the calendar.' },
    { step: '02', title: 'We Come to You', desc: 'Our certified technicians arrive on-site with all equipment.' },
    { step: '03', title: 'Scan & Capture', desc: 'High-precision LiDAR and 3D scanning of your site or assets.' },
    { step: '04', title: 'Receive Deliverables', desc: 'Get point clouds, 3D models, and reports in your format.' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/15360459/pexels-photo-15360459.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
            alt="3D scanning technology"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/85 to-slate-900/50" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-medium mb-4">
              <ScanLine className="w-4 h-4" />
              SaaS Scanning as a Service
            </span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
              Onsite 3D Scanning Services
            </h1>
            <p className="mt-5 text-lg text-slate-300 leading-relaxed">
              Professional LiDAR scanning, building envelope analysis, and precision measurement
              services delivered on-site by certified technicians. Book by the day or week with
              real-time availability.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Check className="w-4 h-4 text-green-400" />
                Certified technicians
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Check className="w-4 h-4 text-green-400" />
                State-of-the-art equipment
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Check className="w-4 h-4 text-green-400" />
                Fast turnaround
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Available Services</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(s => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900">How It Works</h2>
            <p className="text-slate-500 mt-2">From booking to deliverables in four simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {process.map((p, idx) => (
              <div key={p.step} className="relative">
                <div className="text-4xl font-bold text-blue-100 mb-3">{p.step}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{p.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{p.desc}</p>
                {idx < process.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-2 -right-3 w-6 h-6 text-slate-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-blue-600 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Ready to book your scanning service?
          </h2>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto">
            Check availability and reserve your dates instantly. Our team will confirm within 24 hours.
          </p>
          <button
            onClick={() => {
              const el = document.querySelector('[data-services-grid]');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-6 py-3.5 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
          >
            View Services & Book
          </button>
        </div>
      </section>
    </div>
  );
}
