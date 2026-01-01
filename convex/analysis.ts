import { v } from 'convex/values';
import { internal } from './_generated/api';
import { action } from './_generated/server';
import { type ProductAnalysisResult, type CosmeticAnalysis } from './types';
import { CONFIDENCE_THRESHOLD, API_CONFIG } from './constants';

interface ProductResult {
  productId?: string;
  brand?: string;
  name?: string;
  analysis?: CosmeticAnalysis;
  price?: string;
  error?: string;
}

export const analyzeProduct = action({
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
  handler: async (ctx, args): Promise<ProductResult> => {
    // 1. Распознавание через ИИ
    const aiResult = await ctx.runAction(internal.ai_logic.identifyProduct, {
      imageBase64: args.imageBase64,
      skinType: args.skinType,
    });

    if (!aiResult || aiResult.error) {
      return {
        error:
          aiResult?.error ||
          'Не удалось распознать продукт. Попробуйте сделать фото ещё раз.',
      };
    }

    if (typeof aiResult.confidence !== 'number' || aiResult.confidence < CONFIDENCE_THRESHOLD) {
      return {
        error: 'Не удалось четко распознать продукт. Попробуйте переснять фото.',
      };
    }

    const productInfo = aiResult;

    // 2. Реальная логика Tavily (Добавляем поиск цен)
    let searchPrice = 'Уточняется';
    try {
      const searchResponse = await fetch(API_CONFIG.TAVILY_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: `цена на косметику ${productInfo.brand} ${productInfo.name} в рублях 2025`,
          search_depth: 'basic',
          include_answer: true,
        }),
      });
      const searchData = await searchResponse.json();
      searchPrice = searchData.answer || 'Не найдено';
    } catch (e) {
      console.error('Tavily error:', e);
      // тихо падаем на дефолтное "Уточняется"
    }

    // 3. Конвертация base64 в Blob (Convex-way)
    // Используем стандартный подход для браузерных сред/Edge
    const binary = atob(args.imageBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const storageId = await ctx.storage.store(
      new Blob([bytes], { type: 'image/jpeg' })
    );

    // 4. Сохранение в БД
    const productId: string = await ctx.runMutation(
      internal.products.saveProduct,
      {
        brand: productInfo.brand,
        name: productInfo.name,
        analysis: productInfo.analysis,
        price: searchPrice,
        storageId: storageId,
        skinCompatibility: productInfo.skinCompatibility,
      }
    );

    return {
      productId,
      brand: productInfo.brand,
      name: productInfo.name,
      analysis: productInfo.analysis,
      price: searchPrice,
    };
  },
});
