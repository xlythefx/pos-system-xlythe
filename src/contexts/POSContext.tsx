import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { activeCafe } from '@/lib/cafe-config';

// ─── Modifier types ────────────────────────────────────────────────────────────

export interface ModifierOption {
  id: string;
  name: string;
  price: number; // additional cost; 0 for free options
}

export interface ModifierGroup {
  id: string;
  name: string; // e.g. "Size", "Temperature", "Add-ons"
  required: boolean; // must pick at least one option
  multiSelect: boolean; // can pick multiple options
  options: ModifierOption[];
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

// ─── Menu + Cart ───────────────────────────────────────────────────────────────

export interface MenuItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  costPrice?: number;
  category: string;
  description: string;
  unit?: 'cup' | 'piece' | 'bowl' | 'plate' | 'box' | 'serving';
  imageUrl?: string;
  isAvailable: boolean;
  tags?: string[];
  modifierGroups?: ModifierGroup[];
}

export interface CartItem extends MenuItem {
  quantity: number;
  /** Unique per cart line — allows same item with different modifiers */
  cartLineId: string;
  selectedModifiers?: SelectedModifier[];
  /** Sum of selected modifier prices (computed at add-time) */
  modifierTotal: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  timestamp: Date;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod: 'cash' | 'gcash';
  /** For cash: amount customer gave */
  amountReceived?: number;
  /** For cash: change to return */
  change?: number;
  /** For GCash: transaction reference */
  gcashReference?: string;
}

interface POSContextType {
  cart: CartItem[];
  orders: Order[];
  menuItems: MenuItem[];
  customItemIds: Set<string>;
  stockLevels: Record<string, number>;
  availabilityOverrides: Record<string, boolean>;
  costOverrides: Record<string, number>;
  /** itemId → modifier groups (runtime, persisted) */
  modifierGroupsMap: Record<string, ModifierGroup[]>;
  addToCart: (item: MenuItem, selectedModifiers?: SelectedModifier[]) => void;
  removeFromCart: (cartLineId: string) => void;
  updateQuantity: (cartLineId: string, quantity: number) => void;
  clearCart: () => void;
  completeOrder: (
    paymentMethod: 'cash' | 'gcash',
    options?: { amountReceived?: number; gcashReference?: string }
  ) => Order | null;
  cancelOrder: (orderId: string) => void;
  updateMenuItem: (id: string, updates: Partial<Omit<MenuItem, 'id'>>) => void;
  deleteMenuItem: (id: string) => void;
  addCustomMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateStock: (id: string, qty: number) => void;
  setAvailabilityOverride: (id: string, available: boolean) => void;
  setCostOverride: (id: string, cost: number) => void;
  setModifierGroups: (itemId: string, groups: ModifierGroup[]) => void;
  cartTotal: number;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const ORDERS_KEY = `${activeCafe.storageKey}_orders`;
const CUSTOM_ITEMS_KEY = `${activeCafe.storageKey}_custom_items`;
const STOCK_KEY = `${activeCafe.storageKey}_stock`;
const AVAILABILITY_KEY = `${activeCafe.storageKey}_availability`;
const COST_OVERRIDES_KEY = `${activeCafe.storageKey}_cost_overrides`;
const MODIFIER_GROUPS_KEY = `${activeCafe.storageKey}_modifier_groups`;

function loadCustomItems(): MenuItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_ITEMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function POSProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Base items always come fresh from the active cafe config (never persisted)
  const [baseMenuItems] = useState<MenuItem[]>(activeCafe.menuItems);

  // Custom items are added at runtime and stored in localStorage
  const [customMenuItems, setCustomMenuItems] = useState<MenuItem[]>(loadCustomItems);

  // Set of custom item IDs for quick lookup (used in Inventory to show "Custom" badge)
  const customItemIds = new Set(customMenuItems.map((i) => i.id));

