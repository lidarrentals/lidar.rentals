import type { Equipment, Service, RentalPeriod, ServicePeriod } from '@/types';

export function getEquipmentPrice(equipment: Equipment, period: RentalPeriod): number {
  switch (period) {
    case '1day': return equipment.price_1day;
    case '2day': return equipment.price_2day;
    case '3day': return equipment.price_3day;
    case '1week': return equipment.price_1week;
    case '1month': return equipment.price_1month;
    default: return 0;
  }
}

export function getServicePrice(service: Service, period: ServicePeriod): number {
  switch (period) {
    case '2day': return service.price_2day;
    case '3day': return service.price_3day;
    case '1week': return service.price_1week;
    default: return 0;
  }
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
