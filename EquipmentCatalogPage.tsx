import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Layers, Search, SlidersHorizontal } from 'lucide-react';
import EquipmentCard from '@/components/EquipmentCard';

export default function EquipmentCatalogPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadCatalogData() {
            setIsLoading(false);
            try {
                // Query your live Supabase database tables directly
                const { data, error } = await supabase.from('products').select('*');

                if (error) {
                    console.error("Supabase data connection error details:", error);
                    throw error;
                }

                if (data && data.length > 0) {
                    // Normalize column keys on the fly so your app renders flawlessly
                    const mappedData = data.map((item: any) => ({
                        id: item.id,
                        name: item.name || item.title || 'LiDAR Rental Hardware',
                        description: item.description || item.summary || 'Premium laser scanning hardware array available for deployment.',
                        price: Number(item.price || item.day_rate || item.rate || 150),
                        image_url: item.image_url || item.image || item.photo
                    }));
                    setProducts(mappedData);
                } else {
                    console.warn("Products table connected successfully, but returned an empty array [].");
                    setProducts([]);
                }
            } catch (err) {
                console.error("Database connection dropped. Check environment keys.", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadCatalogData();
    }, []);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className= "max-w-7xl mx-auto px-4 py-8" >
        {/* Header Banner Section Layout */ }
        < div className = "mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-6" >
            <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2" >
                <Layers className="w-8 h-8 text-blue-600" /> Deployment Logistics Fleet
                    </h1>
                    < p className = "text-slate-500 mt-1 text-sm" > Select tactical premium aerial scanning hardware and configurations available for immediate project booking dispatch.</p>
                        </div>

    {/* Filter Input Shell */ }
    <div className="relative max-w-md w-full" >
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input 
            type="text"
    value = { searchQuery }
    onChange = {(e) => setSearchQuery(e.target.value)
}
placeholder = "Search active gear records..."
className = "w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-hidden focus:border-blue-500 font-medium"
    />
    </div>
    </div>

{/* Loading/Grid View Layout */ }
{
    isLoading ? (
        <div className= "text-center py-16 text-slate-500 font-medium animate-pulse" >
        Connecting to your Supabase product rows...
    </div>
      ) : filteredProducts.length === 0 ? (
        <div className= "text-center py-16 bg-white rounded-2xl border border-slate-200" >
        <SlidersHorizontal className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-semibold" > No equipment records match your current criteria strings.</p>
                < p className = "text-slate-400 text-sm mt-1" > Make sure rows exist inside your Supabase "products" table editor view! </p>
                    </div>
      ) : (
        <div className= "grid sm:grid-cols-2 lg:grid-cols-3 gap-6" >
        {
            filteredProducts.map((item) => (
                <EquipmentCard 
              key= { item.id }
              id = { item.id }
              name = { item.name }
              description = { item.description }
              price = { item.price }
              image_url = { item.image_url }
                />
          ))
        }
        </div>
      )
}
</div>
  );
}

