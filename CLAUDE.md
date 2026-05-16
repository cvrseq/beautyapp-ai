# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Beauty AI - мобильное приложение на React Native (Expo) для анализа косметических продуктов с помощью AI. Пользователи могут сканировать продукты через камеру, получать анализ состава и рекомендации на основе их типа кожи/волос, возраста, образа жизни и локации.

## Tech Stack
- **Frontend**: React Native (Expo ~54), TypeScript 5.9, Expo Router 6 (file-based routing)
- **Backend**: Convex 1.31 (serverless database + actions)
- **AI**: Gemini API через VseGPT (OpenRouter-compatible endpoint)
- **Storage**: Base64 images (планируется миграция на S3 или Convex File Storage)
- **State**: React Hooks + AsyncStorage (локальные данные пользователя), Convex Queries (серверные данные)

## Project Structure
```
app/                    # Expo Router screens (file-based routing)
  (tabs)/              # Tab navigation group
    index.tsx          # Home screen (profile summary)
    camera.tsx         # Camera screen для сканирования
    two.tsx            # Дополнительный экран
  *-quiz.tsx           # Onboarding quizzes (skin/hair type, age, lifestyle, location)
  product-result.tsx   # Результаты анализа продукта
  profile.tsx          # Экран профиля
  search.tsx           # Поиск продуктов

convex/                # Convex backend (TypeScript)
  schema.ts            # Database schema (products table с кэшированием результатов)
  ai_logic.ts          # identifyProduct action (анализ через Gemini API)
  types.ts             # Backend type definitions (дублируются из /types для изоляции Convex)
  constants.ts         # API config, compatibility scores

types/                 # Frontend type definitions (single source of truth)
  skinType.ts          # 9 типов кожи + compatibility definitions
  hairType.ts          # 8 типов волос + compatibility definitions
  userProfile.ts       # Age, Lifestyle, Location types с климатическими данными

hooks/                 # Custom hooks для AsyncStorage
  useSkinType.ts       # Управление типом кожи (локальное хранилище)
  useHairType.ts       # Управление типом волос
  useAge.ts            # Возрастная категория
  useLifestyle.ts      # Образ жизни
  useLocation.ts       # Локация/климат

components/            # Reusable UI components
  ChevronArrow.tsx     # Navigation arrow
  Themed.tsx           # Theme-aware components
```

## Key Architectural Patterns

### 1. Type System Architecture
**CRITICAL**: Типы дублируются между `/types` (frontend) и `convex/types.ts` (backend) из-за ограничений Convex - backend не может импортировать типы из папки выше. При изменении типов обновлять ОБА файла.

Skin types: `dry | oily | combination | normal | sensitive | mature | acne_prone | dehydrated | pigmented`
Hair types: `straight | wavy | curly | coily | oily | dry | normal | damaged`

### 2. User Profile Data Flow
- **Хранение**: AsyncStorage (локально, без регистрации/авторизации)
- **Доступ**: Через custom hooks (`useSkinType`, `useHairType`, etc.)
- **Загрузка**: При каждом возврате на главный экран через `useFocusEffect`
- **Обновление**: Quiz экраны сохраняют данные и возвращают назад

### 3. AI Product Analysis Flow
1. Пользователь фотографирует продукт на `camera.tsx`
2. Изображение конвертируется в base64
3. Отправляется в `convex/ai_logic.ts:identifyProduct` action
4. Action обращается к Gemini API через VseGPT endpoint (OpenRouter-compatible)
5. AI возвращает:
   - Brand, name, confidence
   - Category: `skin | hair | mixed | unknown`
   - Analysis: pros, cons, hazards (low/medium/high), ingredients (green/yellow/red)
   - skinCompatibility: объект с {status: good|bad|neutral, score: 0-100} для всех 9 типов кожи
   - hairCompatibility: объект с {status: good|bad|neutral, score: 0-100} для всех 8 типов волос
6. Результат кэшируется в `products` таблице (индексы по brand+name)
7. UI показывает персонализированную рекомендацию на основе профиля пользователя

### 4. Compatibility Scoring System
**Score ranges** (определены в `convex/constants.ts`):
- `score >= 70`: status = "good" (зелёный)
- `40 <= score < 70`: status = "neutral" (жёлтый)
- `score < 40`: status = "bad" (красный)

**Персонализация**: UI фильтрует и подсвечивает совместимость на основе текущих типов кожи/волос пользователя.

### 5. Climate-Aware Recommendations
Локации (`types/userProfile.ts:LOCATION_CLIMATE`) содержат климатические данные:
- `humidity`: low/medium/high
- `pollution`: low/medium/high
- `uv`: low/medium/high
- `climate`: continental/maritime/subtropical/etc.

AI prompt учитывает эти данные для персонализированных рекомендаций (например, SPF для Сочи, увлажнение для Новосибирска).

## Common Commands

### Development
```bash
npx expo start              # Start Expo dev server
npx expo start --android    # Start Android
npx expo start --ios        # Start iOS
npx expo start --web        # Start web
```

### Convex Backend
```bash
npx convex dev              # Start Convex backend in dev mode (hot reload)
npx convex deploy           # Deploy to production
```

### Environment Setup
- `EXPO_PUBLIC_CONVEX_URL`: Convex deployment URL (в `.env.local`)
- `GEMINI_API_KEY`: API ключ для VseGPT (только на Convex backend, не в .env)

## Coding Standards

### Language & Style
- **Ответы в коде**: на русском (comments на английском)
- **TypeScript**: Strict mode, NO `any` (всегда используй интерфейсы)
- **Components**: Functional components, arrow functions, Hooks only
- **Styling**: `StyleSheet.create` (не NativeWind - в проекте не настроен)

### Backend (Convex)
- Use `ctx.db.query()`, `ctx.db.insert()`, `ctx.db.patch()`
- **Actions** для внешних API calls (`internalAction` для приватных)
- Explicit error handling: try/catch с понятными русскими сообщениями
- NEVER import types from `/types` - use `convex/types.ts` copies

### Frontend
- Use `router.push()` для навигации (Expo Router)
- Загрузка данных профиля через `useFocusEffect` callback
- Используй `SafeAreaView` с `edges` prop для безопасных зон
- Icons: `@expo/vector-icons` (Ionicons)

### Data Validation
- Всегда валидируй AI responses (см. `ai_logic.ts:260-477`)
- Нормализуй старые форматы данных к новым
- Синхронизируй `status` и `score` в compatibility data
- Default к `neutral` при невалидных данных

## Common Issues

### Type Duplication
При добавлении нового типа кожи/волос:
1. Обнови `types/skinType.ts` или `types/hairType.ts`
2. **ОБЯЗАТЕЛЬНО** обнови `convex/types.ts` (Convex изолирован)
3. Обнови `convex/schema.ts` если меняется структура БД
4. Обнови AI prompt в `convex/ai_logic.ts` (строки 188-200)

### Base64 Image Size
- Max size: 10MB (определено в `convex/constants.ts:VALIDATION.MAX_BASE64_SIZE`)
- Сжимай изображения перед отправкой на сервер

### AI Response Validation
AI может вернуть:
- Markdown-обёрнутый JSON (```json...```) - используй regex match
- Старый формат compatibility (строка вместо объекта) - конвертируй
- Массив вместо строки для `hazards` - нормализуй

## Future Plans (из README)
- Sentry - мониторинг ошибок
- Posthog - аналитика
- RevenueCat - управление подписками
- UploadCare/Convex File Storage - хранение фото (вместо base64)
- Локальный LLM (когда можно раскатать в production)
