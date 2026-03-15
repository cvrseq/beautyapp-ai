import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Таблица для кеширования по хешу изображения
  // Позволяет избежать повторных вызовов AI для идентичных изображений
  imageHashes: defineTable({
    hash: v.string(),           // SHA-256 хеш base64 изображения
    productId: v.id('products'), // Связь с продуктом
    createdAt: v.number(),
  })
    .index('by_hash', ['hash']),

  // Таблица пользователей
  users: defineTable({
    authType: v.union(v.literal('anonymous'), v.literal('registered')),
    email: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    deviceId: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
    profile: v.optional(v.object({
      skinType: v.optional(v.string()),
      hairType: v.optional(v.string()),
      age: v.optional(v.string()),
      lifestyle: v.optional(v.string()),
      location: v.optional(v.string()),
    })),
    createdAt: v.number(),
    lastActiveAt: v.number(),
  })
    .index('by_email', ['email'])
    .index('by_deviceId', ['deviceId'])
    .index('by_sessionToken', ['sessionToken']),

  // Таблица комментариев
  comments: defineTable({
    productId: v.id('products'),
    userId: v.id('users'),
    text: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    isDeleted: v.optional(v.boolean()),
  })
    .index('by_product', ['productId'])
    .index('by_user', ['userId'])
    .index('by_product_user', ['productId', 'userId']),

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
    imageUrl: v.string(),
    // Who scanned the product
    scannedBy: v.optional(v.id('users')),
    commentsCount: v.optional(v.number()),
    // Category now includes perfume
    category: v.optional(v.union(
      v.literal('skin'),
      v.literal('hair'),
      v.literal('mixed'),
      v.literal('perfume'),
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
    })),
    // Perfume-specific data
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
  })
    .index('by_name', ['name'])
    .index('by_brand', ['brand'])
    .index('by_brand_name', ['brand', 'name'])
    .index('by_scannedBy', ['scannedBy']),
});
