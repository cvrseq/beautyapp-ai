/**
 * Application configuration constants
 */

/**
 * API configuration
 */
export const API_CONFIG = {
  VSEGPT_BASE_URL: 'https://api.vsegpt.ru/v1/chat/completions',
  TAVILY_BASE_URL: 'https://api.tavily.com/search',
  MODEL: 'google/gemini-3-flash-pre',
} as const;

/**
 * HTTP headers for API requests
 */
export const API_HEADERS = {
  HTTP_REFERER: 'https://beauty-ai.app',
  X_TITLE: 'Beauty AI',
} as const;

