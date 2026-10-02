import { useEffect, useState } from 'react';
import { ChevronLeft, Check, ShoppingCart, AlertCircle, ScanLine, Clock, FileText, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { navigate } from '@/lib/router';
import type { Service, ServiceBooking, ServicePeriod } from '@/types';
import { SERVICE_PERIODS } from '@/types';
import { getServicePrice, formatCurrency, formatDate, formatDateISO } from '@/lib/pricing';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';

export default function ServiceDetailPage({ id }: { id: string }) {
  const [service, setService] = useState<Service | null>(null);
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<ServicePeriod>('2day');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [svcRes, bookRes] = await Promise.all([
        supabase.from('services').select('*').eq('id', id).maybeSingle(),
        supabase.from('service_bookings').select('*').eq('service_id', id).neq('status', 'cancelled'),
      ]);
      setService(svcRes.data);
      setBookings(bookRes.data || []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-32 mb-6" />
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="aspect-[4/3] bg-slate-200 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-32 bg-slate-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Service not found</h2>
        <button onClick={() => navigate('/services')} className="mt-4 text-blue-600 font-medium hover:underline">
          Back to services
        </button>
      </div>
    );
  }

  const gallery = [service.image_url, ...(service.gallery || [])].filter(Boolean);
  const price = getServicePrice(service, selectedPeriod);
  const periodInfo = SERVICE_PERIODS.find(p => p.value === selectedPeriod)!;
  const canAddToCart = startDate && endDate;

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    setAdding(true);
    const cartId = `${service.id}-${selectedPeriod}-${formatDateISO(startDate!)}`;

    addItem({
      id: cartId,
      itemType: 'service',
      itemId: service.id,
      name: service.name,
      imageUrl: service.image_url,
      rentalPeriod: selectedPeriod,
      periodLabel: periodInfo.label,
      startDate: formatDateISO(startDate!),
      endDate: formatDateISO(endDate!),
      quantity: 1,
      unitPrice: price,
      lineTotal: price,
    });

    supabase.from('service_bookings').insert({
      service_id: service.id,
      start_date: formatDateISO(startDate!),
      end_date: formatDateISO(endDate!),
      status: 'confirmed',
    }).then(() => {
      setBookings(prev => [...prev, {
        id: cartId,
        service_id: service.id,
        start_date: formatDateISO(startDate!),
        end_date: formatDateISO(endDate!),
        status: 'confirmed',
        created_at: new Date().toISOString(),
      }]);
      setAdding(false);
      setStartDate(null);
      setEndDate(null);
    });
  };

  const features = [
    { icon: ScanLine, label: 'LiDAR & 3D Scanning' },
    { icon: FileText, label: 'Detailed Reports' },
    { icon: MapPin, label: 'On-Site Service' },
    { icon: Clock, label: 'Fast Turnaround' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/services')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to services
      </button>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image gallery */}
        <div>
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
            <img
              src={gallery[activeImage] || gallery[0]}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                    activeImage === idx ? 'border-blue-600 ring-2 ring-blue-200' : 'border-slate-200'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Features */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {features.map(f => (
              <div key={f.label} className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200">
                <f.icon className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div>
          <span className="inline-block px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-full mb-3">
            Onsite Service
          </span>
          <h1 className="text-3xl font-bold text-slate-900">{service.name}</h1>
          <p className="mt-4 text-slate-600 leading-relaxed">{service.description}</p>

          {/* Service period selection */}
          <div className="mt-8">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Select Service Duration</h3>
            <div className="grid grid-cols-3 gap-2">
              {SERVICE_PERIODS.map((period) => (
                <button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    selectedPeriod === period.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`text-sm font-semibold ${selectedPeriod === period.value ? 'text-blue-700' : 'text-slate-900'}`}>
                    {period.label}
                  </div>
                  <div className={`text-xs mt-0.5 ${selectedPeriod === period.value ? 'text-blue-600' : 'text-slate-500'}`}>
                    {formatCurrency(getServicePrice(service, period.value))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Summary + add to cart */}
          <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-sm text-slate-500">Service total ({periodInfo.label})</span>
                <div className="text-2xl font-bold text-slate-900">{formatCurrency(price)}</div>
              </div>
              {startDate && endDate && (
                <div className="text-right text-sm text-slate-600">
                  <div>{formatDate(startDate)}</div>
                  <div className="text-slate-400">to</div>
                  <div>{formatDate(endDate)}</div>
                </div>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart || adding}
              className={`w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                canAddToCart && !adding
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {adding ? (
                <>
                  <Check className="w-5 h-5" />
                  Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  {canAddToCart ? 'Add to Cart' : 'Select dates to book'}
                </>
              )}
            </button>
            {!canAddToCart && (
              <p className="text-xs text-slate-400 text-center mt-2">
                Pick your start and end dates on the calendar below
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Availability calendar */}
      <div className="mt-10">
        <AvailabilityCalendar
          bookings={bookings}
          selectedStartDate={startDate}
          selectedEndDate={endDate}
          onSelectStart={setStartDate}
          onSelectEnd={setEndDate}
          minDays={periodInfo.days}
        />
      </div>
    </div>
  );
}
