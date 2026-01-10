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
    skinTypeCompatibility: v.optional(v.any()), // Временно any для миграции старых данных
    hairTypeCompatibility: v.optional(v.any()), // Совместимость с типом волос
  })
    .index('by_name', ['name']) // Индекс для быстрого поиска по названию
    .index('by_brand', ['brand']), // Индекс для поиска по бренду
});
