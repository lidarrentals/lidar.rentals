import { ArrowRight } from 'lucide-react';
import type { Service } from '@/types';
import { formatCurrency } from '@/lib/pricing';
import { navigate } from '@/lib/router';

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <button
      onClick={() => navigate(`/services/${service.id}`)}
      className="group text-left bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {service.image_url ? (
          <img
            src={service.image_url}
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <span className="text-4xl">📐</span>
          </div>
        )}
        <span className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur text-white text-xs font-semibold rounded-full">
          Onsite Service
        </span>
      </div>

      <div className="p-5">
        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
          {service.name}
        </h3>
        <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">
          {service.description}
        </p>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Starting from</span>
            <span className="text-xl font-bold text-slate-900">
              {formatCurrency(service.price_2day)}
              <span className="text-sm font-normal text-slate-500">/2 days</span>
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
