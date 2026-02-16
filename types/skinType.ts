/**
 * Centralized skin type definitions
 * Single source of truth for skin types across the application
 */

export const SKIN_TYPES = [
  'dry',
  'oily',
  'combination',
  'normal',
  'sensitive',
  'mature',
  'acne_prone',
  'dehydrated',
  'pigmented',
] as const;

export type SkinType = (typeof SKIN_TYPES)[number];

export const SKIN_TYPE_LABELS: Record<SkinType, string> = {
  dry: 'Сухая кожа',
  oily: 'Жирная кожа',
  combination: 'Комбинированная кожа',
  normal: 'Нормальная кожа',
  sensitive: 'Чувствительная кожа',
  mature: 'Возрастная кожа',
  acne_prone: 'Склонная к акне',
  dehydrated: 'Обезвоженная кожа',
  pigmented: 'С пигментацией',
};

export const SKIN_TYPE_SHORT_LABELS: Record<SkinType, string> = {
  dry: 'Сухая',
  oily: 'Жирная',
  combination: 'Комбинированная',
  normal: 'Нормальная',
  sensitive: 'Чувствительная',
  mature: 'Возрастная',
  acne_prone: 'Склонная к акне',
  dehydrated: 'Обезвоженная',
  pigmented: 'С пигментацией',
};

export const SKIN_TYPE_DESCRIPTIONS: Record<SkinType, string> = {
  dry: 'Чувство стянутости, шелушение',
  oily: 'Блеск, расширенные поры',
  combination: 'Сухость на щеках, жирность в Т-зоне',
  normal: 'Сбалансированная, без проблем',
  sensitive: 'Покраснения, раздражения',
  mature: 'Морщины, потеря упругости',
  acne_prone: 'Частые высыпания, воспаления',
  dehydrated: 'Недостаток влаги, тусклость',
  pigmented: 'Пигментные пятна, неровный тон',
};

export const SKIN_TYPE_ICONS: Record<SkinType, string> = {
  dry: 'water-outline',
  oily: 'flash-outline',
  combination: 'layers-outline',
  normal: 'checkmark-circle-outline',
  sensitive: 'heart-outline',
  mature: 'hourglass-outline',
  acne_prone: 'medical-outline',
  dehydrated: 'rainy-outline',
  pigmented: 'color-palette-outline',
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

