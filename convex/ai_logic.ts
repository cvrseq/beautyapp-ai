import { v } from 'convex/values';
// convex/ai_logic.ts
import { internalAction } from './_generated/server';

export const identifyProduct = internalAction({
  args: { imageBase64: v.string() },
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
                    'Верни ТОЛЬКО чистый JSON (без markdown ```json) в формате:',
                    '{brand, name, confidence, analysis: {pros, cons, hazards, ingredients: [{name, status, desc}]}}.',
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

      return parsed;
    } catch (err) {
      console.error('OpenRouter request failed', err);
      return {
        error: 'Произошла ошибка при обращении к ИИ. Попробуйте снова чуть позже.',
      };
    }
  },
});
