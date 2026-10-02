/*
# Rental Equipment E-Commerce Schema

## Overview
This migration creates the full database schema for a rental equipment e-commerce platform with:
- Equipment catalog (rental items with tiered pricing)
- Onsite SaaS scanning services (with tiered pricing)
- Availability calendars for both equipment and services
- Shopping cart / orders / order items

## Tables

### categories
- `id` (uuid, PK)
- `name` (text) - category name
- `slug` (text, unique) - URL-friendly identifier
- `icon` (text) - lucide icon name
- `created_at` (timestamptz)

### equipment
- `id` (uuid, PK)
- `name` (text) - equipment name
- `description` (text) - detailed description
- `category_id` (uuid, FK to categories) - category
- `image_url` (text) - image URL
- `gallery` (text[]) - additional image URLs
- `price_1day` (numeric) - 1-day rental price
- `price_2day` (numeric) - 2-day rental price
- `price_3day` (numeric) - 3-day rental price
- `price_1week` (numeric) - 1-week rental price
- `price_1month` (numeric) - 1-month rental price
- `quantity` (int) - total available units
- `is_active` (boolean) - whether listed
- `featured` (boolean) - show on homepage
- `created_at` (timestamptz)

### services
- `id` (uuid, PK)
- `name` (text) - service name
- `description` (text) - detailed description
- `image_url` (text) - image URL
- `gallery` (text[]) - additional images
- `price_2day` (numeric) - 2-day onsite price
- `price_3day` (numeric) - 3-day onsite price
- `price_1week` (numeric) - 1-week onsite price
- `is_active` (boolean) - whether listed
- `created_at` (timestamptz)

### equipment_bookings
- Tracks booked date ranges for each equipment item
- `id` (uuid, PK)
- `equipment_id` (uuid, FK to equipment)
- `start_date` (date) - booking start
- `end_date` (date) - booking end
- `quantity` (int) - number of units booked
- `status` (text) - 'pending', 'confirmed', 'cancelled'
- `created_at` (timestamptz)

### service_bookings
- Tracks booked date ranges for each service
- `id` (uuid, PK)
- `service_id` (uuid, FK to services)
- `start_date` (date) - booking start
- `end_date` (date) - booking end
- `status` (text) - 'pending', 'confirmed', 'cancelled'
- `created_at` (timestamptz)

### orders
- `id` (uuid, PK)
- `customer_name` (text)
- `customer_email` (text)
- `customer_phone` (text)
- `company` (text, nullable)
- `shipping_address` (text, nullable)
- `notes` (text, nullable)
- `total` (numeric) - order total
- `status` (text) - 'pending', 'confirmed', 'completed', 'cancelled'
- `created_at` (timestamptz)

### order_items
- `id` (uuid, PK)
- `order_id` (uuid, FK to orders, CASCADE)
- `item_type` (text) - 'equipment' or 'service'
- `item_id` (uuid) - FK to equipment or service
- `item_name` (text) - snapshot of name at time of order
- `rental_period` (text) - '1day', '2day', '3day', '1week', '1month'
- `start_date` (date) - rental start
- `end_date` (date) - rental end
- `quantity` (int) - units
- `unit_price` (numeric) - price per unit for the period
- `line_total` (numeric) - unit_price * quantity
- `created_at` (timestamptz)

## Security
- RLS enabled on all tables
- Single-tenant (no auth) — all policies use `TO anon, authenticated` since data is intentionally public/shared
- Full CRUD access for catalog management and order placement
*/

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text DEFAULT 'Package',
  created_at timestamptz DEFAULT now()
);

