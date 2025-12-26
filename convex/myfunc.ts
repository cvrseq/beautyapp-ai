import { action, query } from './_generated/server';
import { internal } from './_generated/api';

export const hello = query({
  args: {},
  handler: async (ctx) => {
    return 'Привет! Связь с Convex установлена 🚀';
  },
});

// Публичный action для запуска миграции (можно вызвать из консоли Convex или временно через UI)
export const runMigration = action({
  args: {},
  handler: async (ctx): Promise<{ migrated: number }> => {
    const result: { migrated: number } = await ctx.runMutation(
      internal.migrations.migrateSkinCompatibility
    );
    return result;
  },
});
