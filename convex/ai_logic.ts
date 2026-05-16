import { v } from 'convex/values';
import { internalAction } from './_generated/server';
import { API_CONFIG, DEFAULT_HAIR_COMPATIBILITY_SCORES, DEFAULT_SKIN_COMPATIBILITY_SCORES, HAIR_COMPATIBILITY_SCORES, SKIN_COMPATIBILITY_SCORES, VALIDATION } from './constants';
import {
  HAIR_COMPATIBILITY_STATUSES,
  HAIR_TYPES,
  SKIN_COMPATIBILITY_STATUSES,
  SKIN_TYPES,
  SILLAGE_LEVELS,
  LONGEVITY_DESCRIPTIONS,
  CONCENTRATION_TYPES,
  GENDER_TYPES,
  type HairCompatibility,
  type HairCompatibilityItem,
  type HairCompatibilityStatus,
  type ProductCategory,
  type SkinCompatibility,
  type SkinCompatibilityItem,
  type SkinCompatibilityStatus,
  type PerfumeData,
  type SillageLevel,
  type LongevityDescription,
} from './types';

// Helper function to check if string is a valid skin status
function isValidSkinStatus(value: string): value is SkinCompatibilityStatus {
  return SKIN_COMPATIBILITY_STATUSES.includes(value as SkinCompatibilityStatus);
}

// Helper function to check if string is a valid hair status
function isValidHairStatus(value: string): value is HairCompatibilityStatus {
  return HAIR_COMPATIBILITY_STATUSES.includes(value as HairCompatibilityStatus);
}

// Helper function to normalize product category
function normalizeCategory(value: unknown): ProductCategory {
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'not_beauty' || lower === 'not beauty' || lower === 'не косметика' || lower === 'другое') return 'not_beauty';
    if (lower === 'hair' || lower === 'волос' || lower === 'для волос') return 'hair';
    if (lower === 'skin' || lower === 'кожа' || lower === 'для кожи' || lower === 'лицо' || lower === 'face') return 'skin';
    if (lower === 'mixed' || lower === 'смешанный') return 'mixed';
    if (lower === 'perfume' || lower === 'парфюм' || lower === 'духи' || lower === 'туалетная вода' || lower === 'аромат' || lower === 'одеколон' || lower === 'fragrance') return 'perfume';
  }
  return 'unknown';
}

// Helper function to get default perfume data
function getDefaultPerfumeData(): PerfumeData {
  return {
    notePyramid: { top: [], heart: [], base: [] },
    accords: [],
    seasonality: { spring: 50, summer: 50, fall: 50, winter: 50 },
    timeOfDay: { day: 50, evening: 50, night: 50 },
    longevity: { hours: 6, rating: 5, description: 'moderate' },
    sillage: { level: 'moderate', rating: 5 },
  };
}

