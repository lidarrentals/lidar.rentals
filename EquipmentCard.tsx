import { useState } from 'react';
import { Shield, Info, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/pricing';
import { useCart } from '@/context/CartContext';

interface EquipmentProps {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url?: string;
}

export default function EquipmentCard({ id, name, description, price, image_url }: EquipmentProps) {
    const { addItem } = useCart();
    const [days, setDays] = useState<number>(5);
    const [quantity, setQuantity] = useState<number>(1);
    const [added, setAdded] = useState(false);

    const calculatedLineTotal = price * days * quantity;

    const handleAddToCart = () => {
        addItem({
            id,
            name,
            quantity,
            rentalPeriod: days,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + days * 86400000).toISOString().split('T')[0],
            lineTotal: calculatedLineTotal
        });

        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <div className= "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full" >
        <div className="aspect-video w-full bg-slate-100 relative overflow-hidden" >
            <img 
          src={ image_url || 'https://unsplash.com' }
    alt = { name }
    className = "w-full h-full object-cover"
        />
        <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-md" >
            { formatCurrency(price) } / day
            </span>
            </div>

            < div className = "p-5 flex flex-col flex-grow justify-between space-y-4" >
                <div>
                <h3 className="font-bold text-slate-900 text-lg" > { name } </h3>
                    < p className = "text-slate-500 text-sm mt-1.5 line-clamp-2" > { description } </p>
                        </div>

    {/* Dynamic Rental Matrix Controls */ }
    <div className="bg-slate-50 rounded-xl p-3.5 space-y-3 border border-slate-100 text-xs" >
        <div className="flex justify-between items-center" >
            <span className="text-slate-600 font-medium flex items-center gap-1" > <Shield className="w-3.5 h-3.5 text-blue-500" /> Duration </span>
                < select
    value = { days }
    onChange = {(e) => setDays(Number(e.target.value))
}
className = "bg-white border border-slate-200 rounded-md py-1 px-2 font-semibold text-slate-800"
    >
    <option value={ 3 }> 3 Days </option>
        < option value = { 5} > 5 Days </option>
            < option value = { 7} > 7 Days </option>
                < option value = { 14} > 14 Days </option>
                    </select>
                    </div>

                    < div className = "flex justify-between items-center" >
                        <span className="text-slate-600 font-medium flex items-center gap-1" > <Info className="w-3.5 h-3.5 text-blue-500" /> Quantity </span>
                            < div className = "flex items-center gap-2" >
                                <button 
                type="button"
onClick = {() => setQuantity(q => Math.max(1, q - 1))}
className = "w-6 h-6 border border-slate-200 bg-white rounded flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50"
    >
    -
    </button>
    < span className = "font-bold text-slate-800 min-w-[12px] text-center" > { quantity } </span>
        < button
type = "button"
onClick = {() => setQuantity(q => q + 1)}
className = "w-6 h-6 border border-slate-200 bg-white rounded flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50"
    >
    +
    </button>
    </div>
    </div>
    </div>

    < button
type = "button"
onClick = { handleAddToCart }
className = {`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${added ? 'bg-green-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
    }`}
        >
{ added?<>< Check className = "w-4 h-4" /> Added to Fleet Cart </> : `Rent Hardware (${formatCurrency(calculatedLineTotal)})`}
</button>
    </div>
    </div>
  );
}
