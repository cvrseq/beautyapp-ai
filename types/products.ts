/**
 * Product and analysis type definitions
 */

import { SkinCompatibility, SkinType } from './skinType';

/**
 * Ingredient status in analysis
 */
export type IngredientStatus = 'green' | 'yellow' | 'red';

/**
 * Individual ingredient analysis
 */
export interface Ingredient {
  name: string;
  status: IngredientStatus;
  desc: string;
}

/**
 * Cosmetic analysis result
 */
export interface CosmeticAnalysis {
  pros: string[];
  cons: string[];
  hazards: 'low' | 'medium' | 'high';
  ingredients: Ingredient[];
}

/**
 * AI analysis result structure
 */
export interface ProductAnalysisResult {
  brand: string;
  name: string;
  confidence: number;
  analysis: CosmeticAnalysis;
  skinCompatibility: SkinCompatibility;
}

/**
 * Product database document structure
 */
export interface Product {
  _id: string;
  _creationTime: number;
  brand: string;
  name: string;
  description: string;
  rating: number;
  pros: string[];
  cons: string[];
  ingredientsAnalysis: string; // JSON stringified CosmeticAnalysis
  priceEstimate: string;
  imageUrl: string;
  skinTypeCompatibility?: SkinCompatibility;
}

/**
 * Product search result
 */
export interface ProductSearchResult {
  _id: string;
  brand: string;
  name: string;
  priceEstimate: string;
}

/**
 * Analysis action result
 */
export interface AnalyzeProductResult {
  productId: string;
  brand: string;
  name: string;
  analysis: CosmeticAnalysis;
  price: string;
}

/**
 * Error result
 */
export interface ErrorResult {
  error: string;
}

