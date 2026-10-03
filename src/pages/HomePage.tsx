import { useEffect, useState } from 'react';
import { ArrowRight, Truck, ShieldCheck, Clock, Headphones, ScanLine, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import type { Equipment, Category } from '@/types';
import EquipmentCard from '@/components/EquipmentCard';
import DownloadAppSection from '@/components/DownloadAppSection';

export default function HomePage() {
  const [featured, setFeatured] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [eqRes, catRes] = await Promise.all([
        supabase.from('equipment').select('*').eq('is_active', true).eq('featured', true).order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
      ]);
      setFeatured(eqRes.data || []);
      setCategories(catRes.data || []);
      setLoading(false);
    })();
  }, []);

  const features = [
    { icon: Truck, title: 'Free Delivery', desc: 'On rentals over $5000 within 200 Kilometers from Toronto' },
    { icon: ShieldCheck, title: 'Insured Equipment Options', desc: 'All equipment must be fully insured' },
    { icon: Clock, title: 'Flexible Rentals', desc: '1 day to 1 month rental periods' },
    { icon: Headphones, title: '24/7 Support', desc: 'Expert help when you need it' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/Nexys-flying-into-stope-2-1.png"
            alt="LiDAR drone scanning an underground stope"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-900/40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-medium mb-4">
              Professional Equipment Rental
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
              LiDAR-ready equipment for every job
            </h1>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-xl">
              Autonomous LiDAR drone rentals for GPS Denied environoments, 3D SLAM Mobile Lidar scanners and accessories. 
              
              lidar.rentals offers flexible rental periods with real-time availability and a seamless checkout. Plus, professional onsite 3D scanning services and emergency services.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/equipment')}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 group"
              >
                Browse Equipment
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/services')}
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ScanLine className="w-5 h-5" />
                Onsite Scanning Services
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features bar */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{f.title}</h3>
                  <p className="text-xs text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Featured equipment */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Featured Equipment</h2>
            <p className="text-sm text-slate-500 mt-1">Top-rated rentals ready to book</p>
          </div>
          <button
            onClick={() => navigate('/equipment')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-full" />
                  <div className="h-6 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((eq) => (
              <EquipmentCard key={eq.id} equipment={eq} />
            ))}
          </div>
        )}
      </section>

      {/* Onsite scanning CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <img
              src="/images/Nexys-flying-into-stope-2-1.png"
              alt="Drone LiDAR scanning underground"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-block px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-medium mb-4">
                SaaS Scanning as a Service
              </span>
              <h2 className="text-3xl font-bold text-white mb-4">
                Professional Onsite 3D Scanning
              </h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                Our certified technicians will come to your site with state-of-the-art LiDAR scanners and autonomous drones for BVLOS/ GPS Denied mapping
                for underground mining. Book by the day or week with real-time availability.
              </p>
              <button
                onClick={() => navigate('/services')}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-colors flex items-center gap-2 group"
              >
                Explore Services
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/10">
                <ScanLine className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="text-white font-semibold mb-1">3D Laser Scanning</h3>
                <p className="text-sm text-slate-400">Point clouds, BIM models, as-built docs</p>
              </div>
              <div className="flex-1 bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/10">
                <ShieldCheck className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="text-white font-semibold mb-1">Building Envelope</h3>
                <p className="text-sm text-slate-400">Thermal imaging, moisture detection</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download App */}
      <DownloadAppSection />
    </div>
  );
}
