import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
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
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  completeOrder: (
    paymentMethod: 'cash' | 'gcash',
    options?: { amountReceived?: number; gcashReference?: string }
  ) => Order | null;
  cancelOrder: (orderId: string) => void;
  updateMenuItem: (id: string, updates: Partial<Omit<MenuItem, 'id'>>) => void;
  deleteMenuItem: (id: string) => void;
  cartTotal: number;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const ORDERS_KEY = 'godswill_orders';
const MENU_ITEMS_KEY = 'godswill_menu_items';

const defaultMenuItems: MenuItem[] = [
  // Bestseller
  { id: 'best-1', name: 'Biscoff Coffee', price: 180, category: 'BESTSELLER', description: 'Biscoff-infused coffee' },
  { id: 'best-2', name: "S'mores Latte", price: 180, category: 'BESTSELLER', description: "S'mores flavored latte" },
  { id: 'best-3', name: 'Dirty Matcha', price: 180, category: 'BESTSELLER', description: 'Matcha with espresso shot' },
  { id: 'best-4', name: 'Golden Banana Latte', price: 220, category: 'BESTSELLER', description: 'Banana-infused latte' },
  { id: 'best-5', name: 'White Mocha', price: 180, category: 'BESTSELLER', description: 'White chocolate mocha' },
  { id: 'best-6', name: 'Seasalt Latte', price: 180, category: 'BESTSELLER', description: 'Sea salt topped latte' },
  { id: 'best-7', name: 'Coffee Jelly', price: 220, category: 'BESTSELLER', description: 'Coffee with coffee jelly' },
  // Classic Coffee
  { id: 'cc-1', name: 'Spanish Latte', price: 150, category: 'CLASSIC COFFEE', description: 'Sweetened condensed milk latte' },
  { id: 'cc-2', name: 'Caramel Macchiato', price: 160, category: 'CLASSIC COFFEE', description: 'Espresso with caramel' },
  { id: 'cc-3', name: 'Salted Caramel', price: 160, category: 'CLASSIC COFFEE', description: 'Salted caramel coffee' },
  { id: 'cc-4', name: 'Americano', price: 100, category: 'CLASSIC COFFEE', description: 'Classic americano' },
  { id: 'cc-5', name: 'French Vanilla', price: 150, category: 'CLASSIC COFFEE', description: 'French vanilla latte' },
  { id: 'cc-6', name: 'Thai Tea Latte', price: 150, category: 'CLASSIC COFFEE', description: 'Thai tea with milk' },
  { id: 'cc-7', name: 'Cafe Latte', price: 130, category: 'CLASSIC COFFEE', description: 'Classic cafe latte' },
  { id: 'cc-8', name: 'Cappuccino', price: 130, category: 'CLASSIC COFFEE', description: 'Classic cappuccino' },
  { id: 'cc-9', name: 'Oat Milk Latte', price: 160, category: 'CLASSIC COFFEE', description: 'Latte with oat milk' },
  // Matcha Series
  { id: 'mat-1', name: 'Strawberry Matcha', price: 180, category: 'MATCHA SERIES', description: 'Strawberry matcha latte' },
  { id: 'mat-2', name: 'Blueberry Matcha', price: 180, category: 'MATCHA SERIES', description: 'Blueberry matcha latte' },
  { id: 'mat-3', name: 'Matcha Milk', price: 180, category: 'MATCHA SERIES', description: 'Classic matcha milk' },
  { id: 'mat-4', name: 'Ube Matcha', price: 180, category: 'MATCHA SERIES', description: 'Ube matcha latte' },
  { id: 'mat-5', name: 'Choco Matcha', price: 180, category: 'MATCHA SERIES', description: 'Chocolate matcha latte' },
  { id: 'mat-6', name: 'Seasalt Matcha', price: 180, category: 'MATCHA SERIES', description: 'Sea salt matcha latte' },
  // Milk Series
  { id: 'milk-1', name: 'Strawberry Milk', price: 180, category: 'MILK SERIES', description: 'Strawberry flavored milk' },
  { id: 'milk-2', name: 'Blueberry Milk', price: 180, category: 'MILK SERIES', description: 'Blueberry flavored milk' },
  { id: 'milk-3', name: 'Oreo Latte', price: 180, category: 'MILK SERIES', description: 'Oreo cookies latte' },
  { id: 'milk-4', name: 'Mango Milk', price: 180, category: 'MILK SERIES', description: 'Mango flavored milk' },
  { id: 'milk-5', name: 'Choco Milk', price: 180, category: 'MILK SERIES', description: 'Chocolate milk' },
  { id: 'milk-6', name: 'Ube Milk', price: 180, category: 'MILK SERIES', description: 'Ube flavored milk' },
  { id: 'milk-7', name: 'Choco Strawberry', price: 180, category: 'MILK SERIES', description: 'Choco strawberry milk' },
  // Frappe (Coffee Based)
  { id: 'frp-1', name: 'Javachip Frappe', price: 200, category: 'FRAPPE', description: 'Java chip blended frappe' },
  { id: 'frp-2', name: 'Caramel Frappe', price: 200, category: 'FRAPPE', description: 'Caramel blended frappe' },
  { id: 'frp-3', name: 'Matcha Frappe', price: 220, category: 'FRAPPE', description: 'Matcha blended frappe' },
  { id: 'frp-4', name: 'Biscoff Latte Frappe', price: 220, category: 'FRAPPE', description: 'Biscoff latte frappe' },
  // Tiramisu Series
  { id: 'tir-1', name: 'Tiramisu Latte', price: 270, category: 'TIRAMISU SERIES', description: 'Classic tiramisu latte' },
  { id: 'tir-2', name: 'Biscoff Tiramisu', price: 270, category: 'TIRAMISU SERIES', description: 'Biscoff tiramisu latte' },
  { id: 'tir-3', name: 'Matcha Tiramisu', price: 270, category: 'TIRAMISU SERIES', description: 'Matcha tiramisu latte' },
  // Snacks
  { id: 'snk-1', name: 'Shawarma', price: 59, category: 'SNACKS', description: 'Classic shawarma wrap' },
  { id: 'snk-2', name: 'Nachos', price: 170, category: 'SNACKS', description: 'Loaded nachos' },
  { id: 'snk-3', name: 'Shawarma Salad', price: 150, category: 'SNACKS', description: 'Fresh shawarma salad' },
  { id: 'snk-4', name: 'Shawarma Rice', price: 130, category: 'SNACKS', description: 'Shawarma with rice' },
  { id: 'snk-5', name: 'Hungarian Sausage Sandwich', price: 130, category: 'SNACKS', description: 'Hungarian sausage on bread' },
  { id: 'snk-6', name: 'Drip Chicken and Fries', price: 250, category: 'SNACKS', description: 'Fried chicken with fries' },
  { id: 'snk-7', name: 'Pasta - Spaghetti', price: 170, category: 'SNACKS', description: 'Classic spaghetti' },
  { id: 'snk-8', name: 'Pasta - Carbonara', price: 180, category: 'SNACKS', description: 'Creamy carbonara' },
  { id: 'snk-9', name: 'Pasta - Truffle', price: 200, category: 'SNACKS', description: 'Truffle pasta' },
  { id: 'snk-10', name: 'Onion Rings', price: 160, category: 'SNACKS', description: 'Crispy onion rings' },
  { id: 'snk-11', name: 'Cheesy Fries', price: 150, category: 'SNACKS', description: 'Fries with melted cheese' },
  { id: 'snk-12', name: 'Cheese Sticks', price: 170, category: 'SNACKS', description: 'Golden cheese sticks' },
  { id: 'snk-13', name: 'Pica-Pica Platter', price: 270, category: 'SNACKS', description: 'Fries, nachos, chicken popcorn' },
  { id: 'snk-14', name: 'Chicken Wings (4pcs)', price: 200, category: 'SNACKS', description: '4 pieces chicken wings' },
  { id: 'snk-15', name: 'Chicken Wings (6pcs)', price: 290, category: 'SNACKS', description: '6 pieces chicken wings' },
  { id: 'snk-16', name: 'Chicken Wings (12pcs)', price: 550, category: 'SNACKS', description: '12 pieces chicken wings' },
  // Bread
  { id: 'brd-1', name: 'Clubhouse Sandwich with Fries', price: 160, category: 'BREAD', description: 'Clubhouse sandwich served with fries' },
  { id: 'brd-2', name: 'Croffle - Blueberry', price: 140, category: 'BREAD', description: 'Blueberry croffle' },
  { id: 'brd-3', name: 'Croffle - Mango', price: 140, category: 'BREAD', description: 'Mango croffle' },
  { id: 'brd-4', name: 'Croffle - Biscoff Cream', price: 140, category: 'BREAD', description: 'Biscoff cream croffle' },
  { id: 'brd-5', name: 'Croffle - Biscoff Crumble', price: 140, category: 'BREAD', description: 'Biscoff crumble croffle' },
  { id: 'brd-6', name: 'Croffle - Cookies and Cream', price: 140, category: 'BREAD', description: 'Cookies and cream croffle' },
  { id: 'brd-7', name: 'Croffle - Matcha', price: 140, category: 'BREAD', description: 'Matcha croffle' },
  { id: 'brd-8', name: 'Croffle - Nutella Almond', price: 140, category: 'BREAD', description: 'Nutella almond croffle' },
  { id: 'brd-9', name: 'Donut - Chocolate', price: 80, category: 'BREAD', description: 'Chocolate donut' },
  { id: 'brd-10', name: 'Donut - Butternut', price: 80, category: 'BREAD', description: 'Butternut donut' },
  { id: 'brd-11', name: 'Donut - Bavarian', price: 80, category: 'BREAD', description: 'Bavarian donut' },
  { id: 'brd-12', name: 'Cookie - Red Velvet (Piece)', price: 99, category: 'BREAD', description: 'Red velvet cookie per piece' },
  { id: 'brd-13', name: 'Cookie - Red Velvet (Tub)', price: 160, category: 'BREAD', description: 'Red velvet cookie per tub' },
  { id: 'brd-14', name: 'Cookie - Choco Chip (Piece)', price: 99, category: 'BREAD', description: 'Choco chip cookie per piece' },
  { id: 'brd-15', name: 'Cookie - Choco Chip (Tub)', price: 160, category: 'BREAD', description: 'Choco chip cookie per tub' },
  { id: 'brd-16', name: 'Cookie - Biscoff (Piece)', price: 99, category: 'BREAD', description: 'Biscoff cookie per piece' },
  { id: 'brd-17', name: 'Cookie - Biscoff (Tub)', price: 160, category: 'BREAD', description: 'Biscoff cookie per tub' },
  // Rice Meals
  { id: 'rice-1', name: 'Chicsilog', price: 160, category: 'RICE MEAL', description: 'Chicken sisig, egg, rice' },
  { id: 'rice-2', name: 'Tapsilog', price: 180, category: 'RICE MEAL', description: 'Tapa, egg, rice' },
  { id: 'rice-3', name: 'Spamsilog', price: 160, category: 'RICE MEAL', description: 'Spam, egg, rice' },
  { id: 'rice-4', name: 'Sisigsilog', price: 180, category: 'RICE MEAL', description: 'Sisig, egg, rice' },
  { id: 'rice-5', name: 'Baconsilog', price: 160, category: 'RICE MEAL', description: 'Bacon, egg, rice' },
  { id: 'rice-6', name: 'Tocilog', price: 160, category: 'RICE MEAL', description: 'Tocino, egg, rice' },
  { id: 'rice-7', name: 'Chicken Tonkatsu', price: 180, category: 'RICE MEAL', description: 'Breaded chicken cutlet with rice' },
  { id: 'rice-8', name: 'Pork Tonkatsu', price: 180, category: 'RICE MEAL', description: 'Breaded pork cutlet with rice' },
  { id: 'rice-9', name: 'Liemposilog', price: 180, category: 'RICE MEAL', description: 'Liempo, egg, rice' },
  { id: 'rice-10', name: 'Hungariansilog', price: 180, category: 'RICE MEAL', description: 'Hungarian sausage, egg, rice' },
];