-- Equipment
CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  image_url text DEFAULT '',
  gallery text[] DEFAULT '{}',
  price_1day numeric(10,2) DEFAULT 0,
  price_2day numeric(10,2) DEFAULT 0,
  price_3day numeric(10,2) DEFAULT 0,
  price_1week numeric(10,2) DEFAULT 0,
  price_1month numeric(10,2) DEFAULT 0,
  quantity int DEFAULT 1,
  is_active boolean DEFAULT true,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Services
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  gallery text[] DEFAULT '{}',
  price_2day numeric(10,2) DEFAULT 0,
  price_3day numeric(10,2) DEFAULT 0,
  price_1week numeric(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Equipment bookings (availability tracking)
CREATE TABLE IF NOT EXISTS equipment_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz DEFAULT now()
);

-- Service bookings (availability tracking)
CREATE TABLE IF NOT EXISTS service_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text DEFAULT '',
  company text DEFAULT '',
  shipping_address text DEFAULT '',
  notes text DEFAULT '',
  total numeric(10,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  item_name text NOT NULL,
  rental_period text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric(10,2) DEFAULT 0,
  line_total numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Categories policies (public CRUD - single tenant)
DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE TO anon, authenticated USING (true);

-- Equipment policies (public CRUD - single tenant)
DROP POLICY IF EXISTS "anon_select_equipment" ON equipment;
CREATE POLICY "anon_select_equipment" ON equipment FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_equipment" ON equipment;
CREATE POLICY "anon_insert_equipment" ON equipment FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_equipment" ON equipment;
CREATE POLICY "anon_update_equipment" ON equipment FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_equipment" ON equipment;
CREATE POLICY "anon_delete_equipment" ON equipment FOR DELETE TO anon, authenticated USING (true);

-- Services policies (public CRUD - single tenant)
DROP POLICY IF EXISTS "anon_select_services" ON services;
CREATE POLICY "anon_select_services" ON services FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_services" ON services;
CREATE POLICY "anon_insert_services" ON services FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_services" ON services;
CREATE POLICY "anon_update_services" ON services FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_services" ON services;
CREATE POLICY "anon_delete_services" ON services FOR DELETE TO anon, authenticated USING (true);

-- Equipment bookings policies (public CRUD - single tenant)
DROP POLICY IF EXISTS "anon_select_equipment_bookings" ON equipment_bookings;
CREATE POLICY "anon_select_equipment_bookings" ON equipment_bookings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_equipment_bookings" ON equipment_bookings;
CREATE POLICY "anon_insert_equipment_bookings" ON equipment_bookings FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_equipment_bookings" ON equipment_bookings;
CREATE POLICY "anon_update_equipment_bookings" ON equipment_bookings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_equipment_bookings" ON equipment_bookings;
CREATE POLICY "anon_delete_equipment_bookings" ON equipment_bookings FOR DELETE TO anon, authenticated USING (true);

-- Service bookings policies (public CRUD - single tenant)
DROP POLICY IF EXISTS "anon_select_service_bookings" ON service_bookings;
CREATE POLICY "anon_select_service_bookings" ON service_bookings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_service_bookings" ON service_bookings;
CREATE POLICY "anon_insert_service_bookings" ON service_bookings FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_service_bookings" ON service_bookings;
CREATE POLICY "anon_update_service_bookings" ON service_bookings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_service_bookings" ON service_bookings;
CREATE POLICY "anon_delete_service_bookings" ON service_bookings FOR DELETE TO anon, authenticated USING (true);

-- Orders policies (public CRUD - single tenant)
DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE TO anon, authenticated USING (true);

-- Order items policies (public CRUD - single tenant)
DROP POLICY IF EXISTS "anon_select_order_items" ON order_items;
CREATE POLICY "anon_select_order_items" ON order_items FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_order_items" ON order_items;
CREATE POLICY "anon_update_order_items" ON order_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_order_items" ON order_items;
CREATE POLICY "anon_delete_order_items" ON order_items FOR DELETE TO anon, authenticated USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category_id);
CREATE INDEX IF NOT EXISTS idx_equipment_active ON equipment(is_active);
CREATE INDEX IF NOT EXISTS idx_equipment_bookings_equipment ON equipment_bookings(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_bookings_dates ON equipment_bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_service_bookings_service ON service_bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_dates ON service_bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