// Helper function to validate perfume data from AI response
function validatePerfumeData(data: unknown): PerfumeData {
  if (!data || typeof data !== 'object') {
    return getDefaultPerfumeData();
  }

  const d = data as Record<string, unknown>;

  // Validate note pyramid
  const notePyramid = d.notePyramid as Record<string, unknown> | undefined;
  const validatedNotePyramid = {
    top: Array.isArray(notePyramid?.top)
      ? notePyramid.top.filter((n): n is string => typeof n === 'string').slice(0, 10)
      : [],
    heart: Array.isArray(notePyramid?.heart)
      ? notePyramid.heart.filter((n): n is string => typeof n === 'string').slice(0, 10)
      : [],
    base: Array.isArray(notePyramid?.base)
      ? notePyramid.base.filter((n): n is string => typeof n === 'string').slice(0, 10)
      : [],
  };

  // Validate accords
  const accords = Array.isArray(d.accords)
    ? d.accords
        .filter((a): a is Record<string, unknown> => a !== null && typeof a === 'object')
        .map(a => ({
          name: typeof a.name === 'string' ? a.name : 'Unknown',
          strength: Math.max(0, Math.min(100, Number(a.strength) || 0)),
        }))
        .slice(0, 10)
    : [];

  // Validate seasonality
  const seasonality = d.seasonality as Record<string, unknown> | undefined;
  const validatedSeasonality = {
    spring: Math.max(0, Math.min(100, Number(seasonality?.spring) || 50)),
    summer: Math.max(0, Math.min(100, Number(seasonality?.summer) || 50)),
    fall: Math.max(0, Math.min(100, Number(seasonality?.fall) || 50)),
    winter: Math.max(0, Math.min(100, Number(seasonality?.winter) || 50)),
  };

  // Validate time of day
  const timeOfDay = d.timeOfDay as Record<string, unknown> | undefined;
  const validatedTimeOfDay = {
    day: Math.max(0, Math.min(100, Number(timeOfDay?.day) || 50)),
    evening: Math.max(0, Math.min(100, Number(timeOfDay?.evening) || 50)),
    night: Math.max(0, Math.min(100, Number(timeOfDay?.night) || 50)),
  };

  // Validate longevity
  const longevity = d.longevity as Record<string, unknown> | undefined;
  const longevityDesc = typeof longevity?.description === 'string' &&
    LONGEVITY_DESCRIPTIONS.includes(longevity.description as LongevityDescription)
    ? longevity.description as LongevityDescription
    : 'moderate';
  const validatedLongevity = {
    hours: Math.max(1, Math.min(24, Number(longevity?.hours) || 6)),
    rating: Math.max(1, Math.min(10, Number(longevity?.rating) || 5)),
    description: longevityDesc,
  };

  // Validate sillage
  const sillage = d.sillage as Record<string, unknown> | undefined;
  const sillageLevel = typeof sillage?.level === 'string' &&
    SILLAGE_LEVELS.includes(sillage.level as SillageLevel)
    ? sillage.level as SillageLevel
    : 'moderate';
  const validatedSillage = {
    level: sillageLevel,
    rating: Math.max(1, Math.min(10, Number(sillage?.rating) || 5)),
  };

  // Optional fields
  const concentration = typeof d.concentration === 'string' &&
    CONCENTRATION_TYPES.includes(d.concentration as typeof CONCENTRATION_TYPES[number])
    ? d.concentration as typeof CONCENTRATION_TYPES[number]
    : undefined;

  const gender = typeof d.gender === 'string' &&
    GENDER_TYPES.includes(d.gender as typeof GENDER_TYPES[number])
    ? d.gender as typeof GENDER_TYPES[number]
    : undefined;

  const releaseYear = typeof d.releaseYear === 'number' && d.releaseYear > 1900 && d.releaseYear < 2100
    ? d.releaseYear
    : undefined;

  const perfumer = typeof d.perfumer === 'string' && d.perfumer.length > 0
    ? d.perfumer
    : undefined;

  return {
    notePyramid: validatedNotePyramid,
    accords,
    seasonality: validatedSeasonality,
    timeOfDay: validatedTimeOfDay,
    longevity: validatedLongevity,
    sillage: validatedSillage,
    concentration,
    gender,
    releaseYear,
    perfumer,
  };
}