function loadMenuItems(): MenuItem[] {
  try {
    const raw = localStorage.getItem(MENU_ITEMS_KEY);
    return raw ? JSON.parse(raw) : defaultMenuItems;
  } catch {
    return defaultMenuItems;
  }
}

export const getDefaultMenuItems = () => defaultMenuItems;

export function POSProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(loadMenuItems);

  useEffect(() => {
    localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(menuItems));
  }, [menuItems]);

  const updateMenuItem = (id: string, updates: Partial<Omit<MenuItem, 'id'>>) => {
    setMenuItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== id));
  };

  // Load orders from localStorage on mount
  useEffect(() => {
    const savedOrders = localStorage.getItem(ORDERS_KEY);
    if (savedOrders) {
      const parsed = JSON.parse(savedOrders);
      setOrders(parsed.map((o: Order) => ({ ...o, timestamp: new Date(o.timestamp) })));
    }
  }, []);

  // Save orders to localStorage
  useEffect(() => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }, [orders]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' as const } : o));
  };

  return (
    <POSContext.Provider value={{
      cart,
      orders,
      menuItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      completeOrder,
      cancelOrder,
      updateMenuItem,
      deleteMenuItem,
      cartTotal,
    }}>
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const context = useContext(POSContext);
  if (!context) throw new Error('usePOS must be used within POSProvider');
  return context;
}
