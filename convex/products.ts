import { v } from 'convex/values';
// convex/products.ts
import { internalMutation, query } from './_generated/server';

export const saveProduct = internalMutation({
  args: {
    brand: v.string(),
    name: v.string(),
    analysis: v.any(), // или опиши структуру подробнее
    price: v.string(),
    storageId: v.string(),
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
    });
  },
});

// Добавим сразу поиск для текстового ввода
export const findByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('products')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .first();
  },
});

// Не забудь импортировать query в начале файла
export const getById = query({
  args: { id: v.id('products') }, // или v.string() если у тебя были проблемы с типами
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
