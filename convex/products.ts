import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import { internalMutation, internalQuery, mutation, query } from './_generated/server';
import { SEARCH, VALIDATION } from './constants';

export const saveProduct = internalMutation({
  args: {
    brand: v.string(),
    name: v.string(),
    analysis: v.optional(v.object({
      pros: v.array(v.string()),
      cons: v.array(v.string()),
      hazards: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
      ingredients: v.array(v.object({
        name: v.string(),
        status: v.union(v.literal('green'), v.literal('yellow'), v.literal('red')),
        desc: v.string(),
      })),
    })),
    price: v.string(),
    storageId: v.string(),
    scannedBy: v.optional(v.id('users')),
    category: v.optional(v.union(
      v.literal('skin'),
      v.literal('hair'),
      v.literal('mixed'),
      v.literal('perfume'),
      v.literal('unknown')
    )),
    skinCompatibility: v.optional(v.object({
      dry: v.optional(v.object({ status: v.string(), score: v.number() })),
      oily: v.optional(v.object({ status: v.string(), score: v.number() })),
      combination: v.optional(v.object({ status: v.string(), score: v.number() })),
      normal: v.optional(v.object({ status: v.string(), score: v.number() })),
      sensitive: v.optional(v.object({ status: v.string(), score: v.number() })),
      mature: v.optional(v.object({ status: v.string(), score: v.number() })),
      acne_prone: v.optional(v.object({ status: v.string(), score: v.number() })),
      dehydrated: v.optional(v.object({ status: v.string(), score: v.number() })),
      pigmented: v.optional(v.object({ status: v.string(), score: v.number() })),
    })),
    hairCompatibility: v.optional(v.object({
      straight: v.optional(v.object({ status: v.string(), score: v.number() })),
      wavy: v.optional(v.object({ status: v.string(), score: v.number() })),
      curly: v.optional(v.object({ status: v.string(), score: v.number() })),
      coily: v.optional(v.object({ status: v.string(), score: v.number() })),
      oily: v.optional(v.object({ status: v.string(), score: v.number() })),
      dry: v.optional(v.object({ status: v.string(), score: v.number() })),
      normal: v.optional(v.object({ status: v.string(), score: v.number() })),
      damaged: v.optional(v.object({ status: v.string(), score: v.number() })),
    })),
    barcode: v.optional(v.string()),
    perfumeData: v.optional(v.object({
      notePyramid: v.object({
        top: v.array(v.string()),
        heart: v.array(v.string()),
        base: v.array(v.string()),
      }),
      accords: v.array(v.object({
        name: v.string(),
        strength: v.number(),
      })),
      seasonality: v.object({
        spring: v.number(),
        summer: v.number(),
        fall: v.number(),
        winter: v.number(),
      }),
      timeOfDay: v.object({
        day: v.number(),
        evening: v.number(),
        night: v.number(),
      }),
      longevity: v.object({
        hours: v.number(),
        rating: v.number(),
        description: v.string(),
      }),
      sillage: v.object({
        level: v.union(
          v.literal('intimate'),
          v.literal('moderate'),
          v.literal('strong'),
          v.literal('enormous')
        ),
        rating: v.number(),
      }),
      concentration: v.optional(v.string()),
      gender: v.optional(v.string()),
      releaseYear: v.optional(v.number()),
      perfumer: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('products', {
      brand: args.brand,
      name: args.name,
      ingredientsAnalysis: args.analysis ? JSON.stringify(args.analysis) : '',
      priceEstimate: args.price,
      imageUrl: args.storageId,
      rating: 0,
      description: '',
      pros: args.analysis?.pros || [],
      cons: args.analysis?.cons || [],
      category: args.category || 'unknown',
      barcode: args.barcode,
      scannedBy: args.scannedBy,
      commentsCount: 0,
      skinTypeCompatibility: args.skinCompatibility || undefined,
      hairTypeCompatibility: args.hairCompatibility || undefined,
      perfumeData: args.perfumeData || undefined,
    });
  },
});

// Поиск по штрихкоду — публичный (camera.tsx использует useQuery)
export const findByBarcode = query({
  args: { barcode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('products')
      .withIndex('by_barcode', (q) => q.eq('barcode', args.barcode))
      .first();
  },
});

// Поиск по штрихкоду — internal (для использования в actions)
export const findByBarcodeInternal = internalQuery({
  args: { barcode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('products')
      .withIndex('by_barcode', (q) => q.eq('barcode', args.barcode))
      .first();
  },
});

// Сохранить штрихкод к существующему продукту
export const attachBarcode = mutation({
  args: { productId: v.id('products'), barcode: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.productId, { barcode: args.barcode });
  },
});

// Поиск по точному названию (старая функция, оставляем для совместимости)
export const findByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('products')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .first();
  },
});

