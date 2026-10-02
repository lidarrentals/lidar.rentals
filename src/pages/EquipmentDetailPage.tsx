import { useEffect, useState } from 'react';
import { ChevronLeft, Check, ShoppingCart, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { navigate } from '@/lib/router';
import type { Equipment, EquipmentBooking, RentalPeriod } from '@/types';
import { RENTAL_PERIODS } from '@/types';
import { getEquipmentPrice, formatCurrency, formatDate, formatDateISO, addDays } from '@/lib/pricing';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';

export default function EquipmentDetailPage({ id }: { id: string }) {
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [bookings, setBookings] = useState<EquipmentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<RentalPeriod>('1day');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [eqRes, bookRes] = await Promise.all([
        supabase.from('equipment').select('*').eq('id', id).maybeSingle(),
        supabase.from('equipment_bookings').select('*').eq('equipment_id', id).neq('status', 'cancelled'),
      ]);
      setEquipment(eqRes.data);
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
              <div className="h-4 bg-slate-200 rounded w-2/3" />
              <div className="h-32 bg-slate-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Equipment not found</h2>
        <button
          onClick={() => navigate('/equipment')}
          className="mt-4 text-blue-600 font-medium hover:underline"
        >
          Back to catalog
        </button>
      </div>
    );
  }

  const gallery = [equipment.image_url, ...(equipment.gallery || [])].filter(Boolean);
  const price = getEquipmentPrice(equipment, selectedPeriod);
  const periodInfo = RENTAL_PERIODS.find(p => p.value === selectedPeriod)!;
  const canAddToCart = startDate && endDate && quantity > 0;

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    setAdding(true);
    const cartId = `${equipment.id}-${selectedPeriod}-${formatDateISO(startDate!)}-${quantity}`;

    addItem({
      id: cartId,
      itemType: 'equipment',
      itemId: equipment.id,
      name: equipment.name,
      imageUrl: equipment.image_url,
      rentalPeriod: selectedPeriod,
      periodLabel: periodInfo.label,
      startDate: formatDateISO(startDate!),
      endDate: formatDateISO(endDate!),
      quantity,
      unitPrice: price,
      lineTotal: price * quantity,
    });

    // Create a booking record to mark dates as unavailable
    supabase.from('equipment_bookings').insert({
      equipment_id: equipment.id,
      start_date: formatDateISO(startDate!),
      end_date: formatDateISO(endDate!),
      quantity,
      status: 'confirmed',
    }).then(() => {
      setBookings(prev => [...prev, {
        id: cartId,
        equipment_id: equipment.id,
        start_date: formatDateISO(startDate!),
        end_date: formatDateISO(endDate!),
        quantity,
        status: 'confirmed',
        created_at: new Date().toISOString(),
      }]);
      setAdding(false);
      setStartDate(null);
      setEndDate(null);
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/equipment')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to catalog
      </button>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image gallery */}
        <div>
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
            <img
              src={gallery[activeImage] || gallery[0]}
              alt={equipment.name}
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
        </div>

        {/* Details */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
              {equipment.quantity} in stock
            </span>
            {equipment.featured && (
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                Featured
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-slate-900">{equipment.name}</h1>
          <p className="mt-4 text-slate-600 leading-relaxed">{equipment.description}</p>

          {/* Rental period selection */}
          <div className="mt-8">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Select Rental Period</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {RENTAL_PERIODS.map((period) => (
                <button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  className={`
                    p-3 rounded-xl border-2 text-center transition-all
                    ${selectedPeriod === period.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                    }
                  `}
                >
                  <div className={`text-sm font-semibold ${selectedPeriod === period.value ? 'text-blue-700' : 'text-slate-900'}`}>
                    {period.label}
                  </div>
                  <div className={`text-xs mt-0.5 ${selectedPeriod === period.value ? 'text-blue-600' : 'text-slate-500'}`}>
                    {formatCurrency(getEquipmentPrice(equipment, period.value))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Quantity</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-lg"
              >
                −
              </button>
              <span className="text-lg font-bold text-slate-900 w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(equipment.quantity, quantity + 1))}
                className="w-10 h-10 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-lg"
              >
                +
              </button>
              <span className="text-sm text-slate-400 ml-2">Max {equipment.quantity} available</span>
            </div>
          </div>

          {/* Summary + add to cart */}
          <div className="mt-8 p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-sm text-slate-500">Total for {periodInfo.label}</span>
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(price * quantity)}
                </div>
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
              className={`
                w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
                ${canAddToCart && !adding
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }
              `}
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
          totalQuantity={equipment.quantity}
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
