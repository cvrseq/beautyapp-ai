import { v } from 'convex/values';
import { internal } from './_generated/api';
import { action } from './_generated/server';
import { API_CONFIG, CONFIDENCE_THRESHOLD } from './constants';
import { type CosmeticAnalysis, type ProductCategory } from './types';

type ProductResult =
  | { error: string }
  | {
      productId: string;
      brand: string;
      name: string;
      analysis: CosmeticAnalysis;
      price: string;
    };

export const analyzeProduct = action({
  args: { 
    imageBase64: v.string(),
    skinType: v.optional(v.union(
      v.literal('dry'),
      v.literal('oily'),
      v.literal('combination'),
      v.literal('normal'),
      v.literal('sensitive')
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
    ))
  },
  handler: async (ctx, args): Promise<ProductResult> => {
    // 1. Распознавание через ИИ
    const aiResult = await ctx.runAction(internal.ai_logic.identifyProduct, {
      imageBase64: args.imageBase64,
      skinType: args.skinType,
      hairType: args.hairType,
    });

    // Type guard для aiResult
    if (!aiResult || typeof aiResult !== 'object' || 'error' in aiResult) {
      return {
        error:
          (aiResult && typeof aiResult === 'object' && 'error' in aiResult && typeof aiResult.error === 'string')
            ? aiResult.error
            : 'Не удалось распознать продукт. Попробуйте сделать фото ещё раз.',
      };
    }

    // Валидация структуры aiResult
    if (
      !('brand' in aiResult) || typeof aiResult.brand !== 'string' ||
      !('name' in aiResult) || typeof aiResult.name !== 'string' ||
      !('confidence' in aiResult) || typeof aiResult.confidence !== 'number' ||
      !('analysis' in aiResult)
    ) {
      return {
        error: 'Некорректный ответ от ИИ. Попробуйте ещё раз.',
      };
    }

    if (aiResult.confidence < CONFIDENCE_THRESHOLD) {
      return {
        error: 'Не удалось четко распознать продукт. Попробуйте переснять фото.',
      };
    }

    const productInfo = aiResult as {
      brand: string;
      name: string;
      confidence: number;
      analysis: CosmeticAnalysis;
      category?: ProductCategory;
      skinCompatibility?: unknown;
      hairCompatibility?: unknown;
    };

    // 2. Проверка кэша: ищем существующий продукт по brand + name
    const existingProduct = await ctx.runQuery(internal.products.findByBrandAndName, {
      brand: productInfo.brand,
      name: productInfo.name,
    });

    // Если продукт найден в кэше, возвращаем его ID без повторного анализа
    if (existingProduct) {
      let analysis: CosmeticAnalysis;
      try {
        analysis = typeof existingProduct.ingredientsAnalysis === 'string'
          ? JSON.parse(existingProduct.ingredientsAnalysis) as CosmeticAnalysis
          : existingProduct.ingredientsAnalysis as CosmeticAnalysis;
      } catch (e) {
        console.error('Failed to parse cached analysis', e);
        return { error: 'Ошибка загрузки данных из кэша. Попробуйте ещё раз.' };
      }

      return {
        productId: existingProduct._id,
        brand: existingProduct.brand,
        name: existingProduct.name,
        analysis,
        price: existingProduct.priceEstimate,
      };
    }

    // 3. Реальная логика Tavily (Добавляем поиск цен) - только если продукт не найден в кэше
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

    // 4. Конвертация base64 в Blob (Convex-way)
    // Используем стандартный подход для браузерных сред/Edge
    const binary = atob(args.imageBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const storageId = await ctx.storage.store(
      new Blob([bytes], { type: 'image/jpeg' })
    );

    // 5. Сохранение в БД (кэширование для будущих запросов)
    const productId: string = await ctx.runMutation(
      internal.products.saveProduct,
      {
        brand: productInfo.brand,
        name: productInfo.name,
        analysis: productInfo.analysis,
        price: searchPrice,
        storageId: storageId,
        category: productInfo.category || 'unknown',
        skinCompatibility: productInfo.skinCompatibility as Record<string, { status: string; score: number }> | undefined,
        hairCompatibility: productInfo.hairCompatibility as Record<string, { status: string; score: number }> | undefined,
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
