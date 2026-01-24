import { internalMutation } from './_generated/server';

// Миграция: преобразует старый формат совместимости (строки) в новый (объекты)
export const migrateCompatibility = internalMutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query('products').collect();
    let migratedSkin = 0;
    let migratedHair = 0;

    for (const product of products) {
      const updates: Record<string, unknown> = {};

      // Миграция skinTypeCompatibility
      if (product.skinTypeCompatibility && typeof product.skinTypeCompatibility === 'object') {
        const compatibility = product.skinTypeCompatibility as Record<string, unknown>;
        const needsMigration = Object.values(compatibility).some(
          (val: unknown) => typeof val === 'string'
        );

        if (needsMigration) {
          const validTypes = ['dry', 'oily', 'combination', 'normal', 'sensitive'];
          const newCompatibility: Record<string, { status: string; score: number }> = {};

          for (const type of validTypes) {
            const oldValue = compatibility[type];
            if (typeof oldValue === 'string') {
              const status = oldValue;
              const score =
                status === 'good' ? 75 : status === 'bad' ? 25 : 50;
              newCompatibility[type] = { status, score };
            } else if (oldValue && typeof oldValue === 'object' && 'status' in oldValue && 'score' in oldValue) {
              // Уже в новом формате
              newCompatibility[type] = oldValue as { status: string; score: number };
            } else {
              newCompatibility[type] = { status: 'neutral', score: 50 };
            }
          }

          updates.skinTypeCompatibility = newCompatibility;
          migratedSkin++;
        }
      }

      // Миграция hairTypeCompatibility
      if (product.hairTypeCompatibility && typeof product.hairTypeCompatibility === 'object') {
        const compatibility = product.hairTypeCompatibility as Record<string, unknown>;
        const needsMigration = Object.values(compatibility).some(
          (val: unknown) => typeof val === 'string'
        );

        if (needsMigration) {
          const validTypes = ['straight', 'wavy', 'curly', 'coily', 'oily', 'dry', 'normal', 'damaged'];
          const newCompatibility: Record<string, { status: string; score: number }> = {};

          for (const type of validTypes) {
            const oldValue = compatibility[type];
            if (typeof oldValue === 'string') {
              const status = oldValue;
              const score =
                status === 'good' ? 75 : status === 'bad' ? 25 : 50;
              newCompatibility[type] = { status, score };
            } else if (oldValue && typeof oldValue === 'object' && 'status' in oldValue && 'score' in oldValue) {
              // Уже в новом формате
              newCompatibility[type] = oldValue as { status: string; score: number };
            } else {
              newCompatibility[type] = { status: 'neutral', score: 50 };
            }
          }

          updates.hairTypeCompatibility = newCompatibility;
          migratedHair++;
        }
      }

      // Применяем обновления, если есть
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(product._id, updates);
      }
    }

    return { migratedSkin, migratedHair };
  },
});

