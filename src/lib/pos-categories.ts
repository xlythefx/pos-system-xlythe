/**
 * POS category structure - shared between POS and Inventory
 */
export const MAIN_CATEGORIES = ['ALL', 'DRINKS', 'SNACKS', 'BREAD', 'RICE MEAL'] as const;
export const DRINK_SUB_CATEGORIES = [
  'BESTSELLER',
  'CLASSIC COFFEE',
  'MATCHA SERIES',
  'MILK SERIES',
  'FRAPPE',
  'TIRAMISU SERIES',
] as const;

export type MainCategory = (typeof MAIN_CATEGORIES)[number];
export type DrinkSubCategory = (typeof DRINK_SUB_CATEGORIES)[number];

export const isDrinkSubCategory = (cat: string): cat is DrinkSubCategory =>
  (DRINK_SUB_CATEGORIES as readonly string[]).includes(cat);

export const getMainCategoryFromSub = (sub: string) => {
  if (isDrinkSubCategory(sub)) return 'DRINKS';
  if (['SNACKS', 'BREAD', 'RICE MEAL'].includes(sub)) return sub;
  return 'DRINKS';
};

/** All categories used for menu items (POS + Inventory) — drink subcategories first, then SNACKS, BREAD, RICE MEAL */
export const POS_MENU_CATEGORIES = [
  ...DRINK_SUB_CATEGORIES,
  'SNACKS',
  'BREAD',
  'RICE MEAL',
] as const;
