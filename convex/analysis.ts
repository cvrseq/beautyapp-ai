import { v } from 'convex/values';
import { internal } from './_generated/api';
import { action } from './_generated/server';
import { API_CONFIG, CONFIDENCE_THRESHOLD } from './constants';
import { type CosmeticAnalysis, type ProductCategory, type PerfumeData } from './types';

type ProductResult =
  | { error: string }
  | {
      productId: string;
      brand: string;
      name: string;
      analysis?: CosmeticAnalysis;
      perfumeData?: PerfumeData;
      price: string;
      category?: ProductCategory;
      fromCache?: boolean; // Flag indicating if result came from cache
    };

// Simple hash function for image caching
// Uses a combination of length and sampling to create a fast hash
function generateImageHash(base64: string): string {
  // Take samples from the image to create a fingerprint
  const length = base64.length;
  let hash = length.toString(36);

  // Sample at fixed intervals
  const sampleSize = 100;
  const step = Math.floor(length / sampleSize);

  for (let i = 0; i < sampleSize && i * step < length; i++) {
    const charCode = base64.charCodeAt(i * step);
    hash += charCode.toString(36);
  }

  // Add start and end samples for uniqueness
  hash += base64.substring(0, 50);
  hash += base64.substring(length - 50);

  return hash;
}

