import { useEffect, useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Equipment, Category } from '@/types';
import EquipmentCard from '@/components/EquipmentCard';

export default function EquipmentCatalogPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  
  // Track if a secure customer profile account session is currently logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      // 1. Check current authenticated registration profile states instantly
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      const [eqRes] = await Promise.all([
        supabase.from('equipment').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      ]);
      const catRes = { data: [], error: null };
    
      setEquipment(eqRes.data || []);
      setCategories((catRes.data || []).filter(c => c.slug !== 'onsite-services'));
      setLoading(false);

      // Check for category from URL hash
      const hash = window.location.hash;
      const match = hash.match(/category=([^&]+)/);
      if (match) {
        const slug = decodeURIComponent(match[1]);
        const cat = (catRes.data || []).find(c => c.slug === slug);
        if (cat) setSelectedCategory(cat.id);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = equipment;
    if (selectedCategory !== 'all') {
      result = result.filter(e => e.category_id === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
      );
    }
    result = [...result].sort((a, b) => {
      if (sortBy === 'price-low') return a.price_1day - b.price_1day;
      if (sortBy === 'price-high') return b.price_1day - a.price_1day;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
    return result;
  }, [equipment, selectedCategory, search, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Equipment Rental Catalog</h1>
        <p className="text-slate-500 mt-2">
          Browse our full inventory of professional rental equipment with real-time availability.
        </p>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-9 pr-8 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
          >
            <option value="name">Sort: Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-slate-500">
        {loading ? 'Loading...' : `${filtered.length} item${filtered.length !== 1 ? 's' : ''} available`}
      </div>

      {/* Grid rendering section layout area */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">No equipment found</h3>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((eq) => (
            <div key={eq.id} className={!isLoggedIn ? "hide-pricing-card-wrapper" : ""}>
              {/* Pass the session boolean state variable directly down into your equipment cards */}
              <EquipmentCard equipment={eq} isLoggedIn={isLoggedIn} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
