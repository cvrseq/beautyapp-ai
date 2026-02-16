import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Таблица для хранения кэшированных результатов анализа
  products: defineTable({
    brand: v.string(),
    name: v.string(),
    description: v.string(),
    rating: v.float64(),
    pros: v.array(v.string()),
    cons: v.array(v.string()),
    ingredientsAnalysis: v.string(),
    priceEstimate: v.string(),
    imageUrl: v.string(), // Ссылка на фото в хранилище Convex
    category: v.optional(v.union(
      v.literal('skin'),
      v.literal('hair'),
      v.literal('mixed'),
      v.literal('unknown')
    )),
    skinTypeCompatibility: v.optional(v.object({
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
    hairTypeCompatibility: v.optional(v.object({
      straight: v.optional(v.object({ status: v.string(), score: v.number() })),
      wavy: v.optional(v.object({ status: v.string(), score: v.number() })),
      curly: v.optional(v.object({ status: v.string(), score: v.number() })),
      coily: v.optional(v.object({ status: v.string(), score: v.number() })),
      oily: v.optional(v.object({ status: v.string(), score: v.number() })),
      dry: v.optional(v.object({ status: v.string(), score: v.number() })),
      normal: v.optional(v.object({ status: v.string(), score: v.number() })),
      damaged: v.optional(v.object({ status: v.string(), score: v.number() })),
    }))
  })
    .index('by_name', ['name']) // Индекс для быстрого поиска по названию
    .index('by_brand', ['brand']) // Индекс для поиска по бренду
    .index('by_brand_name', ['brand', 'name']), // Составной индекс для поиска по brand + name (кэширование)
});
