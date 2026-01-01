/**
 * Application thresholds and magic numbers
 * Centralized constants for maintainability
 */

/**
 * AI confidence threshold for product recognition
 * Products with confidence below this will be rejected
 */
export const MIN_PRODUCT_CONFIDENCE = 0.7;

/**
 * Skin compatibility score thresholds
 */
export const SKIN_COMPATIBILITY_SCORES = {
  GOOD_MIN: 70, // Score >= 70 means "good"
  NEUTRAL_MIN: 40, // Score 40-69 means "neutral"
  BAD_MAX: 39, // Score < 40 means "bad"
} as const;

/**
 * Default skin compatibility scores by status
 */
export const DEFAULT_SKIN_COMPATIBILITY_SCORES = {
  good: 75,
  neutral: 50,
  bad: 25,
} as const;

/**
 * Image processing constants
 */
export const IMAGE_PROCESSING = {
  QUALITY: 0.5, // JPEG compression quality (0-1)
  MAX_WIDTH: 800, // Maximum width for resizing
  COMPRESSION: 0.7, // Image compression ratio
} as const;

/**
 * Search constants
 */
export const SEARCH = {
  MIN_QUERY_LENGTH: 2, // Minimum characters for search
  MAX_RESULTS: 20, // Maximum search results to return
} as const;

/**
 * Validation constants
 */
export const VALIDATION = {
  MAX_BASE64_SIZE: 10 * 1024 * 1024, // 10MB max for base64 image
  MIN_SEARCH_QUERY_LENGTH: 2,
  MAX_SEARCH_QUERY_LENGTH: 100,
} as const;

