/**
 * Type definitions for Convex backend
 * Note: Convex cannot import from outside convex/ folder
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

// Age ranges
export const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'] as const;
export type AgeRange = (typeof AGE_RANGES)[number];

// Lifestyle types
export const LIFESTYLES = [
  'active',       // Active lifestyle, sports
  'sedentary',    // Sedentary work, low activity
  'outdoor',      // Lots of time outdoors
  'stress',       // High stress
  'balanced',     // Balanced lifestyle
] as const;
export type Lifestyle = (typeof LIFESTYLES)[number];

// Location with climate data
export interface LocationClimate {
  humidity: 'low' | 'medium' | 'high';
  pollution: 'low' | 'medium' | 'high';
  uv: 'low' | 'medium' | 'high';
  climate: 'continental' | 'maritime' | 'subtropical' | 'tropical' | 'arid';
}

export const LOCATIONS = [
  'moscow',
  'saint_petersburg',
  'novosibirsk',
  'yekaterinburg',
  'kazan',
  'sochi',
  'vladivostok',
  'other_humid',
  'other_dry',
] as const;
export type Location = (typeof LOCATIONS)[number];

export const SKIN_COMPATIBILITY_STATUSES = ['good', 'bad', 'neutral'] as const;
export type SkinCompatibilityStatus = (typeof SKIN_COMPATIBILITY_STATUSES)[number];

export interface SkinCompatibilityItem {
  status: SkinCompatibilityStatus;
  score: number; // 0-100
}

export type SkinCompatibility = Record<SkinType, SkinCompatibilityItem>;

export const HAIR_TYPES = ['straight', 'wavy', 'curly', 'coily', 'oily', 'dry', 'normal', 'damaged'] as const;
export type HairType = (typeof HAIR_TYPES)[number];

export const HAIR_COMPATIBILITY_STATUSES = ['good', 'bad', 'neutral'] as const;
export type HairCompatibilityStatus = (typeof HAIR_COMPATIBILITY_STATUSES)[number];

export interface HairCompatibilityItem {
  status: HairCompatibilityStatus;
  score: number; // 0-100
}

export type HairCompatibility = Record<HairType, HairCompatibilityItem>;

export interface Ingredient {
  name: string;
  status: 'green' | 'yellow' | 'red';
  desc: string;
}

export interface CosmeticAnalysis {
  pros: string[];
  cons: string[];
  hazards: 'low' | 'medium' | 'high';
  ingredients: Ingredient[];
}

export type ProductCategory = 'skin' | 'hair' | 'mixed' | 'unknown';

export interface ProductAnalysisResult {
  brand: string;
  name: string;
  confidence: number;
  analysis: CosmeticAnalysis;
  category: ProductCategory;
  skinCompatibility?: SkinCompatibility;
  hairCompatibility?: HairCompatibility;
}

