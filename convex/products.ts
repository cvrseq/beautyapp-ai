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
    skinCompatibility: v.optional(v.object({
      dry: v.object({
        status: v.string(),
        score: v.number(),
      }),
      oily: v.object({
        status: v.string(),
        score: v.number(),
      }),
      combination: v.object({
        status: v.string(),
        score: v.number(),
      }),
      normal: v.object({
        status: v.string(),
        score: v.number(),
      }),
      sensitive: v.object({
        status: v.string(),
        score: v.number(),
      }),
    })),
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
      skinTypeCompatibility: args.skinCompatibility || undefined,
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
export const searchProducts = query({
  args: { searchQuery: v.string() },
  handler: async (ctx, args) => {
    const searchQuery = args.searchQuery.trim().toLowerCase();
    if (!searchQuery || searchQuery.length < 2) return [];

    // Получаем все продукты и фильтруем на клиенте
    // Для небольшой базы это эффективно, для большой можно использовать полнотекстовый поиск
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

    // Возвращаем до 20 результатов
    return sorted.slice(0, 20);
  },
});

// Не забудь импортировать query в начале файла
export const getById = query({
  args: { id: v.id('products') }, // или v.string() если у тебя были проблемы с типами
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) return null;

    // Миграция на лету: преобразуем старый формат в новый при чтении
    if (product.skinTypeCompatibility) {
      const compatibility = product.skinTypeCompatibility as any;
      const needsMigration = Object.values(compatibility).some(
        (val: any) => typeof val === 'string'
      );

      if (needsMigration) {
        const validTypes = ['dry', 'oily', 'combination', 'normal', 'sensitive'];
        const newCompatibility: any = {};

        for (const type of validTypes) {
          const oldValue = compatibility[type];
          if (typeof oldValue === 'string') {
            const status = oldValue;
            const score = status === 'good' ? 75 : status === 'bad' ? 25 : 50;
            newCompatibility[type] = { status, score };
            
            // Сохраняем миграцию обратно в БД асинхронно (не блокируем ответ)
            // Можно запустить миграцию через action
          } else if (oldValue && typeof oldValue === 'object') {
            newCompatibility[type] = oldValue;
          } else {
            newCompatibility[type] = { status: 'neutral', score: 50 };
          }
        }

        // Возвращаем мигрированные данные
        return {
          ...product,
          skinTypeCompatibility: newCompatibility,
        };
      }
    }

    return product;
  },
});
