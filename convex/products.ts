import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';
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
