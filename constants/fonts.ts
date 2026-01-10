import { Platform } from 'react-native';

/**
 * Apple-style font configuration
 * Uses SF Pro on iOS, system font on Android
 */
const getAppleFont = () => {
  if (Platform.OS === 'ios') {
    return 'System'; // SF Pro on iOS
  }
  return undefined; // System font on Android (Roboto)
};

const appleFont = getAppleFont();

/**
 * Common text styles in Apple style
 */
export const APPLE_TEXT_STYLES = {
  largeTitle: {
    ...(appleFont ? { fontFamily: appleFont } : {}),
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
    letterSpacing: 0.37,
  },
  title1: {
    ...(appleFont ? { fontFamily: appleFont } : {}),
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: 0.36,
  },
  title2: {
    ...(appleFont ? { fontFamily: appleFont } : {}),
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: 0.35,
  },
  title3: {
    ...(appleFont ? { fontFamily: appleFont } : {}),
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
    letterSpacing: 0.38,
  },
  headline: {
    ...(appleFont ? { fontFamily: appleFont } : {}),
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  body: {
    ...(appleFont ? { fontFamily: appleFont } : {}),
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  callout: {
    ...(appleFont ? { fontFamily: appleFont } : {}),
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  subhead: {
    ...(appleFont ? { fontFamily: appleFont } : {}),
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  footnote: {
    ...(appleFont ? { fontFamily: appleFont } : {}),
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  caption1: {
    ...(appleFont ? { fontFamily: appleFont } : {}),
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  caption2: {
    ...(appleFont ? { fontFamily: appleFont } : {}),
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 13,
    letterSpacing: 0.07,
  },
};

