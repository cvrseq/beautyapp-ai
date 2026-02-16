/**
 * User profile types: age, lifestyle, location
 * Single source of truth for user profile data
 */

// Age ranges
export const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'] as const;
export type AgeRange = (typeof AGE_RANGES)[number];

export const AGE_RANGE_LABELS: Record<AgeRange, string> = {
  '18-24': '18-24 года',
  '25-34': '25-34 года',
  '35-44': '35-44 года',
  '45-54': '45-54 года',
  '55+': '55+ лет',
};

export const AGE_RANGE_DESCRIPTIONS: Record<AgeRange, string> = {
  '18-24': 'Молодая кожа, профилактика',
  '25-34': 'Первые признаки старения',
  '35-44': 'Антивозрастной уход',
  '45-54': 'Интенсивный уход',
  '55+': 'Зрелая кожа',
};

export const AGE_RANGE_ICONS: Record<AgeRange, string> = {
  '18-24': 'sparkles-outline',
  '25-34': 'sunny-outline',
  '35-44': 'fitness-outline',
  '45-54': 'shield-outline',
  '55+': 'diamond-outline',
};

export interface AgeRangeOption {
  id: AgeRange;
  label: string;
  icon: string;
  desc: string;
}

export function getAgeRangeOptions(): AgeRangeOption[] {
  return AGE_RANGES.map((range) => ({
    id: range,
    label: AGE_RANGE_LABELS[range],
    icon: AGE_RANGE_ICONS[range],
    desc: AGE_RANGE_DESCRIPTIONS[range],
  }));
}

export function isValidAgeRange(value: string | null | undefined): value is AgeRange {
  return value !== null && value !== undefined && AGE_RANGES.includes(value as AgeRange);
}

// Lifestyle types
export const LIFESTYLES = ['active', 'sedentary', 'outdoor', 'stress', 'balanced'] as const;
export type Lifestyle = (typeof LIFESTYLES)[number];

export const LIFESTYLE_LABELS: Record<Lifestyle, string> = {
  active: 'Активный',
  sedentary: 'Сидячий',
  outdoor: 'На свежем воздухе',
  stress: 'Стрессовый',
  balanced: 'Сбалансированный',
};

export const LIFESTYLE_DESCRIPTIONS: Record<Lifestyle, string> = {
  active: 'Спорт, много движения',
  sedentary: 'Офисная работа, мало активности',
  outdoor: 'Много времени на улице',
  stress: 'Высокий уровень стресса',
  balanced: 'Умеренная активность',
};

export const LIFESTYLE_ICONS: Record<Lifestyle, string> = {
  active: 'barbell-outline',
  sedentary: 'desktop-outline',
  outdoor: 'leaf-outline',
  stress: 'flash-outline',
  balanced: 'scale-outline',
};

export interface LifestyleOption {
  id: Lifestyle;
  label: string;
  icon: string;
  desc: string;
}

export function getLifestyleOptions(): LifestyleOption[] {
  return LIFESTYLES.map((lifestyle) => ({
    id: lifestyle,
    label: LIFESTYLE_LABELS[lifestyle],
    icon: LIFESTYLE_ICONS[lifestyle],
    desc: LIFESTYLE_DESCRIPTIONS[lifestyle],
  }));
}

export function isValidLifestyle(value: string | null | undefined): value is Lifestyle {
  return value !== null && value !== undefined && LIFESTYLES.includes(value as Lifestyle);
}

// Location types with climate data
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

export interface LocationClimate {
  humidity: 'low' | 'medium' | 'high';
  pollution: 'low' | 'medium' | 'high';
  uv: 'low' | 'medium' | 'high';
  climate: 'continental' | 'maritime' | 'subtropical' | 'tropical' | 'arid';
}

