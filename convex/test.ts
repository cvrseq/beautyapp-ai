import { action } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

interface TestResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

// Test function to verify analyzeProduct works
export const testAnalyze = action({
  args: {
    imageBase64: v.string(),
  },
  handler: async (ctx, args): Promise<TestResult> => {
    console.log('Testing analyzeProduct with image size:', args.imageBase64.length);

    try {
      const result: unknown = await ctx.runAction(internal.ai_logic.identifyProduct, {
        imageBase64: args.imageBase64,
        skinType: undefined,
        hairType: undefined,
      });

      console.log('AI result:', JSON.stringify(result, null, 2));
      return { success: true, result };
    } catch (error) {
      console.error('Test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },
});
