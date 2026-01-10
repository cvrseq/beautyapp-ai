/**
 * Type definitions for Convex backend
 * Note: Convex cannot import from outside convex/ folder
 */

export const SKIN_TYPES = ['dry', 'oily', 'combination', 'normal', 'sensitive'] as const;
export type SkinType = (typeof SKIN_TYPES)[number];

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

