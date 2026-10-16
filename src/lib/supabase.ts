import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  INITIAL_CATEGORIES,
  INITIAL_EQUIPMENT,
  INITIAL_SERVICES,
  INITIAL_ORDERS,
} from './mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if valid external Supabase URL is supplied
const hasValidConfig =
  typeof supabaseUrl === 'string' &&
  supabaseUrl.trim().length > 0 &&
  supabaseUrl.startsWith('http') &&
  typeof supabaseAnonKey === 'string' &&
  supabaseAnonKey.trim().length > 0;

// Local storage keys
const STORAGE_PREFIX = 'lidar_rentals_';
function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// In-memory / localStorage data tables
let categories = getStored('categories', INITIAL_CATEGORIES);
let equipment = getStored('equipment', INITIAL_EQUIPMENT);
let services = getStored('services', INITIAL_SERVICES);
let orders = getStored('orders', INITIAL_ORDERS);
let serviceBookings = getStored<any[]>('service_bookings', [
  {
    id: 'sb-1',
    service_id: 'svc-underground-mine',
    start_date: '2026-10-20',
    end_date: '2026-10-23',
    status: 'confirmed',
    created_at: new Date().toISOString(),
  },
]);
let equipmentBookings = getStored<any[]>('equipment_bookings', [
  {
    id: 'eb-1',
    equipment_id: 'eq-exyn-aero',
    start_date: '2026-10-25',
    end_date: '2026-10-28',
    quantity: 1,
    status: 'confirmed',
    created_at: new Date().toISOString(),
  },
]);
let currentUser = getStored<any>('current_user', {
  id: 'usr-demo-exyn',
  email: 'dminke@exyntechnologies.com',
  user_metadata: { name: 'David Minke' },
});

type AuthListener = (event: string, session: any) => void;
const authListeners: AuthListener[] = [];

function notifyAuth(event: string) {
  const session = currentUser ? { user: currentUser } : null;
  authListeners.forEach((listener) => {
    try {
      listener(event, session);
    } catch {
      // ignore
    }
  });
}

function getTableData(table: string): any[] {
  switch (table) {
    case 'categories':
      return categories;
    case 'equipment':
      return equipment;
    case 'services':
      return services;
    case 'orders':
      return orders;
    case 'service_bookings':
      return serviceBookings;
    case 'equipment_bookings':
      return equipmentBookings;
    default:
      return [];
  }
}

function setTableData(table: string, data: any[]) {
  switch (table) {
    case 'categories':
      categories = data;
      setStored('categories', categories);
      break;
    case 'equipment':
      equipment = data;
      setStored('equipment', equipment);
      break;
    case 'services':
      services = data;
      setStored('services', services);
      break;
    case 'orders':
      orders = data;
      setStored('orders', orders);
      break;
    case 'service_bookings':
      serviceBookings = data;
      setStored('service_bookings', serviceBookings);
      break;
    case 'equipment_bookings':
      equipmentBookings = data;
      setStored('equipment_bookings', equipmentBookings);
      break;
  }
}

class MockQueryBuilder {
  private table: string;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private insertData: any = null;
  private updateData: any = null;
  private filters: ((item: any) => boolean)[] = [];
  private orderColumn?: string;
  private orderAscending: boolean = true;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(_columns: string = '*') {
    this.action = 'select';
    return this;
  }

