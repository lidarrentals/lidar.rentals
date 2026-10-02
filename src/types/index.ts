export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  created_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  category_id: string | null;
  image_url: string;
  gallery: string[];
  price_1day: number;
  price_2day: number;
  price_3day: number;
  price_1week: number;
  price_1month: number;
  quantity: number;
  is_active: boolean;
  featured: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  image_url: string;
  gallery: string[];
  price_2day: number;
  price_3day: number;
  price_1week: number;
  is_active: boolean;
  created_at: string;
}

export interface EquipmentBooking {
  id: string;
  equipment_id: string;
  start_date: string;
  end_date: string;
  quantity: number;
  status: string;
  created_at: string;
}

export interface ServiceBooking {
  id: string;
  service_id: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export type RentalPeriod = '1day' | '2day' | '3day' | '1week' | '1month';
export type ServicePeriod = '2day' | '3day' | '1week';

export const RENTAL_PERIODS: { value: RentalPeriod; label: string; days: number }[] = [
  { value: '1day', label: '1 Day', days: 1 },
  { value: '2day', label: '2 Days', days: 2 },
  { value: '3day', label: '3 Days', days: 3 },
  { value: '1week', label: '1 Week', days: 7 },
  { value: '1month', label: '1 Month', days: 30 },
];

export const SERVICE_PERIODS: { value: ServicePeriod; label: string; days: number }[] = [
  { value: '2day', label: '2 Days', days: 2 },
  { value: '3day', label: '3 Days', days: 3 },
  { value: '1week', label: '1 Week', days: 7 },
];

export interface CartItem {
  id: string;
  itemType: 'equipment' | 'service';
  itemId: string;
  name: string;
  imageUrl: string;
  rentalPeriod: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company: string;
  shipping_address: string;
  notes: string;
  total: number;
  status: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_type: 'equipment' | 'service';
  item_id: string;
  item_name: string;
  rental_period: string;
  start_date: string;
  end_date: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
}