export const analyzeProduct = action({
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
  handler: async (ctx, args): Promise<ProductResult> => {
    // ========================================
    // PHASE 0: Check image hash cache
    // If we've seen this exact image before, return cached result immediately
    // ========================================
    const imageHash = generateImageHash(args.imageBase64);

    const cachedByHash = await ctx.runQuery(internal.products.findByImageHash, {
      hash: imageHash,
    });

    if (cachedByHash) {
      console.log('Cache hit: Image hash found, returning cached product');

      // Return cached product based on category
      if (cachedByHash.category === 'perfume' && cachedByHash.perfumeData) {
        return {
          productId: cachedByHash._id,
          brand: cachedByHash.brand,
          name: cachedByHash.name,
          perfumeData: cachedByHash.perfumeData as PerfumeData,
          price: cachedByHash.priceEstimate,
          category: 'perfume',
          fromCache: true,
        };
      }

      // Cosmetics
      let analysis: CosmeticAnalysis;
      try {
        analysis = typeof cachedByHash.ingredientsAnalysis === 'string'
          ? JSON.parse(cachedByHash.ingredientsAnalysis) as CosmeticAnalysis
          : cachedByHash.ingredientsAnalysis as CosmeticAnalysis;
      } catch (e) {
        console.error('Failed to parse cached analysis from hash lookup', e);
        // Continue to Phase 1 if parsing fails
      }

      if (analysis!) {
        return {
          productId: cachedByHash._id,
          brand: cachedByHash.brand,
          name: cachedByHash.name,
          analysis,
          price: cachedByHash.priceEstimate,
          category: cachedByHash.category as ProductCategory,
          fromCache: true,
        };
      }
    }

    // ========================================
    // PHASE 1: Quick identification (brand + name only)
    // Lightweight AI call to check cache before full analysis
    // ========================================
    const quickResult = await ctx.runAction(internal.ai_logic.quickIdentifyProduct, {
      imageBase64: args.imageBase64,
    });

    // If quick identification succeeded, check product cache
    if (quickResult && typeof quickResult === 'object' && !('error' in quickResult)) {
      const { brand, name, confidence, category } = quickResult as {
        brand: string;
        name: string;
        confidence: number;
        category: ProductCategory;
      };

      // ========================================
      // NOT BEAUTY CHECK: Reject non-beauty products early
      // This saves tokens by not running full analysis
      // ========================================
      if (category === 'not_beauty') {
        console.log('Not a beauty product detected, rejecting early');
        return {
          error: 'На изображении не обнаружен косметический продукт или парфюм. Пожалуйста, сфотографируйте косметику, средство для ухода или парфюм.',
        };
      }

      if (confidence >= CONFIDENCE_THRESHOLD) {
        // Check if product exists in cache by brand + name
        const existingProduct = await ctx.runQuery(internal.products.findByBrandAndName, {
          brand,
          name,
        });

        if (existingProduct) {
          console.log('Cache hit: Product found by brand+name after quick identification');

          // Save image hash for future lookups
          await ctx.runMutation(internal.products.saveImageHash, {
            hash: imageHash,
            productId: existingProduct._id,
          });

          // Return cached product
          if (existingProduct.category === 'perfume' && existingProduct.perfumeData) {
            return {
              productId: existingProduct._id,
              brand: existingProduct.brand,
              name: existingProduct.name,
              perfumeData: existingProduct.perfumeData as PerfumeData,
              price: existingProduct.priceEstimate,
              category: 'perfume',
              fromCache: true,
            };
          }

          // Cosmetics
          let analysis: CosmeticAnalysis;
          try {
            analysis = typeof existingProduct.ingredientsAnalysis === 'string'
              ? JSON.parse(existingProduct.ingredientsAnalysis) as CosmeticAnalysis
              : existingProduct.ingredientsAnalysis as CosmeticAnalysis;
          } catch (e) {
            console.error('Failed to parse cached analysis', e);
            // Continue to full analysis if parsing fails
          }

          if (analysis!) {
            return {
              productId: existingProduct._id,
              brand: existingProduct.brand,
              name: existingProduct.name,
              analysis,
              price: existingProduct.priceEstimate,
              category: existingProduct.category as ProductCategory,
              fromCache: true,
            };
          }
        }
      }
    }

    // ========================================
    // PHASE 2: Full AI analysis
    // Product not in cache, need complete analysis
    // ========================================
    console.log('Cache miss: Running full AI analysis');

    const aiResult = await ctx.runAction(internal.ai_logic.identifyProduct, {
      imageBase64: args.imageBase64,
      skinType: args.skinType,
      hairType: args.hairType,
      age: args.age,
      lifestyle: args.lifestyle,
      location: args.location,
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
      !('confidence' in aiResult) || typeof aiResult.confidence !== 'number'
    ) {
      return {
        error: 'Некорректный ответ от ИИ. Попробуйте ещё раз.',
      };
    }

    // Check category to determine if it's perfume or cosmetics
    const category = ('category' in aiResult ? aiResult.category : 'unknown') as ProductCategory;
    const isPerfume = category === 'perfume';

    // For cosmetics, analysis is required; for perfume, perfumeData is required
    if (!isPerfume && !('analysis' in aiResult)) {
      return {
        error: 'Некорректный ответ от ИИ. Попробуйте ещё раз.',
      };
    }
    if (isPerfume && !('perfumeData' in aiResult)) {
      return {
        error: 'Некорректный ответ от ИИ для парфюма. Попробуйте ещё раз.',
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
      analysis?: CosmeticAnalysis;
      perfumeData?: PerfumeData;
      category?: ProductCategory;
      skinCompatibility?: unknown;
      hairCompatibility?: unknown;
    };

    // ========================================
    // PHASE 3: Final cache check before saving
    // Double-check cache after full analysis (in case quick ID missed a match)
    // ========================================
    const existingProduct = await ctx.runQuery(internal.products.findByBrandAndName, {
      brand: productInfo.brand,
      name: productInfo.name,
    });

    // Если продукт найден в кэше, сохраняем хеш и возвращаем результат
    if (existingProduct) {
      console.log('Cache hit: Product found after full analysis');

      // Save image hash for future lookups
      await ctx.runMutation(internal.products.saveImageHash, {
        hash: imageHash,
        productId: existingProduct._id,
      });

      // Check if it's a perfume
      if (existingProduct.category === 'perfume' && existingProduct.perfumeData) {
        return {
          productId: existingProduct._id,
          brand: existingProduct.brand,
          name: existingProduct.name,
          perfumeData: existingProduct.perfumeData as PerfumeData,
          price: existingProduct.priceEstimate,
          category: 'perfume',
          fromCache: true,
        };
      }

      // It's cosmetics
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
        category: existingProduct.category as ProductCategory,
        fromCache: true,
      };
    }

    // ========================================
    // PHASE 4: Save new product
    // Product not in cache, save with price lookup
    // ========================================

    // 4a. Поиск цен через Tavily
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

    // 4b. Конвертация base64 в Blob и сохранение в storage
    const binary = atob(args.imageBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const storageId = await ctx.storage.store(
      new Blob([bytes], { type: 'image/jpeg' })
    );

    // 4c. Сохранение продукта в БД
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
        perfumeData: productInfo.perfumeData as PerfumeData | undefined,
      }
    );

    // 4d. Сохранение хеша изображения для будущих запросов
    await ctx.runMutation(internal.products.saveImageHash, {
      hash: imageHash,
      productId: productId as unknown as import('./_generated/dataModel').Id<'products'>,
    });

    console.log('New product saved with image hash');

    // Return appropriate response based on product type
    if (isPerfume && productInfo.perfumeData) {
      return {
        productId,
        brand: productInfo.brand,
        name: productInfo.name,
        perfumeData: productInfo.perfumeData,
        price: searchPrice,
        category: 'perfume',
        fromCache: false,
      };
    }

    return {
      productId,
      brand: productInfo.brand,
      name: productInfo.name,
      analysis: productInfo.analysis,
      price: searchPrice,
      category: productInfo.category,
      fromCache: false,
    };
  },
});