// Поиск продукта по brand + name для кэширования (internal query для использования в actions)
// Используется для проверки, был ли продукт уже проанализирован
export const findByBrandAndName = internalQuery({
  args: { 
    brand: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Нормализуем входные данные для поиска (убираем лишние пробелы, приводим к нижнему регистру)
    const searchBrand = args.brand.trim().toLowerCase();
    const searchName = args.name.trim().toLowerCase();

    // Получаем все продукты и ищем совпадения
    // Используем гибкий поиск с учетом различий в написании
    const allProducts = await ctx.db.query('products').collect();
    
    // Сначала пробуем точное совпадение (после нормализации)
    const exactMatch = allProducts.find(p => {
      const pBrand = p.brand.trim().toLowerCase();
      const pName = p.name.trim().toLowerCase();
      return pBrand === searchBrand && pName === searchName;
    });

    if (exactMatch) {
      return exactMatch;
    }

    // Если точного совпадения нет, ищем близкое совпадение
    // Это помогает найти продукты с небольшими вариациями в написании
    const fuzzyMatch = allProducts.find(p => {
      const pBrand = p.brand.trim().toLowerCase();
      const pName = p.name.trim().toLowerCase();
      
      // Проверяем, что оба поля совпадают (с учетом частичных совпадений)
      // Используем более строгую логику: ищем, где одно поле содержит другое
      const brandMatch = pBrand === searchBrand || 
                        (pBrand.length > 3 && searchBrand.length > 3 && 
                         (pBrand.includes(searchBrand) || searchBrand.includes(pBrand)));
      const nameMatch = pName === searchName || 
                       (pName.length > 3 && searchName.length > 3 && 
                        (pName.includes(searchName) || searchName.includes(pName)));
      
      return brandMatch && nameMatch;
    });

    return fuzzyMatch || null;
  },
});

// Поиск продуктов по названию или бренду (частичное совпадение)
// Note: This implementation loads all products. For better scalability,
// consider using full-text search or external search engine (Algolia, Typesense)
export const searchProducts = query({
  args: {
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate and sanitize input
    const trimmedQuery = args.searchQuery.trim();
    if (
      !trimmedQuery ||
      trimmedQuery.length < SEARCH.MIN_QUERY_LENGTH ||
      trimmedQuery.length > VALIDATION.MAX_SEARCH_QUERY_LENGTH
    ) {
      return [];
    }

    const searchQuery = trimmedQuery.toLowerCase();

    // Получаем все продукты и фильтруем
    // TODO: Для большой БД использовать полнотекстовый поиск или внешний движок
    const allProducts = await ctx.db.query('products').collect();

    // Фильтруем по названию или бренду (регистронезависимый поиск)
    const filtered = allProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery) ||
        product.brand.toLowerCase().includes(searchQuery)
    );

    // Сортируем: сначала точные совпадения по названию, потом по бренду
    const sorted = filtered.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().startsWith(searchQuery);
      const bNameMatch = b.name.toLowerCase().startsWith(searchQuery);
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;

      const aBrandMatch = a.brand.toLowerCase().startsWith(searchQuery);
      const bBrandMatch = b.brand.toLowerCase().startsWith(searchQuery);
      if (aBrandMatch && !bBrandMatch) return -1;
      if (!aBrandMatch && bBrandMatch) return 1;

      return a.name.localeCompare(b.name);
    });

    // Возвращаем до MAX_RESULTS результатов
    return sorted.slice(0, SEARCH.MAX_RESULTS);
  },
});

export const getById = query({
  args: { id: v.id('products') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get scan feed for community section (recent scans with user info)
export const getScanFeed = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    // Get all products sorted by creation time
    const products = await ctx.db.query('products').collect();

    // Sort by creation time (newest first) and limit
    const sortedProducts = products
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, limit);

    // Get image URLs and user info for each product
    const productsWithDetails = await Promise.all(
      sortedProducts.map(async (product) => {
        // Get image URL
        const storageId = product.imageUrl as string;
        let imageUrl = product.imageUrl;
        try {
          const url = await ctx.storage.getUrl(storageId);
          if (url) imageUrl = url;
        } catch {
          // Keep original imageUrl if storage fails
        }

        // Get user info if scannedBy exists
        let scannedByUser = null;
        if (product.scannedBy) {
          const user = await ctx.db.get(product.scannedBy);
          if (user) {
            scannedByUser = {
              _id: user._id,
              displayName: user.displayName || 'Пользователь',
              avatarUrl: user.avatarUrl,
            };
          }
        }

        return {
          _id: product._id,
          brand: product.brand,
          name: product.name,
          category: product.category,
          imageUrl,
          commentsCount: product.commentsCount || 0,
          createdAt: product._creationTime,
          scannedBy: scannedByUser,
        };
      })
    );

    return productsWithDetails;
  },
});

// Получить все продукты для истории сканов, отсортированные по дате (новые сверху)
export const getAllProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query('products').collect();

    // Получаем URL-ы для изображений и сортируем по _creationTime (новые сверху)
    const productsWithUrls = await Promise.all(
      products.map(async (product) => {
        const storageId = product.imageUrl as string;
        const imageUrl = await ctx.storage.getUrl(storageId);
        return {
          ...product,
          imageUrl: imageUrl || product.imageUrl, // Fallback на оригинальный URL если не удалось получить
        };
      })
    );

    return productsWithUrls.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// ========================================
// Image Hash Caching Functions
// ========================================

// Find product by image hash (to avoid duplicate AI calls)
export const findByImageHash = internalQuery({
  args: { hash: v.string() },
  handler: async (ctx, args) => {
    const hashEntry = await ctx.db
      .query('imageHashes')
      .withIndex('by_hash', (q) => q.eq('hash', args.hash))
      .first();

    if (!hashEntry) {
      return null;
    }

    // Get the associated product
    const product = await ctx.db.get(hashEntry.productId);
    return product;
  },
});

// Save image hash to product mapping
export const saveImageHash = internalMutation({
  args: {
    hash: v.string(),
    productId: v.id('products'),
  },
  handler: async (ctx, args) => {
    // Check if hash already exists
    const existing = await ctx.db
      .query('imageHashes')
      .withIndex('by_hash', (q) => q.eq('hash', args.hash))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new hash entry
    return await ctx.db.insert('imageHashes', {
      hash: args.hash,
      productId: args.productId,
      createdAt: Date.now(),
    });
  },
});

// Get product by ID (internal version for use in actions)
export const getProductById = internalQuery({
  args: { id: v.id('products') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
