/**
 * Constants for Convex backend
 * Note: Convex cannot import from outside convex/ folder
 */

export const CONFIDENCE_THRESHOLD = 0.7;

export const SKIN_COMPATIBILITY_SCORES = {
  GOOD_MIN: 70,
  NEUTRAL_MIN: 40,
  BAD_MAX: 39,
} as const;

export const DEFAULT_SKIN_COMPATIBILITY_SCORES = {
  good: 75,
  neutral: 50,
  bad: 25,
} as const;

export const SEARCH = {
  MIN_QUERY_LENGTH: 2,
  MAX_RESULTS: 20,
} as const;

export const VALIDATION = {
  MAX_BASE64_SIZE: 10 * 1024 * 1024, // 10MB
  MIN_SEARCH_QUERY_LENGTH: 2,
  MAX_SEARCH_QUERY_LENGTH: 100,
} as const;

export const API_CONFIG = {
  VSEGPT_BASE_URL: 'https://api.vsegpt.ru/v1/chat/completions',
  TAVILY_BASE_URL: 'https://api.tavily.com/search',
  MODEL: 'openai/gpt-4o-mini',
  HTTP_REFERER: 'https://beauty-ai.app',
  X_TITLE: 'Beauty AI',
} as const;

