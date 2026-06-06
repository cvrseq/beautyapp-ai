import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { translations, Locale, TranslationKey } from '@/constants/i18n';

const LOCALE_KEY = '@beauty_ai_locale';

interface LocaleContextType {
  locale: Locale;
  setLocale: (l: Locale) => Promise<void>;
  toggleLocale: () => Promise<void>;
  /** Type-safe translation lookup */
  t: (key: TranslationKey) => string;
  /** Russian/English-aware plural form for review counts */
  reviewsLabel: (n: number) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ru');

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_KEY)
      .then(saved => {
        if (saved === 'ru' || saved === 'en') setLocaleState(saved as Locale);
      })
      .catch(() => {});
  }, []);

  const setLocale = async (l: Locale) => {
    await AsyncStorage.setItem(LOCALE_KEY, l);
    setLocaleState(l);
  };

  const toggleLocale = async () => setLocale(locale === 'ru' ? 'en' : 'ru');

  const t = (key: TranslationKey): string => translations[locale][key];

  const reviewsLabel = (n: number): string => {
    if (n === 0) return t('community.noReviews');
    if (locale === 'en') {
      return `${n} ${n === 1 ? t('community.reviewOne') : t('community.reviewMany')}`;
    }
    // Russian plural rules
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return `${n} ${t('community.reviewMany')}`;
    if (mod10 === 1) return `${n} ${t('community.reviewOne')}`;
    if (mod10 >= 2 && mod10 <= 4) return `${n} ${t('community.reviewFew')}`;
    return `${n} ${t('community.reviewMany')}`;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, toggleLocale, t, reviewsLabel }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextType {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider');
  return ctx;
}
