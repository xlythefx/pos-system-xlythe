import type { MenuItem } from '@/contexts/POSContext';

export const artRanchMenuItems: MenuItem[] = [
  // SIGNATURE
  { id: 'ar-sig-1', sku: 'AR-SIG-001', name: 'Canvas Latte', price: 195, costPrice: 75, category: 'SIGNATURE', description: 'Espresso with oat milk and vanilla', unit: 'cup', isAvailable: true, tags: ['hot', 'cold', 'signature'] },
  { id: 'ar-sig-2', sku: 'AR-SIG-002', name: 'Palette Mocha', price: 195, costPrice: 78, category: 'SIGNATURE', description: 'Dark chocolate espresso blend', unit: 'cup', isAvailable: true, tags: ['hot', 'cold', 'signature'] },
  { id: 'ar-sig-3', sku: 'AR-SIG-003', name: 'Brushstroke Matcha', price: 210, costPrice: 85, category: 'SIGNATURE', description: 'Ceremonial matcha with coconut milk', unit: 'cup', isAvailable: true, tags: ['hot', 'cold', 'matcha', 'signature', 'vegan'] },
  { id: 'ar-sig-4', sku: 'AR-SIG-004', name: 'Sunset Citrus', price: 185, costPrice: 72, category: 'SIGNATURE', description: 'Orange cold brew with honey', unit: 'cup', isAvailable: true, tags: ['cold', 'signature'] },
  { id: 'ar-sig-5', sku: 'AR-SIG-005', name: 'Indigo Cold Brew', price: 200, costPrice: 80, category: 'SIGNATURE', description: 'Butterfly pea cold brew with lemon', unit: 'cup', isAvailable: true, tags: ['cold', 'signature'] },
  // ESPRESSO
  { id: 'ar-esp-1', sku: 'AR-ESP-001', name: 'Americano', price: 110, costPrice: 35, category: 'ESPRESSO', description: 'Classic black americano', unit: 'cup', isAvailable: true, tags: ['hot', 'cold'] },
  { id: 'ar-esp-2', sku: 'AR-ESP-002', name: 'Flat White', price: 145, costPrice: 55, category: 'ESPRESSO', description: 'Double ristretto with steamed milk', unit: 'cup', isAvailable: true, tags: ['hot'] },
  { id: 'ar-esp-3', sku: 'AR-ESP-003', name: 'Cortado', price: 140, costPrice: 52, category: 'ESPRESSO', description: 'Equal parts espresso and warm milk', unit: 'cup', isAvailable: true, tags: ['hot'] },
  { id: 'ar-esp-4', sku: 'AR-ESP-004', name: 'Cappuccino', price: 135, costPrice: 48, category: 'ESPRESSO', description: 'Classic Italian cappuccino', unit: 'cup', isAvailable: true, tags: ['hot'] },
  { id: 'ar-esp-5', sku: 'AR-ESP-005', name: 'Caffe Latte', price: 135, costPrice: 48, category: 'ESPRESSO', description: 'Espresso with steamed milk', unit: 'cup', isAvailable: true, tags: ['hot', 'cold'] },
  { id: 'ar-esp-6', sku: 'AR-ESP-006', name: 'Spanish Latte', price: 155, costPrice: 58, category: 'ESPRESSO', description: 'Condensed milk espresso latte', unit: 'cup', isAvailable: true, tags: ['hot', 'cold'] },
  // NON-COFFEE
  { id: 'ar-nc-1', sku: 'AR-NCF-001', name: 'Matcha Milk', price: 175, costPrice: 68, category: 'NON-COFFEE', description: 'Classic ceremonial matcha with milk', unit: 'cup', isAvailable: true, tags: ['hot', 'cold', 'matcha'] },
  { id: 'ar-nc-2', sku: 'AR-NCF-002', name: 'Hojicha Latte', price: 175, costPrice: 68, category: 'NON-COFFEE', description: 'Roasted green tea latte', unit: 'cup', isAvailable: true, tags: ['hot', 'cold'] },
  { id: 'ar-nc-3', sku: 'AR-NCF-003', name: 'Ube Latte', price: 175, costPrice: 70, category: 'NON-COFFEE', description: 'Purple yam latte with oat milk', unit: 'cup', isAvailable: true, tags: ['hot', 'cold', 'vegan'] },
  { id: 'ar-nc-4', sku: 'AR-NCF-004', name: 'Strawberry Milk', price: 165, costPrice: 62, category: 'NON-COFFEE', description: 'Fresh strawberry with steamed milk', unit: 'cup', isAvailable: true, tags: ['cold'] },
  { id: 'ar-nc-5', sku: 'AR-NCF-005', name: 'Mango Sago', price: 180, costPrice: 70, category: 'NON-COFFEE', description: 'Mango puree with sago pearls', unit: 'cup', isAvailable: true, tags: ['cold'] },
  { id: 'ar-nc-6', sku: 'AR-NCF-006', name: 'Dark Chocolate', price: 160, costPrice: 60, category: 'NON-COFFEE', description: 'Rich 70% cacao hot chocolate', unit: 'cup', isAvailable: true, tags: ['hot'] },
  // FRAPPE
  { id: 'ar-frp-1', sku: 'AR-FRP-001', name: 'Mocha Frappe', price: 210, costPrice: 82, category: 'FRAPPE', description: 'Chocolate espresso blended frappe', unit: 'cup', isAvailable: true, tags: ['cold', 'blended'] },
  { id: 'ar-frp-2', sku: 'AR-FRP-002', name: 'Matcha Frappe', price: 215, costPrice: 85, category: 'FRAPPE', description: 'Matcha blended with vanilla ice cream', unit: 'cup', isAvailable: true, tags: ['cold', 'blended', 'matcha'] },
  { id: 'ar-frp-3', sku: 'AR-FRP-003', name: 'Caramel Frappe', price: 210, costPrice: 82, category: 'FRAPPE', description: 'Caramel coffee frappe', unit: 'cup', isAvailable: true, tags: ['cold', 'blended'] },
  { id: 'ar-frp-4', sku: 'AR-FRP-004', name: 'Ube Frappe', price: 215, costPrice: 85, category: 'FRAPPE', description: 'Ube blended frappe with cream', unit: 'cup', isAvailable: true, tags: ['cold', 'blended'] },
  // TOAST & SANDWICH
  { id: 'ar-ts-1', sku: 'AR-TSW-001', name: 'Avocado Toast', price: 220, costPrice: 90, category: 'TOAST & SANDWICH', description: 'Sourdough with smashed avo and chili flakes', unit: 'serving', isAvailable: true, tags: ['savory', 'vegan'] },
  { id: 'ar-ts-2', sku: 'AR-TSW-002', name: 'Egg & Cheese Croissant', price: 195, costPrice: 78, category: 'TOAST & SANDWICH', description: 'Flaky croissant with scrambled egg', unit: 'piece', isAvailable: true, tags: ['savory', 'breakfast'] },
  { id: 'ar-ts-3', sku: 'AR-TSW-003', name: 'BLT Club', price: 210, costPrice: 85, category: 'TOAST & SANDWICH', description: 'Bacon, lettuce, tomato on brioche', unit: 'piece', isAvailable: true, tags: ['savory'] },
  { id: 'ar-ts-4', sku: 'AR-TSW-004', name: 'Mushroom Toast', price: 195, costPrice: 78, category: 'TOAST & SANDWICH', description: 'Sauteed mushroom with ricotta on sourdough', unit: 'serving', isAvailable: true, tags: ['savory', 'vegetarian'] },
  { id: 'ar-ts-5', sku: 'AR-TSW-005', name: 'Tuna Melt', price: 185, costPrice: 72, category: 'TOAST & SANDWICH', description: 'Tuna salad with melted cheese on rye', unit: 'piece', isAvailable: true, tags: ['savory'] },
  // PASTRY
  { id: 'ar-pst-1', sku: 'AR-PST-001', name: 'Butter Croissant', price: 95, costPrice: 35, category: 'PASTRY', description: 'Classic flaky butter croissant', unit: 'piece', isAvailable: true, tags: ['sweet', 'pastry', 'breakfast'] },
  { id: 'ar-pst-2', sku: 'AR-PST-002', name: 'Almond Croissant', price: 120, costPrice: 45, category: 'PASTRY', description: 'Croissant with almond cream filling', unit: 'piece', isAvailable: true, tags: ['sweet', 'pastry'] },
  { id: 'ar-pst-3', sku: 'AR-PST-003', name: 'Blueberry Muffin', price: 110, costPrice: 40, category: 'PASTRY', description: 'House-baked blueberry muffin', unit: 'piece', isAvailable: true, tags: ['sweet', 'pastry'] },
  { id: 'ar-pst-4', sku: 'AR-PST-004', name: 'Banana Loaf (slice)', price: 95, costPrice: 32, category: 'PASTRY', description: 'Moist banana loaf slice', unit: 'piece', isAvailable: true, tags: ['sweet', 'pastry'] },
  { id: 'ar-pst-5', sku: 'AR-PST-005', name: 'Choco Chip Cookie', price: 85, costPrice: 28, category: 'PASTRY', description: 'Thick and chewy chocolate chip cookie', unit: 'piece', isAvailable: true, tags: ['sweet'] },
  { id: 'ar-pst-6', sku: 'AR-PST-006', name: 'Matcha Cookie', price: 90, costPrice: 30, category: 'PASTRY', description: 'Matcha white chocolate cookie', unit: 'piece', isAvailable: true, tags: ['sweet', 'matcha'] },
  { id: 'ar-pst-7', sku: 'AR-PST-007', name: 'Cinnamon Roll', price: 130, costPrice: 48, category: 'PASTRY', description: 'Soft cinnamon roll with cream cheese glaze', unit: 'piece', isAvailable: true, tags: ['sweet', 'pastry'] },
  // ART BITES
  { id: 'ar-ab-1', sku: 'AR-ABT-001', name: 'Truffle Fries', price: 195, costPrice: 78, category: 'ART BITES', description: 'Crispy fries with truffle oil and parmesan', unit: 'serving', isAvailable: true, tags: ['savory', 'premium'] },
  { id: 'ar-ab-2', sku: 'AR-ABT-002', name: 'Cheese Board', price: 350, costPrice: 150, category: 'ART BITES', description: 'Curated cheese selection with crackers and jam', unit: 'serving', isAvailable: true, tags: ['savory', 'shareable', 'premium'] },
  { id: 'ar-ab-3', sku: 'AR-ABT-003', name: 'Bruschetta', price: 175, costPrice: 65, category: 'ART BITES', description: 'Tomato basil bruschetta on toasted ciabatta', unit: 'serving', isAvailable: true, tags: ['savory', 'vegetarian'] },
  { id: 'ar-ab-4', sku: 'AR-ABT-004', name: 'Nachos Grande', price: 220, costPrice: 88, category: 'ART BITES', description: 'Loaded nachos with salsa and sour cream', unit: 'serving', isAvailable: true, tags: ['savory', 'shareable'] },
  { id: 'ar-ab-5', sku: 'AR-ABT-005', name: 'Garlic Bread', price: 120, costPrice: 42, category: 'ART BITES', description: 'Toasted garlic bread with herb butter', unit: 'serving', isAvailable: true, tags: ['savory', 'vegetarian'] },
];
