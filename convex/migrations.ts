import { internalMutation } from './_generated/server';

// Миграция: преобразует старый формат skinTypeCompatibility (строки) в новый (объекты)
export const migrateSkinCompatibility = internalMutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query('products').collect();
    let migrated = 0;

    for (const product of products) {
      if (!product.skinTypeCompatibility) continue;

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
            const score =
              status === 'good' ? 75 : status === 'bad' ? 25 : 50;
            newCompatibility[type] = { status, score };
          } else if (oldValue && typeof oldValue === 'object') {
            // Уже в новом формате
            newCompatibility[type] = oldValue;
          } else {
            newCompatibility[type] = { status: 'neutral', score: 50 };
          }
        }

        await ctx.db.patch(product._id, {
          skinTypeCompatibility: newCompatibility,
        });
        migrated++;
      }
    }

    return { migrated };
  },
});