  insert(data: any) {
    this.action = 'insert';
    this.insertData = data;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.updateData = data;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item) => {
      // support both exact match and numeric strings/booleans
      const itemVal = item[column];
      return itemVal === value || String(itemVal) === String(value);
    });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((item) => {
      const itemVal = item[column];
      return itemVal !== value && String(itemVal) !== String(value);
    });
    return this;
  }

  or(expression: string) {
    // E.g. "parent_id.eq.targetParentId,parentId.eq.targetParentId"
    const clauses = expression.split(',').map((c) => c.trim());
    this.filters.push((item) => {
      return clauses.some((clause) => {
        const parts = clause.split('.eq.');
        if (parts.length === 2) {
          const [col, val] = parts;
          return item[col] === val || String(item[col]) === String(val);
        }
        return false;
      });
    });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderColumn = column;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  private execute() {
    const tableData = getTableData(this.table);

    if (this.action === 'insert') {
      const rowsToInsert = Array.isArray(this.insertData)
        ? this.insertData
        : [this.insertData];
      const inserted = rowsToInsert.map((row) => ({
        id: row.id || `${this.table.slice(0, 3)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        created_at: row.created_at || new Date().toISOString(),
        ...row,
      }));
      const updatedTable = [...tableData, ...inserted];
      setTableData(this.table, updatedTable);
      return {
        data: Array.isArray(this.insertData) ? inserted : inserted[0],
        error: null,
      };
    }

    if (this.action === 'update') {
      let updatedCount = 0;
      let firstUpdated: any = null;
      const updatedTable = tableData.map((item) => {
        const matches = this.filters.every((f) => f(item));
        if (matches) {
          updatedCount++;
          const merged = { ...item, ...this.updateData };
          if (!firstUpdated) firstUpdated = merged;
          return merged;
        }
        return item;
      });
      setTableData(this.table, updatedTable);
      return { data: firstUpdated, count: updatedCount, error: null };
    }

    if (this.action === 'delete') {
      const remaining = tableData.filter((item) => !this.filters.every((f) => f(item)));
      setTableData(this.table, remaining);
      return { data: null, error: null };
    }

    // Default: 'select'
    let results = tableData.filter((item) => this.filters.every((f) => f(item)));

    if (this.orderColumn) {
      const col = this.orderColumn;
      const asc = this.orderAscending ? 1 : -1;
      results = [...results].sort((a, b) => {
        const aVal = a[col];
        const bVal = b[col];
        if (aVal === bVal) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        return aVal > bVal ? asc : -asc;
      });
    }

    if (this.isSingle) {
      return { data: results[0] ?? null, error: null };
    }

    if (this.isMaybeSingle) {
      return { data: results[0] ?? null, error: null };
    }

    return { data: results, error: null };
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

const mockSupabase = {
  from(table: string) {
    return new MockQueryBuilder(table);
  },
  auth: {
    async getSession() {
      const session = currentUser ? { user: currentUser } : null;
      return { data: { session }, error: null };
    },
    async getUser() {
      return { data: { user: currentUser }, error: null };
    },
    onAuthStateChange(callback: AuthListener) {
      authListeners.push(callback);
      // Immediately call with current state
      setTimeout(() => {
        callback('INITIAL_SESSION', currentUser ? { user: currentUser } : null);
      }, 0);
      return {
        data: {
          subscription: {
            unsubscribe() {
              const idx = authListeners.indexOf(callback);
              if (idx > -1) authListeners.splice(idx, 1);
            },
          },
        },
      };
    },
    async signInWithPassword({ email }: { email: string; password?: string }) {
      currentUser = {
        id: `usr-${Date.now()}`,
        email,
        user_metadata: { name: email.split('@')[0] },
      };
      setStored('current_user', currentUser);
      notifyAuth('SIGNED_IN');
      return {
        data: { user: currentUser, session: { user: currentUser } },
        error: null,
      };
    },
    async signUp({ email }: { email: string; password?: string }) {
      currentUser = {
        id: `usr-${Date.now()}`,
        email,
        user_metadata: { name: email.split('@')[0] },
      };
      setStored('current_user', currentUser);
      notifyAuth('SIGNED_UP');
      return {
        data: { user: currentUser, session: { user: currentUser } },
        error: null,
      };
    },
    async signOut() {
      currentUser = null;
      setStored('current_user', null);
      notifyAuth('SIGNED_OUT');
      return { error: null };
    },
  },
  storage: {
    from(_bucket: string) {
      return {
        async upload(path: string, _file: any) {
          return { data: { path }, error: null };
        },
        getPublicUrl(path: string) {
          return {
            data: {
              publicUrl: `/images/Nexys-flying-into-stope-2-1.png?file=${encodeURIComponent(path)}`,
            },
          };
        },
      };
    },
  },
};

let clientInstance: any;

if (hasValidConfig) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('[AI Studio] Supabase client init failed, falling back to mock:', err);
    clientInstance = mockSupabase;
  }
} else {
  // Use in-memory / persistent mock
  clientInstance = mockSupabase;
}

export const supabase: SupabaseClient = clientInstance as unknown as SupabaseClient;
