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

export type ProductCategory = 'skin' | 'hair' | 'mixed' | 'perfume' | 'unknown';

export interface ProductAnalysisResult {
  brand: string;
  name: string;
  confidence: number;
  analysis?: CosmeticAnalysis;
  category: ProductCategory;
  skinCompatibility?: SkinCompatibility;
  hairCompatibility?: HairCompatibility;
  perfumeData?: PerfumeData;
}

// ===== PERFUME TYPES =====

// Note pyramid (olfactory pyramid)
export interface NotePyramid {
  top: string[];      // Top notes (5-15 min)
  heart: string[];    // Heart/middle notes (several hours)
  base: string[];     // Base notes (6+ hours)
}

// Fragrance accord
export interface FragranceAccord {
  name: string;
  strength: number;   // 0-100
}

// Seasonality ratings
export interface Seasonality {
  spring: number;     // 0-100
  summer: number;     // 0-100
  fall: number;       // 0-100
  winter: number;     // 0-100
}

// Time of day ratings
export interface TimeOfDay {
  day: number;        // 0-100
  evening: number;    // 0-100
  night: number;      // 0-100
}

// Sillage levels
export const SILLAGE_LEVELS = ['intimate', 'moderate', 'strong', 'enormous'] as const;
export type SillageLevel = (typeof SILLAGE_LEVELS)[number];

// Longevity descriptions
export const LONGEVITY_DESCRIPTIONS = ['weak', 'moderate', 'good', 'excellent', 'eternal'] as const;
export type LongevityDescription = (typeof LONGEVITY_DESCRIPTIONS)[number];

// Concentration types
export const CONCENTRATION_TYPES = [
  'eau_fraiche',
  'eau_de_cologne',
  'eau_de_toilette',
  'eau_de_parfum',
  'parfum',
  'extrait'
] as const;
export type ConcentrationType = (typeof CONCENTRATION_TYPES)[number];

// Gender types
export const GENDER_TYPES = ['masculine', 'feminine', 'unisex'] as const;
export type GenderType = (typeof GENDER_TYPES)[number];

// Longevity data
export interface Longevity {
  hours: number;                    // 1-24
  rating: number;                   // 1-10
  description: LongevityDescription;
}

// Sillage data
export interface Sillage {
  level: SillageLevel;
  rating: number;                   // 1-10
}

// Full perfume data structure
export interface PerfumeData {
  notePyramid: NotePyramid;
  accords: FragranceAccord[];
  seasonality: Seasonality;
  timeOfDay: TimeOfDay;
  longevity: Longevity;
  sillage: Sillage;
  concentration?: ConcentrationType;
  gender?: GenderType;
  releaseYear?: number;
  perfumer?: string;
}

// User types for auth
export interface UserProfile {
  skinType?: string;
  hairType?: string;
  age?: string;
  lifestyle?: string;
  location?: string;
}

export type AuthType = 'anonymous' | 'registered';

export interface User {
  _id: string;
  authType: AuthType;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  deviceId?: string;
  profile?: UserProfile;
  createdAt: number;
  lastActiveAt: number;
}

export interface Comment {
  _id: string;
  productId: string;
  userId: string;
  text: string;
  createdAt: number;
  updatedAt?: number;
  isDeleted?: boolean;
}

export interface CommentWithUser extends Comment {
  user?: {
    displayName: string;
    avatarUrl?: string;
  };
}

