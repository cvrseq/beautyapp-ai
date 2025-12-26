import { v } from 'convex/values';
// convex/ai_logic.ts
import { internalAction } from './_generated/server';

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
      // Используем OpenRouter с бесплатной моделью Meta Llama Vision.
      const model = 'openai/gpt-4o-mini';

      const response = await fetch('https://api.vsegpt.ru/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`, // Ключ OpenRouter
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://beauty-ai.app',
          'X-Title': 'Beauty AI',
        },
        body: JSON.stringify({
          model,
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
                    '- status: "good" (хорошо подходит, score >= 70), "neutral" (нейтрально, 40-69), "bad" (не подходит, < 40)',
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
      const validTypes = ['dry', 'oily', 'combination', 'normal', 'sensitive'];
      const validStatuses = ['good', 'bad', 'neutral'];
      
      if (!parsed.skinCompatibility) {
        // Если нет skinCompatibility, создаём нейтральные значения
        parsed.skinCompatibility = {};
        for (const type of validTypes) {
          parsed.skinCompatibility[type] = { status: 'neutral', score: 50 };
        }
      } else {
        // Валидируем и нормализуем существующие данные
        for (const type of validTypes) {
          if (!parsed.skinCompatibility[type] || typeof parsed.skinCompatibility[type] !== 'object') {
            // Старый формат или отсутствует - преобразуем
            const oldValue = parsed.skinCompatibility[type];
            if (typeof oldValue === 'string' && validStatuses.includes(oldValue)) {
              // Конвертируем старый формат в новый
              parsed.skinCompatibility[type] = {
                status: oldValue,
                score: oldValue === 'good' ? 75 : oldValue === 'bad' ? 25 : 50,
              };
            } else {
              parsed.skinCompatibility[type] = { status: 'neutral', score: 50 };
            }
          } else {
            // Новый формат - валидируем
            const item = parsed.skinCompatibility[type];
            if (!validStatuses.includes(item.status)) {
              item.status = 'neutral';
            }
            // Нормализуем score к 0-100
            if (typeof item.score !== 'number' || isNaN(item.score)) {
              item.score = item.status === 'good' ? 75 : item.status === 'bad' ? 25 : 50;
            } else {
              item.score = Math.max(0, Math.min(100, Math.round(item.score)));
            }
            // Синхронизируем status и score
            if (item.score >= 70 && item.status !== 'good') {
              item.status = 'good';
            } else if (item.score < 40 && item.status !== 'bad') {
              item.status = 'bad';
            } else if (item.score >= 40 && item.score < 70 && item.status !== 'neutral') {
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