export const LOCATION_LABELS: Record<Location, string> = {
  moscow: 'Москва',
  saint_petersburg: 'Санкт-Петербург',
  novosibirsk: 'Новосибирск',
  yekaterinburg: 'Екатеринбург',
  kazan: 'Казань',
  sochi: 'Сочи',
  vladivostok: 'Владивосток',
  other_humid: 'Другой (влажный климат)',
  other_dry: 'Другой (сухой климат)',
};

export const LOCATION_DESCRIPTIONS: Record<Location, string> = {
  moscow: 'Умеренный климат, средняя влажность',
  saint_petersburg: 'Высокая влажность, мало солнца',
  novosibirsk: 'Резко континентальный, сухой',
  yekaterinburg: 'Континентальный, сухой',
  kazan: 'Умеренный, средняя влажность',
  sochi: 'Субтропический, высокая влажность',
  vladivostok: 'Муссонный, влажный',
  other_humid: 'Высокая влажность воздуха',
  other_dry: 'Низкая влажность воздуха',
};

export const LOCATION_ICONS: Record<Location, string> = {
  moscow: 'business-outline',
  saint_petersburg: 'rainy-outline',
  novosibirsk: 'snow-outline',
  yekaterinburg: 'cloudy-outline',
  kazan: 'partly-sunny-outline',
  sochi: 'sunny-outline',
  vladivostok: 'boat-outline',
  other_humid: 'water-outline',
  other_dry: 'sunny-outline',
};

// Climate data for each location (affects skin recommendations)
export const LOCATION_CLIMATE: Record<Location, LocationClimate> = {
  moscow: {
    humidity: 'medium',
    pollution: 'high',
    uv: 'medium',
    climate: 'continental',
  },
  saint_petersburg: {
    humidity: 'high',
    pollution: 'medium',
    uv: 'low',
    climate: 'maritime',
  },
  novosibirsk: {
    humidity: 'low',
    pollution: 'medium',
    uv: 'medium',
    climate: 'continental',
  },
  yekaterinburg: {
    humidity: 'low',
    pollution: 'medium',
    uv: 'medium',
    climate: 'continental',
  },
  kazan: {
    humidity: 'medium',
    pollution: 'medium',
    uv: 'medium',
    climate: 'continental',
  },
  sochi: {
    humidity: 'high',
    pollution: 'low',
    uv: 'high',
    climate: 'subtropical',
  },
  vladivostok: {
    humidity: 'high',
    pollution: 'low',
    uv: 'medium',
    climate: 'maritime',
  },
  other_humid: {
    humidity: 'high',
    pollution: 'medium',
    uv: 'medium',
    climate: 'maritime',
  },
  other_dry: {
    humidity: 'low',
    pollution: 'medium',
    uv: 'medium',
    climate: 'continental',
  },
};

export interface LocationOption {
  id: Location;
  label: string;
  icon: string;
  desc: string;
  climate: LocationClimate;
}

export function getLocationOptions(): LocationOption[] {
  return LOCATIONS.map((location) => ({
    id: location,
    label: LOCATION_LABELS[location],
    icon: LOCATION_ICONS[location],
    desc: LOCATION_DESCRIPTIONS[location],
    climate: LOCATION_CLIMATE[location],
  }));
}

export function isValidLocation(value: string | null | undefined): value is Location {
  return value !== null && value !== undefined && LOCATIONS.includes(value as Location);
}

// Helper to get climate description for AI prompt
export function getClimateDescription(location: Location): string {
  const climate = LOCATION_CLIMATE[location];
  const parts: string[] = [];

  if (climate.humidity === 'high') {
    parts.push('высокая влажность воздуха');
  } else if (climate.humidity === 'low') {
    parts.push('низкая влажность воздуха');
  }

  if (climate.pollution === 'high') {
    parts.push('высокий уровень загрязнения воздуха');
  }

  if (climate.uv === 'high') {
    parts.push('высокий уровень UV-излучения');
  } else if (climate.uv === 'low') {
    parts.push('низкий уровень UV-излучения');
  }

  return parts.length > 0 ? parts.join(', ') : 'умеренные климатические условия';
}
