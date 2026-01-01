import { v } from 'convex/values';
import { internalAction } from './_generated/server';
import { API_CONFIG, DEFAULT_SKIN_COMPATIBILITY_SCORES, SKIN_COMPATIBILITY_SCORES, VALIDATION } from './constants';
import {
    SKIN_COMPATIBILITY_STATUSES,
    SKIN_TYPES,
    type SkinCompatibility,
    type SkinCompatibilityItem,
    type SkinCompatibilityStatus,
} from './types';

// Helper function to check if string is a valid status
function isValidStatus(value: string): value is SkinCompatibilityStatus {
  return SKIN_COMPATIBILITY_STATUSES.includes(value as SkinCompatibilityStatus);
}

export const identifyProduct = internalAction({
  args: { 
    imageBase64: v.string(),
    skinType: v.optional(v.union(
      v.literal('dry'),
      v.literal('oily'),
      v.literal('combination'),
      v.literal('normal'),
      v.literal('sensitive')
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
                    'Ты — эксперт косметики.',
                    'Определи бренд, название и проанализируй состав.',
                    args.skinType 
                      ? `Учитывай, что у пользователя ${args.skinType === 'dry' ? 'сухая' : args.skinType === 'oily' ? 'жирная' : args.skinType === 'combination' ? 'комбинированная' : args.skinType === 'normal' ? 'нормальная' : 'чувствительная'} кожа.`
                      : '',
                    'Верни ТОЛЬКО чистый JSON (без markdown ```json) в формате:',
                    '{brand, name, confidence, analysis: {pros, cons, hazards, ingredients: [{name, status, desc}]}, skinCompatibility: {dry: {status: "good"|"bad"|"neutral", score: число от 0 до 100}, oily: {status, score}, combination: {status, score}, normal: {status, score}, sensitive: {status, score}}}.',
                    'В skinCompatibility для каждого типа кожи укажи:',
                    `- status: "good" (хорошо подходит, score >= ${SKIN_COMPATIBILITY_SCORES.GOOD_MIN}), "neutral" (нейтрально, ${SKIN_COMPATIBILITY_SCORES.NEUTRAL_MIN}-${SKIN_COMPATIBILITY_SCORES.GOOD_MIN - 1}), "bad" (не подходит, < ${SKIN_COMPATIBILITY_SCORES.NEUTRAL_MIN})`,
                    '- score: число от 0 до 100, где 100 = идеально подходит, 0 = абсолютно не подходит',
                    'Оценивай на основе состава: ингредиенты, которые подходят для данного типа кожи повышают score, неподходящие - понижают.',
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
      let text: any = message?.content;

      // content может быть строкой или массивом блоков (text/image_url и т.п.)
      if (Array.isArray(text)) {
        text = text
          .map((part: any) => {
            if (typeof part === 'string') return part;
            if (part?.text) return part.text;
            if (part?.content) return part.content;
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

      let parsed: any;
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
        typeof parsed.brand !== 'string' ||
        typeof parsed.name !== 'string' ||
        typeof parsed.confidence !== 'number' ||
        !parsed.analysis
      ) {
        console.error('OpenRouter invalid schema', parsed);
        return {
          error: 'Не удалось уверенно определить продукт. Попробуйте другой ракурс.',
        };
      }

      // Валидация и нормализация skinCompatibility
      if (!parsed.skinCompatibility) {
        // Если нет skinCompatibility, создаём нейтральные значения
        parsed.skinCompatibility = {} as SkinCompatibility;
        for (const type of SKIN_TYPES) {
          parsed.skinCompatibility[type] = {
            status: 'neutral',
            score: DEFAULT_SKIN_COMPATIBILITY_SCORES.neutral,
          };
        }
      } else {
        // Валидируем и нормализуем существующие данные
        for (const type of SKIN_TYPES) {
          if (!parsed.skinCompatibility[type] || typeof parsed.skinCompatibility[type] !== 'object') {
            // Старый формат или отсутствует - преобразуем
            const oldValue = parsed.skinCompatibility[type];
            if (typeof oldValue === 'string' && isValidStatus(oldValue)) {
              // Конвертируем старый формат в новый
              parsed.skinCompatibility[type] = {
                status: oldValue,
                score: DEFAULT_SKIN_COMPATIBILITY_SCORES[oldValue],
              };
            } else {
              parsed.skinCompatibility[type] = {
                status: 'neutral',
                score: DEFAULT_SKIN_COMPATIBILITY_SCORES.neutral,
              };
            }
          } else {
            // Новый формат - валидируем
            const item = parsed.skinCompatibility[type] as SkinCompatibilityItem;
            if (!isValidStatus(item.status)) {
              item.status = 'neutral';
            }
            // Нормализуем score к 0-100
            if (typeof item.score !== 'number' || isNaN(item.score)) {
              item.score = DEFAULT_SKIN_COMPATIBILITY_SCORES[item.status];
            } else {
              item.score = Math.max(0, Math.min(100, Math.round(item.score)));
            }
            // Синхронизируем status и score
            if (item.score >= SKIN_COMPATIBILITY_SCORES.GOOD_MIN && item.status !== 'good') {
              item.status = 'good';
            } else if (item.score < SKIN_COMPATIBILITY_SCORES.NEUTRAL_MIN && item.status !== 'bad') {
              item.status = 'bad';
            } else if (
              item.score >= SKIN_COMPATIBILITY_SCORES.NEUTRAL_MIN &&
              item.score < SKIN_COMPATIBILITY_SCORES.GOOD_MIN &&
              item.status !== 'neutral'
            ) {
              item.status = 'neutral';
            }
          }
        }
      }

      return parsed;
    } catch (err) {
      console.error('OpenRouter request failed', err);
      return {
        error: 'Произошла ошибка при обращении к ИИ. Попробуйте снова чуть позже.',
      };
    }
  },
});
