# Архитектура сканирования продуктов

## Цель
Минимизировать обращения к облачному AI API за счёт:
1. On-device OCR (Google ML Kit) — бесплатно
2. Локального кэша с fuzzy text search
3. Индекса популярности продуктов (popularityIndex)
4. Barcode-сканера как альтернативы

---

## Ключевые параметры

| Параметр | Значение | Описание |
|----------|----------|----------|
| `POPULARITY_THRESHOLD` | 2 | Минимум сканов для доверия кэшу |
| `OCR_CONFIDENCE_MIN` | 0.7 | Минимальная уверенность OCR |
| `FUZZY_MATCH_THRESHOLD` | 0.8 | Порог совпадения текста (0-1) |

---

## Схема потока данных

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              НОВЫЙ СКАН                                 │
│                         (пользователь нажал кнопку)                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
╔═══════════════════════════════════════════════════════════════════════════╗
║  PHASE 0: IMAGE HASH CHECK                                    [0 токенов] ║
║  ─────────────────────────────────────────────────────────────────────── ║
║  Проверяем hash изображения в таблице image_hashes                       ║
║  Если точное совпадение → сразу возвращаем продукт из кэша               ║
╚═══════════════════════════════════════════════════════════════════════════╝
                           │                    │
                         HIT                  MISS
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐   ╔════════════════════════════════════════╗
                    │ Возвращаем  │   ║  PHASE 1: ON-DEVICE RECOGNITION        ║
                    │ из кэша     │   ║  ────────────────────────────────────  ║
                    │             │   ║  Параллельно запускаем:                ║
                    │ index++     │   ║  • OCR (Google ML Kit)                 ║
                    └─────────────┘   ║  • Barcode Scanner (expo-barcode)      ║
                                      ║                                        ║
                                      ║  Приоритет: Barcode > OCR              ║
                                      ║  (barcode точнее если найден)          ║
                                      ╚════════════════════════════════════════╝
                                                        │
                          ┌─────────────────────────────┼─────────────────────────────┐
                          │                             │                             │
                          ▼                             ▼                             ▼
                 ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
                 │ Barcode найден  │          │ OCR текст найден│          │ Ничего не найдено│
                 │ (EAN/UPC)       │          │ (бренд/название)│          │                 │
                 └─────────────────┘          └─────────────────┘          └─────────────────┘
                          │                             │                             │
                          ▼                             ▼                             │
         ╔═══════════════════════════╗   ╔═══════════════════════════╗               │
         ║ PHASE 2A: BARCODE LOOKUP  ║   ║ PHASE 2B: TEXT SEARCH     ║               │
         ║ ───────────────────────── ║   ║ ───────────────────────── ║               │
         ║ Точный поиск по barcode   ║   ║ Fuzzy match по searchTerms║               │
         ║ в таблице products        ║   ║ "nivea soft" → products   ║               │
         ║                           ║   ║ threshold >= 0.8          ║               │
         ╚═══════════════════════════╝   ╚═══════════════════════════╝               │
                    │         │                   │         │                        │
                  FOUND    NOT FOUND           FOUND    NOT FOUND                    │
                    │         │                   │         │                        │
                    │         └───────────────────┼─────────┴────────────────────────┤
                    │                             │                                  │
                    ▼                             ▼                                  ▼
         ┌─────────────────────────┐   ┌─────────────────────────┐   ╔══════════════════════════╗
         │ ПРОДУКТ НАЙДЕН В КЭШЕ   │   │ ПРОДУКТ НАЙДЕН В КЭШЕ   │   ║ PHASE 3: CLOUD AI        ║
         │ (по barcode)            │   │ (по тексту)             │   ║ ──────────────────────── ║
         └─────────────────────────┘   └─────────────────────────┘   ║ Полный анализ:           ║
                    │                             │                  ║ • quickIdentifyProduct   ║
                    └──────────────┬──────────────┘                  ║ • identifyProduct        ║
                                   │                                 ║                          ║
                                   ▼                                 ║ ~200-1500 токенов        ║
                    ╔══════════════════════════════╗                 ╚══════════════════════════╝
                    ║ PHASE 2.5: POPULARITY CHECK  ║                            │
                    ║ ──────────────────────────── ║                            │
                    ║ popularityIndex >= 2 ?       ║                            │
                    ╚══════════════════════════════╝                            │
                           │              │                                     │
                         YES             NO                                     │
                           │              │                                     │
                           ▼              ▼                                     ▼
              ┌────────────────────┐ ┌────────────────────┐     ┌─────────────────────────────┐
              │ ВЕРНУТЬ ИЗ КЭША    │ │ ВЕРНУТЬ ИЗ КЭША    │     │ СОХРАНИТЬ НОВЫЙ ПРОДУКТ     │
              │                    │ │ +                  │     │                             │
              │ popularityIndex++  │ │ ФОНОВОЕ ОБНОВЛЕНИЕ │     │ • brand, name, analysis     │
              │                    │ │ через Cloud AI     │     │ • searchTerms (из OCR)      │
              │ Быстрый ответ      │ │                    │     │ • barcode (если есть)       │
              │ пользователю       │ │ (не блокирует UI)  │     │ • popularityIndex: 1        │
              └────────────────────┘ └────────────────────┘     │ • imageHash                 │
                                                                └─────────────────────────────┘
