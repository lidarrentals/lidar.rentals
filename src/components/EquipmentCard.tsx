import { ArrowRight } from 'lucide-react';
import type { Equipment } from '@/types';
import { formatCurrency } from '@/lib/pricing';
import { navigate } from '@/lib/router';

export default function EquipmentCard({ equipment }: { equipment: Equipment }) {
  return (
    <button
      onClick={() => navigate(`/equipment/${equipment.id}`)}
      className="group text-left bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {equipment.image_url ? (
          <img
            src={equipment.image_url}
            alt={equipment.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <span className="text-4xl">📦</span>
          </div>
        )}
        {equipment.featured && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full shadow-sm">
            Featured
          </span>
        )}
        <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur text-slate-700 text-xs font-medium rounded-full shadow-sm">
          {equipment.quantity} available
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
          {equipment.name}
        </h3>
        <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">
          {equipment.description}
        </p>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Starting from</span>
            <span className="text-xl font-bold text-slate-900">
              {formatCurrency(equipment.price_1day)}
              <span className="text-sm font-normal text-slate-500">/day</span>
            </span>
          </div>
          <span className="flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
            Details
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </button>
  );
}
