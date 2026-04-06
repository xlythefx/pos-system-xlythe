import { godswillMenuItems } from './cafes/godswill-menu';
import { artRanchMenuItems } from './cafes/artranch-menu';
import type { MenuItem } from '@/contexts/POSContext';

// ─── Change this to switch cafes ───────────────────────────────────────────
export const cafeName: 'godswill' | 'artranch' = 'godswill';
// ───────────────────────────────────────────────────────────────────────────

export interface CafeConfig {
  displayName: string;
  storageKey: string;
  menuItems: MenuItem[];
}

export const cafeConfigs: Record<string, CafeConfig> = {
  godswill: {
    displayName: 'Gods Will Cafe',
    storageKey: 'godswill',
    menuItems: godswillMenuItems,
  },
  artranch: {
    displayName: 'Art Ranch Cafe',
    storageKey: 'artranch',
    menuItems: artRanchMenuItems,
  },
};

export const activeCafe: CafeConfig = cafeConfigs[cafeName];