```

---

## Детали реализации

### Phase 0: Image Hash Check
**Где**: Convex backend (`analysis.ts`)
**Уже реализовано**: Да

```typescript
// Текущая реализация
const cachedByHash = await ctx.runQuery(internal.products.findByImageHash, {
  hash: imageHash,
});
```

### Phase 1: On-Device Recognition
**Где**: React Native (`camera.tsx`)
**Библиотеки**:
- `@react-native-ml-kit/text-recognition` — OCR
- `expo-barcode-scanner` — Barcode

```typescript
// Псевдокод
const [ocrResult, barcodeResult] = await Promise.all([
  recognizeText(imageUri),      // ML Kit OCR
  scanBarcode(imageUri),        // Expo Barcode
]);

// Приоритет: barcode > OCR
const searchMethod = barcodeResult
  ? { type: 'barcode', value: barcodeResult }
  : { type: 'text', value: extractSearchTerms(ocrResult) };
```

### Phase 2: Local Search
**Где**: Convex backend
**Новые endpoints**:

```typescript
// convex/products.ts

// Поиск по barcode (точный)
export const findByBarcode = internalQuery({
  args: { barcode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_barcode", q => q.eq("barcode", args.barcode))
      .first();
  },
});

// Поиск по тексту (fuzzy)
export const searchByText = internalQuery({
  args: { terms: v.array(v.string()) },
  handler: async (ctx, args) => {
    // Используем Convex search или custom fuzzy matching
    const results = await ctx.db
      .query("products")
      .withSearchIndex("search_terms", q =>
        q.search("searchTerms", args.terms.join(" "))
      )
      .take(5);

    return results[0]; // Лучшее совпадение
  },
});
```

### Phase 2.5: Popularity Check
**Логика**:

```typescript
if (cachedProduct) {
  if (cachedProduct.popularityIndex >= POPULARITY_THRESHOLD) {
    // Доверяем кэшу полностью
    await incrementPopularity(cachedProduct._id);
    return cachedProduct;
  } else {
    // Возвращаем кэш, но фоново обновляем
    await incrementPopularity(cachedProduct._id);

    // Фоновое обновление (не блокирует)
    ctx.scheduler.runAfter(0, internal.ai_logic.refreshProduct, {
      productId: cachedProduct._id,
      imageBase64: args.imageBase64,
    });

    return cachedProduct;
  }
}
```

### Phase 3: Cloud AI
**Где**: Convex backend (`ai_logic.ts`)
**Уже реализовано**: Да (quickIdentifyProduct + identifyProduct)

**Изменение**: При сохранении нового продукта добавляем:
- `searchTerms` — массив слов для поиска
- `barcode` — если был распознан
- `popularityIndex: 1` — начальное значение

---

## Изменения в схеме БД

```typescript
// convex/schema.ts

export default defineSchema({
  products: defineTable({
    // Существующие поля
    brand: v.string(),
    name: v.string(),
    category: v.string(),
    ingredientsAnalysis: v.any(),
    priceEstimate: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    skinCompatibility: v.optional(v.any()),
    hairCompatibility: v.optional(v.any()),
    perfumeData: v.optional(v.any()),

    // НОВЫЕ поля для локального поиска
    searchTerms: v.array(v.string()),      // ["nivea", "soft", "крем"]
    barcode: v.optional(v.string()),        // "4005900009159"
    popularityIndex: v.number(),            // Количество сканов
    lastScannedAt: v.number(),              // Timestamp
  })
    // Существующие индексы
    .index("by_brand_name", ["brand", "name"])
    // НОВЫЕ индексы
    .index("by_barcode", ["barcode"])
    .index("by_popularity", ["popularityIndex"])
    .searchIndex("search_terms", {
      searchField: "searchTerms",
      filterFields: ["category"],
    }),

  image_hashes: defineTable({
    hash: v.string(),
    productId: v.id("products"),
  }).index("by_hash", ["hash"]),
});
```

---

## Новые зависимости

```bash
# OCR (Google ML Kit)
npm install @react-native-ml-kit/text-recognition

