import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatDateISO, addDays } from '@/lib/pricing';

interface BookingRange {
  start_date: string;
  end_date: string;
  quantity?: number;
}

interface AvailabilityCalendarProps {
  bookings: BookingRange[];
  totalQuantity?: number;
  selectedStartDate: Date | null;
  selectedEndDate: Date | null;
  onSelectStart: (date: Date | null) => void;
  onSelectEnd: (date: Date | null) => void;
  minDays?: number;
}

export default function AvailabilityCalendar({
  bookings,
  totalQuantity,
  selectedStartDate,
  selectedEndDate,
  onSelectStart,
  onSelectEnd,
  minDays = 1,
}: AvailabilityCalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // Build a map of date -> booked quantity
  const bookedDates = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookings) {
      const start = new Date(b.start_date);
      const end = new Date(b.end_date);
      const current = new Date(start);
      while (current <= end) {
        const key = formatDateISO(current);
        map.set(key, (map.get(key) || 0) + (b.quantity || 1));
        current.setDate(current.getDate() + 1);
      }
    }
    return map;
  }, [bookings]);

  const isDateBooked = (date: Date): boolean => {
    const key = formatDateISO(date);
    const booked = bookedDates.get(key) || 0;
    if (totalQuantity) {
      return booked >= totalQuantity;
    }
    return booked > 0;
  };

  const isDateInRange = (date: Date): boolean => {
    if (!selectedStartDate || !selectedEndDate) return false;
    return date >= selectedStartDate && date <= selectedEndDate;
  };

  const isDateDisabled = (date: Date): boolean => {
    if (date < today) return true;
    return isDateBooked(date);
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      onSelectStart(date);
      onSelectEnd(null);
      return;
    }

    if (date < selectedStartDate) {
      onSelectStart(date);
      onSelectEnd(null);
      return;
    }

    // Check no booked dates in range
    const current = new Date(selectedStartDate);
    current.setDate(current.getDate() + 1);
    while (current <= date) {
      if (isDateBooked(current)) {
        onSelectStart(date);
        onSelectEnd(null);
        return;
      }
      current.setDate(current.getDate() + 1);
    }

    const minEndDate = addDays(selectedStartDate, minDays - 1);
    if (date < minEndDate) {
      onSelectEnd(minEndDate);
    } else {
      onSelectEnd(date);
    }
  };

  const monthName = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const days: (Date | null)[] = [];

    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [viewMonth]);

  const prevMonth = () => {
    if (viewMonth.getMonth() === today.getMonth() && viewMonth.getFullYear() === today.getFullYear()) return;
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          Availability
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-slate-900 min-w-[140px] text-center">
            {monthName}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-slate-500 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, idx) => {
          if (!date) return <div key={idx} />;
          const disabled = isDateDisabled(date);
          const isStart = selectedStartDate && formatDateISO(date) === formatDateISO(selectedStartDate);
          const isEnd = selectedEndDate && formatDateISO(date) === formatDateISO(selectedEndDate);
          const inRange = isDateInRange(date);
          const isToday = formatDateISO(date) === formatDateISO(today);

          return (
            <button
              key={idx}
              onClick={() => handleDateClick(date)}
              disabled={disabled}
              className={`
                aspect-square text-sm rounded-lg font-medium transition-all relative
                ${disabled
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed line-through'
                  : isStart || isEnd
                    ? 'bg-blue-600 text-white font-bold shadow-md scale-105'
                    : inRange
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                }
              `}
            >
              {date.getDate()}
              {isToday && !isStart && !isEnd && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-600" />
          Selected
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-100" />
          In range
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-100" />
          Booked
        </div>
      </div>

      {selectedStartDate && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-600">
          {selectedEndDate ? (
            <span>
              <strong className="text-slate-900">Selected:</strong>{' '}
              {selectedStartDate.toLocaleDateString()} — {selectedEndDate.toLocaleDateString()}
            </span>
          ) : (
            <span className="text-blue-600">
              Select end date{minDays > 1 ? ` (min ${minDays} days)` : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
