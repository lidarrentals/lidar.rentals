import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { CartItem, Equipment, RentalPeriod } from '@/types';
import { getEquipmentPrice } from '@/lib/pricing';

interface CartContextValue {
  items: CartItem[];
  cart: CartItem[]; // alias for legacy Header components
  addItem: (item: CartItem) => void;
  addToCart: (
    equipment: Equipment,
    rentalDays: number,
    startDate: string,
    endDate: string,
    quantity?: number
  ) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  isCartOpen: boolean;
  isOpen: boolean; // alias
  setCartOpen: (open: boolean) => void;
  setIsOpen: (open: boolean) => void; // alias
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) =>
          i.itemId === item.itemId &&
          i.rentalPeriod === item.rentalPeriod &&
          i.startDate === item.startDate &&
          i.itemType === item.itemType
      );
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id
            ? { ...i, quantity: i.quantity + item.quantity, lineTotal: (i.quantity + item.quantity) * i.unitPrice }
            : i
        );
      }
      return [...prev, item];
    });
    setCartOpen(true);
  }, []);

  const addToCart = useCallback(
    (
      equipment: Equipment,
      rentalDays: number,
      startDate: string,
      endDate: string,
      quantity: number = 1
    ) => {
      let period: RentalPeriod = '1day';
      if (rentalDays === 2) period = '2day';
      else if (rentalDays === 3) period = '3day';
      else if (rentalDays >= 4 && rentalDays <= 14) period = '1week';
      else if (rentalDays > 14) period = '1month';

      const unitPrice = getEquipmentPrice(equipment, period) || equipment.price_1day || 0;
      const cartItemId = `${equipment.id}-${period}-${startDate}-${endDate}`;

      addItem({
        id: cartItemId,
        itemType: 'equipment',
        itemId: equipment.id,
        name: equipment.name,
        imageUrl: equipment.image_url,
        rentalPeriod: period,
        periodLabel: `${rentalDays} Day${rentalDays > 1 ? 's' : ''}`,
        startDate,
        endDate,
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,
      });
    },
    [addItem]
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity, lineTotal: quantity * i.unitPrice } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        cart: items,
        addItem,
        addToCart,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
        isCartOpen,
        isOpen: isCartOpen,
        setCartOpen,
        setIsOpen: setCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