# Barcode Scanner (уже есть expo-camera, но для standalone)
npx expo install expo-barcode-scanner
```

---

## Конфигурация

```typescript
// constants/scanning.ts

export const SCANNING_CONFIG = {
  // Порог популярности для полного доверия кэшу
  POPULARITY_THRESHOLD: 2,

  // Минимальная уверенность OCR
  OCR_CONFIDENCE_MIN: 0.7,

  // Порог fuzzy match (0-1)
  FUZZY_MATCH_THRESHOLD: 0.8,

  // Таймаут для on-device распознавания
  RECOGNITION_TIMEOUT_MS: 3000,

  // Максимум search terms для хранения
  MAX_SEARCH_TERMS: 20,
};
```

---

## Метрики для отслеживания

| Метрика | Описание |
|---------|----------|
| `cache_hit_rate` | % запросов из кэша (hash + text + barcode) |
| `cloud_ai_calls` | Количество обращений к Cloud AI |
| `avg_response_time` | Среднее время ответа |
| `ocr_success_rate` | % успешных OCR распознаваний |
| `barcode_found_rate` | % сканов с найденным barcode |

---

## Примеры сценариев

### Сценарий 1: Популярный продукт (повторный скан)
```
Пользователь сканирует "NIVEA Soft" (уже в БД, index=5)

1. Image Hash → MISS (другое фото)
2. OCR → "NIVEA Soft Увлажняющий крем"
3. Text Search → FOUND (product_id: xxx)
4. Popularity Check → index=5 >= 2 ✓
5. Возвращаем из кэша, index=6

Токены: 0
Время: ~500ms
```

### Сценарий 2: Новый продукт
```
Пользователь сканирует "The Ordinary Niacinamide" (нет в БД)

1. Image Hash → MISS
2. OCR → "The Ordinary Niacinamide 10% + Zinc 1%"
3. Text Search → NOT FOUND
4. Cloud AI → Полный анализ
5. Сохраняем в БД с index=1, searchTerms=[...]

Токены: ~1200
Время: ~3-5s
```

### Сценарий 3: Продукт с низким индексом
```
Пользователь сканирует "Some Cream" (в БД, index=1)

1. Image Hash → MISS
2. OCR → "Some Cream"
3. Text Search → FOUND (product_id: yyy)
4. Popularity Check → index=1 < 2
5. Возвращаем из кэша сразу, index=2
6. ФОНОВО: Cloud AI обновляет данные

Токены: ~1200 (фоново)
Время для пользователя: ~500ms
```

### Сценарий 4: Barcode найден
```
Пользователь сканирует продукт со штрихкодом

1. Image Hash → MISS
2. Barcode → "4005900009159"
3. Barcode Lookup → FOUND
4. Popularity Check → index >= 2
5. Возвращаем из кэша

Токены: 0
Время: ~300ms
```

---

## План реализации

### Этап 1: Подготовка БД
- [ ] Обновить `convex/schema.ts` — новые поля
- [ ] Миграция существующих продуктов — добавить searchTerms
- [ ] Добавить новые индексы

### Этап 2: On-Device Recognition
- [ ] Установить `@react-native-ml-kit/text-recognition`
- [ ] Создать `hooks/useOCR.ts`
- [ ] Интегрировать `expo-barcode-scanner`
- [ ] Создать `hooks/useBarcodeScanner.ts`

### Этап 3: Backend Endpoints
- [ ] `findByBarcode` query
- [ ] `searchByText` query с fuzzy matching
- [ ] `incrementPopularity` mutation
- [ ] `refreshProduct` background action

### Этап 4: Обновить Camera Flow
- [ ] Интегрировать OCR перед отправкой на сервер
- [ ] Добавить barcode scanning
- [ ] Обновить `analyzeProduct` action

### Этап 5: Тестирование
- [ ] Тест: популярный продукт (cache hit)
- [ ] Тест: новый продукт (cloud AI)
- [ ] Тест: barcode scan
- [ ] Тест: низкий popularityIndex (фоновое обновление)

---

## Потенциальные риски

| Риск | Митигация |
|------|-----------|
| OCR плохо читает художественные шрифты | Fallback на Cloud AI |
| Barcode не видно на фото | OCR как основной метод |
| Fuzzy match находит неправильный продукт | Показывать "Это правильный продукт?" |
| Фоновое обновление не успевает | Увеличить POPULARITY_THRESHOLD |
