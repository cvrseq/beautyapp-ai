import { v } from 'convex/values';
import { internalMutation, internalQuery, query } from './_generated/server';
import { SEARCH, VALIDATION } from './constants';

export const saveProduct = internalMutation({
  args: {
    brand: v.string(),
    name: v.string(),
    analysis: v.any(), // или опиши структуру подробнее
    price: v.string(),
    storageId: v.string(),
    category: v.optional(v.union(
      v.literal('skin'),
      v.literal('hair'),
      v.literal('mixed'),
      v.literal('unknown')
    )),
    skinCompatibility: v.optional(v.any()),
    hairCompatibility: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('products', {
      brand: args.brand,
      name: args.name,
      ingredientsAnalysis: JSON.stringify(args.analysis), // сохраняем как строку для простоты
      priceEstimate: args.price,
      imageUrl: args.storageId,
      rating: 0, // можно вычислять на основе анализа
      description: '',
      pros: args.analysis.pros || [],
      cons: args.analysis.cons || [],
      category: args.category || 'unknown',
      skinTypeCompatibility: args.skinCompatibility || undefined,
      hairTypeCompatibility: args.hairCompatibility || undefined,
    });
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

// Получить все продукты для истории сканов, отсортированные по дате (новые сверху)
export const getAllProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query('products').collect();
    
    // Получаем URL-ы для изображений и сортируем по _creationTime (новые сверху)
    const productsWithUrls = await Promise.all(
      products.map(async (product) => {
        const imageUrl = await ctx.storage.getUrl(product.imageUrl as any);
        return {
          ...product,
          imageUrl: imageUrl || product.imageUrl, // Fallback на оригинальный URL если не удалось получить
        };
      })
    );
    
    return productsWithUrls.sort((a, b) => b._creationTime - a._creationTime);
  },
});
