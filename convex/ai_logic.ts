import { v } from 'convex/values';
// convex/ai_logic.ts
import { internalAction } from './_generated/server';

export const identifyProduct = internalAction({
  args: { imageBase64: v.string() },
  handler: async (ctx, args) => {
    const API_KEY = process.env.GEMINI_API_KEY;

    // Запрос к Gemini Flash (как мы писали ранее)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Ты — эксперт косметики. Определи бренд, название и проанализируй состав. Верни JSON: {brand, name, confidence, analysis: {pros, cons, hazards}}.',
                },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: args.imageBase64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    // Добавь здесь обработку текста, чтобы вырезать только JSON (иногда ИИ пишет лишнее)
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text);
  },
});
