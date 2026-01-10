/**
 * Centralized hair type definitions
 * Single source of truth for hair types across the application
 */

export const HAIR_TYPES = ['straight', 'wavy', 'curly', 'coily', 'oily', 'dry', 'normal', 'damaged'] as const;

export type HairType = (typeof HAIR_TYPES)[number];

export const HAIR_TYPE_LABELS: Record<HairType, string> = {
  straight: 'Прямые волосы',
  wavy: 'Волнистые волосы',
  curly: 'Кудрявые волосы',
  coily: 'Кучерявые волосы',
  oily: 'Жирные волосы',
  dry: 'Сухие волосы',
  normal: 'Нормальные волосы',
  damaged: 'Повреждённые волосы',
};

export const HAIR_TYPE_SHORT_LABELS: Record<HairType, string> = {
  straight: 'Прямые',
  wavy: 'Волнистые',
  curly: 'Кудрявые',
  coily: 'Кучерявые',
  oily: 'Жирные',
  dry: 'Сухие',
  normal: 'Нормальные',
  damaged: 'Повреждённые',
};

export const HAIR_TYPE_DESCRIPTIONS: Record<HairType, string> = {
  straight: 'Ровные, гладкие, без завитков',
  wavy: 'Мягкие волны, S-образная форма',
  curly: 'Явные локоны, пружинистые завитки',
  coily: 'Тугие кольца, очень кучерявые',
  oily: 'Быстро загрязняются, нужен контроль жира',
  dry: 'Ломкие, тусклые, нужна увлажняющая косметика',
  normal: 'Сбалансированные, без проблем',
  damaged: 'Обесцвеченные, после окрашивания, секущиеся',
};

export const HAIR_TYPE_ICONS: Record<HairType, string> = {
  straight: 'remove-outline',
  wavy: 'water-outline',
  curly: 'infinite-outline',
  coily: 'reload-outline',
  oily: 'flash-outline',
  dry: 'water-outline',
  normal: 'checkmark-circle-outline',
  damaged: 'warning-outline',
};

/**
 * Hair type compatibility status
 */
export const HAIR_COMPATIBILITY_STATUSES = ['good', 'bad', 'neutral'] as const;
export type HairCompatibilityStatus = (typeof HAIR_COMPATIBILITY_STATUSES)[number];

/**
 * Hair compatibility data structure
 */
export interface HairCompatibilityItem {
  status: HairCompatibilityStatus;
  score: number; // 0-100
}

export type HairCompatibility = Record<HairType, HairCompatibilityItem>;

/**
 * Hair type UI data structure
 */
export interface HairTypeOption {
  id: HairType;
  label: string;
  icon: string;
  desc: string;
}

/**
 * Get all hair type options for UI
 */
export function getHairTypeOptions(): HairTypeOption[] {
  return HAIR_TYPES.map((type) => ({
    id: type,
    label: HAIR_TYPE_SHORT_LABELS[type],
    icon: HAIR_TYPE_ICONS[type],
    desc: HAIR_TYPE_DESCRIPTIONS[type],
  }));
}

/**
 * Validate if string is a valid hair type
 */
export function isValidHairType(value: string | null | undefined): value is HairType {
  return value !== null && value !== undefined && HAIR_TYPES.includes(value as HairType);
}