// ========================================
// Quick Identification (Phase 1 - Cache Check)
// Lightweight AI call to get brand + name only
// Used to check cache before full analysis
// ========================================
export const quickIdentifyProduct = internalAction({
  args: {
    imageBase64: v.string(),
  },
  handler: async (_ctx, args) => {
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return { error: 'Отсутствует ключ GEMINI_API_KEY на сервере.' };
    }

    try {
      // Validate base64 size
      if (args.imageBase64.length > VALIDATION.MAX_BASE64_SIZE) {
        return { error: 'Изображение слишком большое.' };
      }

      const response = await fetch(API_CONFIG.VSEGPT_BASE_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': API_CONFIG.HTTP_REFERER,
          'X-Title': API_CONFIG.X_TITLE,
        },
        body: JSON.stringify({
          model: API_CONFIG.MODEL,
          max_tokens: 200, // Limit tokens for quick identification
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: [
                    'Определи, является ли объект на изображении косметическим продуктом или парфюмом.',
                    '',
                    'ВАЖНО: Если на изображении НЕ косметика и НЕ парфюм (например: еда, мебель, техника, одежда, животные, люди, природа, предметы быта, украшения, канцелярия и т.д.), верни category: "not_beauty".',
                    '',
                    'Косметика включает: кремы, сыворотки, маски, тоники, очищающие средства, шампуни, кондиционеры, средства для укладки, декоративную косметику (помады, тени, тушь, румяна и т.д.), средства для ухода за кожей и волосами.',
                    'Парфюм включает: духи, туалетную воду, одеколон, парфюмерную воду.',
                    '',
                    'Верни ТОЛЬКО JSON: {"brand": "...", "name": "...", "confidence": 0-1, "category": "skin"|"hair"|"mixed"|"perfume"|"not_beauty"}',
                    'Если это не бьюти-продукт, поставь confidence: 0 и category: "not_beauty".',
                    'Без markdown, без объяснений, только JSON.',
                  ].join(' '),
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${args.imageBase64}`,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        console.error('Quick identify HTTP error', await response.text());
        return { error: 'Сервис временно недоступен.' };
      }

      const data = await response.json();
      const message = data?.choices?.[0]?.message;
      let text: string | unknown = message?.content;

      if (Array.isArray(text)) {
        text = text
          .map((part: unknown) => {
            if (typeof part === 'string') return part;
            if (part && typeof part === 'object' && 'text' in part) return part.text;
            return '';
          })
          .filter(Boolean)
          .join('\n');
      }

      if (!text || typeof text !== 'string') {
        return { error: 'Не удалось распознать.' };
      }

      let parsed: unknown;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch {
        return { error: 'Ошибка парсинга ответа.' };
      }

      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !('brand' in parsed) ||
        !('name' in parsed) ||
        !('confidence' in parsed)
      ) {
        return { error: 'Некорректный формат ответа.' };
      }

      const result = parsed as Record<string, unknown>;
      result.category = normalizeCategory(result.category);

      return {
        brand: String(result.brand),
        name: String(result.name),
        confidence: Number(result.confidence),
        category: result.category as ProductCategory,
      };
    } catch (err) {
      console.error('Quick identify failed', err);
      return { error: 'Ошибка при идентификации.' };
    }
  },
});

// ========================================
// Full Product Identification (Phase 2)
// Complete analysis with all details
// ========================================
export const identifyProduct = internalAction({
  args: {
    imageBase64: v.string(),
    skinType: v.optional(v.union(
      v.literal('dry'),
      v.literal('oily'),
      v.literal('combination'),
      v.literal('normal'),
      v.literal('sensitive'),
      v.literal('mature'),
      v.literal('acne_prone'),
      v.literal('dehydrated'),
      v.literal('pigmented')
    )),
    hairType: v.optional(v.union(
      v.literal('straight'),
      v.literal('wavy'),
      v.literal('curly'),
      v.literal('coily'),
      v.literal('oily'),
      v.literal('dry'),
      v.literal('normal'),
      v.literal('damaged')
    )),
    age: v.optional(v.union(
      v.literal('18-24'),
      v.literal('25-34'),
      v.literal('35-44'),
      v.literal('45-54'),
      v.literal('55+')
    )),
    lifestyle: v.optional(v.union(
      v.literal('active'),
      v.literal('sedentary'),
      v.literal('outdoor'),
      v.literal('stress'),
      v.literal('balanced')
    )),
    location: v.optional(v.union(
      v.literal('moscow'),
      v.literal('saint_petersburg'),
      v.literal('novosibirsk'),
      v.literal('yekaterinburg'),
      v.literal('kazan'),
      v.literal('sochi'),
      v.literal('vladivostok'),
      v.literal('other_humid'),
      v.literal('other_dry')
    ))
  },
  handler: async (_ctx, args) => {
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return {
        error: 'Отсутствует ключ GEMINI_API_KEY на сервере.',
      };
    }

    try {
      // Validate base64 size
      if (args.imageBase64.length > VALIDATION.MAX_BASE64_SIZE) {
        return {
          error: 'Изображение слишком большое. Пожалуйста, используйте изображение меньшего размера.',
        };
      }

      const response = await fetch(API_CONFIG.VSEGPT_BASE_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': API_CONFIG.HTTP_REFERER,
          'X-Title': API_CONFIG.X_TITLE,
        },
        body: JSON.stringify({
          model: API_CONFIG.MODEL,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: [
                    'Ты — эксперт косметики и парфюмерии.',
                    'Определи бренд, название и категорию продукта.',
                    '',
                    'ВАЖНО: Если на изображении НЕ косметика и НЕ парфюм (еда, мебель, техника, одежда, украшения, канцелярия и т.д.), верни category: "not_beauty" с confidence: 0.',
                    '',
                    'Категории: "skin" (для лица/кожи), "hair" (для волос), "mixed" (универсальный), "perfume" (парфюм/духи/туалетная вода/одеколон), "not_beauty" (не косметика/парфюм), "unknown" (косметика, но категория не определена).',
                    '',
                    '=== ЕСЛИ ЭТО ПАРФЮМ (категория "perfume") ===',
                    'Верни JSON в формате: {brand, name, confidence, category: "perfume", perfumeData: {...}}',
                    'Структура perfumeData:',
                    '{',
                    '  "notePyramid": {"top": ["верхние ноты"], "heart": ["сердечные ноты"], "base": ["базовые ноты"]},',
                    '  "accords": [{"name": "название аккорда", "strength": 0-100}],',
                    '  "seasonality": {"spring": 0-100, "summer": 0-100, "fall": 0-100, "winter": 0-100},',
                    '  "timeOfDay": {"day": 0-100, "evening": 0-100, "night": 0-100},',
                    '  "longevity": {"hours": 1-24, "rating": 1-10, "description": "weak|moderate|good|excellent|eternal"},',
                    '  "sillage": {"level": "intimate|moderate|strong|enormous", "rating": 1-10},',
                    '  "concentration": "eau_fraiche|eau_de_cologne|eau_de_toilette|eau_de_parfum|parfum|extrait",',
                    '  "gender": "masculine|feminine|unisex",',
                    '  "releaseYear": год выпуска,',
                    '  "perfumer": "имя парфюмера"',
                    '}',
                    'Для парфюмов НЕ нужны поля: analysis, skinCompatibility, hairCompatibility.',
                    '',
                    '=== ЕСЛИ ЭТО КОСМЕТИКА (skin/hair/mixed) ===',
                    // Skin type context
                    args.skinType
                      ? `Учитывай, что у пользователя ${
                          args.skinType === 'dry' ? 'сухая' :
                          args.skinType === 'oily' ? 'жирная' :
                          args.skinType === 'combination' ? 'комбинированная' :
                          args.skinType === 'normal' ? 'нормальная' :
                          args.skinType === 'sensitive' ? 'чувствительная' :
                          args.skinType === 'mature' ? 'возрастная' :
                          args.skinType === 'acne_prone' ? 'склонная к акне' :
                          args.skinType === 'dehydrated' ? 'обезвоженная' :
                          'с пигментацией'
                        } кожа.`
                      : '',
                    // Hair type context
                    args.hairType
                      ? `Учитывай, что у пользователя ${
                          args.hairType === 'straight' ? 'прямые' :
                          args.hairType === 'wavy' ? 'волнистые' :
                          args.hairType === 'curly' ? 'кудрявые' :
                          args.hairType === 'coily' ? 'кучерявые' :
                          args.hairType === 'oily' ? 'жирные' :
                          args.hairType === 'dry' ? 'сухие' :
                          args.hairType === 'normal' ? 'нормальные' :
                          'повреждённые'
                        } волосы.`
                      : '',
                    // Age context
                    args.age
                      ? `Возраст пользователя: ${args.age} лет. ${
                          args.age === '18-24' ? 'Молодая кожа, нужна профилактика и легкое увлажнение.' :
                          args.age === '25-34' ? 'Появляются первые признаки старения, важны антиоксиданты.' :
                          args.age === '35-44' ? 'Нужен активный антивозрастной уход, ретиноиды, пептиды.' :
                          args.age === '45-54' ? 'Требуется интенсивный уход, гиалуроновая кислота, укрепление.' :
                          'Зрелая кожа требует насыщенного питания и восстановления.'
                        }`
                      : '',
                    // Lifestyle context
                    args.lifestyle
                      ? `Образ жизни: ${
                          args.lifestyle === 'active' ? 'активный (спорт, потоотделение) - нужны легкие текстуры, защита от пота.' :
                          args.lifestyle === 'sedentary' ? 'сидячий (офис) - кожа может быть обезвоженной от кондиционера.' :
                          args.lifestyle === 'outdoor' ? 'много времени на улице - важна SPF защита и антиоксиданты.' :
                          args.lifestyle === 'stress' ? 'высокий стресс - кожа склонна к воспалениям, нужны успокаивающие компоненты.' :
                          'сбалансированный - стандартный уход.'
                        }`
                      : '',
                    // Location/climate context
                    args.location
                      ? `Локация: ${
                          args.location === 'moscow' ? 'Москва (континентальный климат, средняя влажность, высокое загрязнение воздуха - нужна защита от pollution).' :
                          args.location === 'saint_petersburg' ? 'Санкт-Петербург (высокая влажность, мало солнца, морской климат - нужно увлажнение, витамин D, защита от влажности).' :
                          args.location === 'novosibirsk' ? 'Новосибирск (резко континентальный, сухой воздух, холодные зимы - нужна защита от мороза и интенсивное увлажнение).' :
                          args.location === 'yekaterinburg' ? 'Екатеринбург (континентальный, сухой - нужно глубокое увлажнение).' :
                          args.location === 'kazan' ? 'Казань (умеренный климат, средняя влажность).' :
                          args.location === 'sochi' ? 'Сочи (субтропики, высокая влажность, много солнца - обязательна SPF защита, легкие текстуры).' :
                          args.location === 'vladivostok' ? 'Владивосток (муссонный, влажный - защита от влажности и ветра).' :
                          args.location === 'other_humid' ? 'Влажный климат - легкие текстуры, матирующие средства.' :
                          'Сухой климат - интенсивное увлажнение, защитные кремы.'
                        }`
                      : '',
                    'Верни ТОЛЬКО чистый JSON (без markdown ```json) в формате:',
                    '{brand, name, confidence, category: "skin"|"hair"|"mixed"|"unknown", analysis: {pros: [массив строк], cons: [массив строк], hazards: "low"|"medium"|"high", ingredients: [{name, status: "green"|"yellow"|"red", desc}]}, skinCompatibility: {dry: {status: "good"|"bad"|"neutral", score: 0-100}, oily: {status, score}, combination: {status, score}, normal: {status, score}, sensitive: {status, score}, mature: {status, score}, acne_prone: {status, score}, dehydrated: {status, score}, pigmented: {status, score}}, hairCompatibility: {straight: {status: "good"|"bad"|"neutral", score: 0-100}, wavy: {status, score}, curly: {status, score}, coily: {status, score}, oily: {status, score}, dry: {status, score}, normal: {status, score}, damaged: {status, score}}}.',
                    'Типы кожи: dry (сухая), oily (жирная), combination (комбинированная), normal (нормальная), sensitive (чувствительная), mature (возрастная - нужны ретиноиды, пептиды), acne_prone (склонная к акне - нужны BHA/салициловая кислота, ниацинамид), dehydrated (обезвоженная - нужна гиалуроновая кислота, сквалан), pigmented (с пигментацией - нужны витамин C, арбутин, ниацинамид).',
                    'ВАЖНО: hazards должен быть СТРОКОЙ "low" (низкий риск), "medium" (средний риск) или "high" (высокий риск), НЕ массивом!',
                    'В skinCompatibility (если category = "skin" или "mixed") для каждого типа кожи укажи:',
                    `- status: "good" (хорошо подходит, score >= ${SKIN_COMPATIBILITY_SCORES.GOOD_MIN}), "neutral" (нейтрально, ${SKIN_COMPATIBILITY_SCORES.NEUTRAL_MIN}-${SKIN_COMPATIBILITY_SCORES.GOOD_MIN - 1}), "bad" (не подходит, < ${SKIN_COMPATIBILITY_SCORES.NEUTRAL_MIN})`,
                    '- score: число от 0 до 100, где 100 = идеально подходит, 0 = абсолютно не подходит',
                    'Оценивай на основе состава: ингредиенты, которые подходят для данного типа кожи повышают score, неподходящие - понижают.',
                    'В hairCompatibility (если category = "hair" или "mixed") для каждого типа волос укажи:',
                    `- status: "good" (хорошо подходит, score >= ${HAIR_COMPATIBILITY_SCORES.GOOD_MIN}), "neutral" (нейтрально, ${HAIR_COMPATIBILITY_SCORES.NEUTRAL_MIN}-${HAIR_COMPATIBILITY_SCORES.GOOD_MIN - 1}), "bad" (не подходит, < ${HAIR_COMPATIBILITY_SCORES.NEUTRAL_MIN})`,
                    '- score: число от 0 до 100, где 100 = идеально подходит, 0 = абсолютно не подходит',
                    'Оценивай на основе состава: ингредиенты, которые подходят для данного типа волос повышают score, неподходящие - понижают.',
                    'Если категория продукта "skin", то hairCompatibility может быть пустым объектом или отсутствовать.',
                    'Если категория продукта "hair", то skinCompatibility может быть пустым объектом или отсутствовать.',
                  ].filter(Boolean).join(' '),
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${args.imageBase64}`,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        console.error('OpenRouter HTTP error', await response.text());
        return {
          error: 'Сервис распознавания временно недоступен. Попробуйте ещё раз.',
        };
      }

      const data = await response.json();

      // OpenRouter отвечает в формате chat.completions (как OpenAI).
      const message = data?.choices?.[0]?.message;
      let text: string | unknown = message?.content;

      // content может быть строкой или массивом блоков (text/image_url и т.п.)
      if (Array.isArray(text)) {
        text = text
          .map((part: unknown) => {
            if (typeof part === 'string') return part;
            if (part && typeof part === 'object' && 'text' in part) return part.text;
            if (part && typeof part === 'object' && 'content' in part) return part.content;
            return '';
          })
          .filter(Boolean)
          .join('\n');
      }

      if (!text || typeof text !== 'string') {
        console.error('OpenRouter unexpected response shape', data);
        return {
          error: 'Не удалось распознать продукт. Попробуйте сделать фото крупнее и без бликов.',
        };
      }

      let parsed: unknown;
      try {
        // Иногда модель может вернуть текст с лишними символами вокруг JSON.
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        console.error('OpenRouter JSON parse error', e, text);
        return {
          error: 'ИИ вернул некорректные данные. Попробуйте переснять фото.',
        };
      }

      // Минимальная валидация структуры
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !('brand' in parsed) ||
        !('name' in parsed) ||
        !('confidence' in parsed) ||
        typeof parsed.brand !== 'string' ||
        typeof parsed.name !== 'string' ||
        typeof parsed.confidence !== 'number'
      ) {
        console.error('OpenRouter invalid schema', parsed);
        return {
          error: 'Не удалось уверенно определить продукт. Попробуйте другой ракурс.',
        };
      }

      // Нормализация категории продукта
      const result = parsed as Record<string, unknown>;
      const category = 'category' in result ? result.category : undefined;
      result.category = normalizeCategory(category);

      // Проверка на не-бьюти продукт (защита на случай если quick identification пропустил)
      if (result.category === 'not_beauty') {
        return {
          error: 'На изображении не обнаружен косметический продукт или парфюм. Пожалуйста, сфотографируйте косметику, средство для ухода или парфюм.',
        };
      }

      // Если это парфюм, обрабатываем отдельно
      if (result.category === 'perfume') {
        // Validate and normalize perfume data
        result.perfumeData = validatePerfumeData(result.perfumeData);
        // Remove cosmetic-specific fields
        delete result.analysis;
        delete result.skinCompatibility;
        delete result.hairCompatibility;
        return result;
      }

      // Для косметики требуется analysis
      if (!('analysis' in parsed) || !parsed.analysis) {
        console.error('OpenRouter invalid schema - missing analysis for cosmetics', parsed);
        return {
          error: 'Не удалось уверенно определить продукт. Попробуйте другой ракурс.',
        };
      }

      // Валидация и нормализация analysis
      if (result.analysis && typeof result.analysis === 'object') {
        const analysis = result.analysis as Record<string, unknown>;

        // Валидация pros
        if (!Array.isArray(analysis.pros)) {
          console.warn('AI returned invalid pros, defaulting to empty array');
          analysis.pros = [];
        }

        // Валидация cons
        if (!Array.isArray(analysis.cons)) {
          console.warn('AI returned invalid cons, defaulting to empty array');
          analysis.cons = [];
        }

        // Валидация ingredients
        if (!Array.isArray(analysis.ingredients)) {
          console.warn('AI returned invalid ingredients, defaulting to empty array');
          analysis.ingredients = [];
        } else {
          // Валидация каждого ингредиента
          analysis.ingredients = analysis.ingredients.filter((ing: unknown) => {
            if (!ing || typeof ing !== 'object') return false;
            const ingredient = ing as Record<string, unknown>;
            if (typeof ingredient.name !== 'string') return false;
            if (!['green', 'yellow', 'red'].includes(ingredient.status as string)) return false;
            if (typeof ingredient.desc !== 'string') return false;
            return true;
          });
        }

        // Валидация и нормализация hazards
        if (Array.isArray(analysis.hazards)) {
          console.warn('AI returned hazards as array, normalizing to string');
          // Определяем уровень риска по количеству элементов
          const hazardsCount = analysis.hazards.length;
          if (hazardsCount === 0) {
            analysis.hazards = 'low';
          } else if (hazardsCount >= 3) {
            analysis.hazards = 'high';
          } else {
            analysis.hazards = 'medium';
          }
        } else if (typeof analysis.hazards !== 'string') {
          console.warn('AI returned invalid hazards format, defaulting to medium');
          analysis.hazards = 'medium';
        } else {
          // Валидируем строковое значение
          const validHazards = ['low', 'medium', 'high'];
          if (!validHazards.includes(analysis.hazards)) {
            console.warn('AI returned invalid hazards value:', analysis.hazards);
            analysis.hazards = 'medium';
          }
        }
      }

      // Валидация и нормализация skinCompatibility (только для продуктов для кожи)
      if (result.category === 'skin' || result.category === 'mixed' || result.category === 'unknown') {
        if (!result.skinCompatibility || typeof result.skinCompatibility !== 'object') {
          // Если нет skinCompatibility, создаём нейтральные значения
          const skinCompat: SkinCompatibility = {} as SkinCompatibility;
          for (const type of SKIN_TYPES) {
            skinCompat[type] = {
              status: 'neutral',
              score: DEFAULT_SKIN_COMPATIBILITY_SCORES.neutral,
            };
          }
          result.skinCompatibility = skinCompat;
        } else {
        // Валидируем и нормализуем существующие данные
        const skinCompat = result.skinCompatibility as Record<string, unknown>;
        for (const type of SKIN_TYPES) {
          if (!skinCompat[type] || typeof skinCompat[type] !== 'object') {
            // Старый формат или отсутствует - преобразуем
            const oldValue = skinCompat[type];
            if (typeof oldValue === 'string' && isValidSkinStatus(oldValue)) {
              // Конвертируем старый формат в новый
              skinCompat[type] = {
                status: oldValue,
                score: DEFAULT_SKIN_COMPATIBILITY_SCORES[oldValue],
              };
            } else {
              skinCompat[type] = {
                status: 'neutral',
                score: DEFAULT_SKIN_COMPATIBILITY_SCORES.neutral,
              };
            }
          } else {
            // Новый формат - валидируем
            const itemData = skinCompat[type] as Record<string, unknown>;
            let status = typeof itemData.status === 'string' ? itemData.status : 'neutral';
            if (!isValidSkinStatus(status)) {
              status = 'neutral';
            }
            // Нормализуем score к 0-100
            let score = typeof itemData.score === 'number' ? itemData.score : DEFAULT_SKIN_COMPATIBILITY_SCORES[status as SkinCompatibilityStatus];
            if (isNaN(score)) {
              score = DEFAULT_SKIN_COMPATIBILITY_SCORES[status as SkinCompatibilityStatus];
            } else {
              score = Math.max(0, Math.min(100, Math.round(score)));
            }
            // Синхронизируем status и score
            if (score >= SKIN_COMPATIBILITY_SCORES.GOOD_MIN && status !== 'good') {
              status = 'good';
            } else if (score < SKIN_COMPATIBILITY_SCORES.NEUTRAL_MIN && status !== 'bad') {
              status = 'bad';
            } else if (
              score >= SKIN_COMPATIBILITY_SCORES.NEUTRAL_MIN &&
              score < SKIN_COMPATIBILITY_SCORES.GOOD_MIN &&
              status !== 'neutral'
            ) {
              status = 'neutral';
            }
            skinCompat[type] = { status, score };
          }
        }
        result.skinCompatibility = skinCompat;
      }
      }

      // Валидация и нормализация hairCompatibility (только для продуктов для волос)
      if (result.category === 'hair' || result.category === 'mixed' || result.category === 'unknown') {
        if (!result.hairCompatibility || typeof result.hairCompatibility !== 'object') {
          // Если нет hairCompatibility, создаём нейтральные значения
          const hairCompat: HairCompatibility = {} as HairCompatibility;
          for (const type of HAIR_TYPES) {
            hairCompat[type] = {
              status: 'neutral',
              score: DEFAULT_HAIR_COMPATIBILITY_SCORES.neutral,
            };
          }
          result.hairCompatibility = hairCompat;
        } else {
          // Валидируем и нормализуем существующие данные
          const hairCompat = result.hairCompatibility as Record<string, unknown>;
          for (const type of HAIR_TYPES) {
            if (!hairCompat[type] || typeof hairCompat[type] !== 'object') {
              // Старый формат или отсутствует - преобразуем
              const oldValue = hairCompat[type];
              if (typeof oldValue === 'string' && isValidHairStatus(oldValue)) {
                // Конвертируем старый формат в новый
                hairCompat[type] = {
                  status: oldValue,
                  score: DEFAULT_HAIR_COMPATIBILITY_SCORES[oldValue],
                };
              } else {
                hairCompat[type] = {
                  status: 'neutral',
                  score: DEFAULT_HAIR_COMPATIBILITY_SCORES.neutral,
                };
              }
            } else {
              // Новый формат - валидируем
              const itemData = hairCompat[type] as Record<string, unknown>;
              let status = typeof itemData.status === 'string' ? itemData.status : 'neutral';
              if (!isValidHairStatus(status)) {
                status = 'neutral';
              }
              // Нормализуем score к 0-100
              let score = typeof itemData.score === 'number' ? itemData.score : DEFAULT_HAIR_COMPATIBILITY_SCORES[status as HairCompatibilityStatus];
              if (isNaN(score)) {
                score = DEFAULT_HAIR_COMPATIBILITY_SCORES[status as HairCompatibilityStatus];
              } else {
                score = Math.max(0, Math.min(100, Math.round(score)));
              }
              // Синхронизируем status и score
              if (score >= HAIR_COMPATIBILITY_SCORES.GOOD_MIN && status !== 'good') {
                status = 'good';
              } else if (score < HAIR_COMPATIBILITY_SCORES.NEUTRAL_MIN && status !== 'bad') {
                status = 'bad';
              } else if (
                score >= HAIR_COMPATIBILITY_SCORES.NEUTRAL_MIN &&
                score < HAIR_COMPATIBILITY_SCORES.GOOD_MIN &&
                status !== 'neutral'
              ) {
                status = 'neutral';
              }
              hairCompat[type] = { status, score };
            }
          }
          result.hairCompatibility = hairCompat;
        }
      }

      // Если категория "skin", удаляем hairCompatibility (если есть)
      if (result.category === 'skin' && result.hairCompatibility) {
        delete result.hairCompatibility;
      }

      // Если категория "hair", удаляем skinCompatibility (если есть)
      if (result.category === 'hair' && result.skinCompatibility) {
        delete result.skinCompatibility;
      }

      return result;
    } catch (err) {
      console.error('OpenRouter request failed', err);
      return {
        error: 'Произошла ошибка при обращении к ИИ. Попробуйте снова чуть позже.',
      };
    }
  },
});