  // Stock levels: itemId → quantity on hand (default 50 per item)
  const [stockLevels, setStockLevels] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(STOCK_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  // Availability overrides: allows toggling base items off without editing the .ts file
  const [availabilityOverrides, setAvailabilityOverrides] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(AVAILABILITY_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  // Cost price overrides for base items (base items can't be edited in .ts at runtime)
  const [costOverrides, setCostOverrides] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(COST_OVERRIDES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  // Modifier groups per item (runtime, persisted)
  const [modifierGroupsMap, setModifierGroupsMap] = useState<Record<string, ModifierGroup[]>>(() => {
    try {
      const raw = localStorage.getItem(MODIFIER_GROUPS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  // Merged view: base items first, then custom items, with runtime overrides applied
  const menuItems: MenuItem[] = [...baseMenuItems, ...customMenuItems].map((item) => ({
    ...item,
    isAvailable: item.id in availabilityOverrides ? availabilityOverrides[item.id] : (item.isAvailable ?? true),
    costPrice: item.id in costOverrides ? costOverrides[item.id] : item.costPrice,
    modifierGroups: modifierGroupsMap[item.id] ?? item.modifierGroups ?? [],
  }));

  // Persist custom items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(customMenuItems));
  }, [customMenuItems]);

  useEffect(() => {
    localStorage.setItem(STOCK_KEY, JSON.stringify(stockLevels));
  }, [stockLevels]);

  useEffect(() => {
    localStorage.setItem(AVAILABILITY_KEY, JSON.stringify(availabilityOverrides));
  }, [availabilityOverrides]);

  useEffect(() => {
    localStorage.setItem(COST_OVERRIDES_KEY, JSON.stringify(costOverrides));
  }, [costOverrides]);

  useEffect(() => {
    localStorage.setItem(MODIFIER_GROUPS_KEY, JSON.stringify(modifierGroupsMap));
  }, [modifierGroupsMap]);

  const setModifierGroups = (itemId: string, groups: ModifierGroup[]) => {
    setModifierGroupsMap((prev) => ({ ...prev, [itemId]: groups }));
  };

  const updateStock = (id: string, qty: number) => {
    setStockLevels((prev) => ({ ...prev, [id]: Math.max(0, qty) }));
  };

  const setAvailabilityOverride = (id: string, available: boolean) => {
    setAvailabilityOverrides((prev) => ({ ...prev, [id]: available }));
  };

  const setCostOverride = (id: string, cost: number) => {
    setCostOverrides((prev) => ({ ...prev, [id]: cost }));
  };

  // Load orders from localStorage on mount
  useEffect(() => {
    const savedOrders = localStorage.getItem(ORDERS_KEY);
    if (savedOrders) {
      const parsed = JSON.parse(savedOrders);
      setOrders(parsed.map((o: Order) => ({ ...o, timestamp: new Date(o.timestamp) })));
    }
  }, []);

  // Persist orders to localStorage
  useEffect(() => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }, [orders]);

  const addCustomMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...item,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setCustomMenuItems((prev) => [...prev, newItem]);
  };

  const updateMenuItem = (id: string, updates: Partial<Omit<MenuItem, 'id'>>) => {
    if (customItemIds.has(id)) {
      setCustomMenuItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    }
    // Base item edits are in-memory only (resets on refresh — acceptable for mockup)
  };

  const deleteMenuItem = (id: string) => {
    if (customItemIds.has(id)) {
      setCustomMenuItems((prev) => prev.filter((item) => item.id !== id));
    }
    // Base items cannot be permanently deleted in mockup mode
  };

  const addToCart = (item: MenuItem, selectedModifiers?: SelectedModifier[]) => {
    const modifierTotal = (selectedModifiers ?? []).reduce((s, m) => s + m.price, 0);
    setCart((prev) => {
      // Items without modifiers: merge into existing line if same item.id
      if (!selectedModifiers || selectedModifiers.length === 0) {
        const existing = prev.find((i) => i.id === item.id && (!i.selectedModifiers || i.selectedModifiers.length === 0));
        if (existing) {
          return prev.map((i) => (i.cartLineId === existing.cartLineId ? { ...i, quantity: i.quantity + 1 } : i));
        }
        return [...prev, { ...item, quantity: 1, cartLineId: item.id, selectedModifiers: [], modifierTotal: 0 }];
      }
      // Items with modifiers: try to find line with identical modifier selection
      const sigNew = selectedModifiers.map((m) => `${m.groupId}:${m.optionId}`).sort().join('|');
      const existing = prev.find((i) => {
        if (i.id !== item.id || !i.selectedModifiers?.length) return false;
        const sigEx = i.selectedModifiers.map((m) => `${m.groupId}:${m.optionId}`).sort().join('|');
        return sigEx === sigNew;
      });
      if (existing) {
        return prev.map((i) => (i.cartLineId === existing.cartLineId ? { ...i, quantity: i.quantity + 1 } : i));
      }
      const cartLineId = `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      return [...prev, { ...item, quantity: 1, cartLineId, selectedModifiers, modifierTotal }];
    });
  };

  const removeFromCart = (cartLineId: string) => {
    setCart((prev) => prev.filter((i) => i.cartLineId !== cartLineId));
  };

  const updateQuantity = (cartLineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartLineId);
      return;
    }
    setCart((prev) => prev.map((i) => (i.cartLineId === cartLineId ? { ...i, quantity } : i)));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price + item.modifierTotal) * item.quantity, 0);

  const completeOrder = (
    paymentMethod: 'cash' | 'gcash',
    options?: { amountReceived?: number; gcashReference?: string }
  ): Order | null => {
    if (cart.length === 0) return null;

    const amountReceived = options?.amountReceived;
    const gcashReference = options?.gcashReference;
    const change =
      paymentMethod === 'cash' && amountReceived != null
        ? Math.max(0, amountReceived - cartTotal)
        : undefined;

    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      items: [...cart],
      total: cartTotal,
      timestamp: new Date(),
      status: 'completed',
      paymentMethod,
      ...(paymentMethod === 'cash' && amountReceived != null && { amountReceived, change }),
      ...(paymentMethod === 'gcash' && gcashReference && { gcashReference }),
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const cancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' as const } : o))
    );
  };

  return (
    <POSContext.Provider
      value={{
        cart,
        orders,
        menuItems,
        customItemIds,
        stockLevels,
        availabilityOverrides,
        costOverrides,
        modifierGroupsMap,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        completeOrder,
        cancelOrder,
        updateMenuItem,
        deleteMenuItem,
        addCustomMenuItem,
        updateStock,
        setAvailabilityOverride,
        setCostOverride,
        setModifierGroups,
        cartTotal,
      }}
    >
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const context = useContext(POSContext);
  if (!context) throw new Error('usePOS must be used within POSProvider');
  return context;
}
