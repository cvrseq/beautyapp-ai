/**
 * Centralized skin type definitions
 * Single source of truth for skin types across the application
 */

export const SKIN_TYPES = ['dry', 'oily', 'combination', 'normal', 'sensitive'] as const;

export type SkinType = (typeof SKIN_TYPES)[number];

export const SKIN_TYPE_LABELS: Record<SkinType, string> = {
  dry: 'Сухая кожа',
  oily: 'Жирная кожа',
  combination: 'Комбинированная кожа',
  normal: 'Нормальная кожа',
  sensitive: 'Чувствительная кожа',
};

export const SKIN_TYPE_SHORT_LABELS: Record<SkinType, string> = {
  dry: 'Сухая',
  oily: 'Жирная',
  combination: 'Комбинированная',
  normal: 'Нормальная',
  sensitive: 'Чувствительная',
};

export const SKIN_TYPE_DESCRIPTIONS: Record<SkinType, string> = {
  dry: 'Чувство стянутости, шелушение',
  oily: 'Блеск, расширенные поры',
  combination: 'Сухость на щеках, жирность в Т-зоне',
  normal: 'Сбалансированная, без проблем',
  sensitive: 'Покраснения, раздражения',
};

export const SKIN_TYPE_ICONS: Record<SkinType, string> = {
  dry: 'water-outline',
  oily: 'flash-outline',
  combination: 'layers-outline',
  normal: 'checkmark-circle-outline',
  sensitive: 'heart-outline',
};

/**
 * Skin type compatibility status
 */
export const SKIN_COMPATIBILITY_STATUSES = ['good', 'bad', 'neutral'] as const;
export type SkinCompatibilityStatus = (typeof SKIN_COMPATIBILITY_STATUSES)[number];

/**
 * Skin compatibility data structure
 */
export interface SkinCompatibilityItem {
  status: SkinCompatibilityStatus;
  score: number; // 0-100
}

export type SkinCompatibility = Record<SkinType, SkinCompatibilityItem>;

/**
 * Skin type UI data structure
 */
export interface SkinTypeOption {
  id: SkinType;
  label: string;
  icon: string;
  desc: string;
}

/**
 * Get all skin type options for UI
 */
export function getSkinTypeOptions(): SkinTypeOption[] {
  return SKIN_TYPES.map((type) => ({
    id: type,
    label: SKIN_TYPE_SHORT_LABELS[type],
    icon: SKIN_TYPE_ICONS[type],
    desc: SKIN_TYPE_DESCRIPTIONS[type],
  }));
}

/**
 * Validate if string is a valid skin type
 */
export function isValidSkinType(value: string | null | undefined): value is SkinType {
  return value !== null && value !== undefined && SKIN_TYPES.includes(value as SkinType);
}

