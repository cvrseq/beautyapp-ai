import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Add a comment to a product
export const addComment = mutation({
  args: {
    productId: v.id('products'),
    userId: v.id('users'),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate text
    const trimmedText = args.text.trim();
    if (trimmedText.length === 0) {
      return { error: 'Комментарий не может быть пустым' };
    }
    if (trimmedText.length > 1000) {
      return { error: 'Комментарий слишком длинный (максимум 1000 символов)' };
    }

    // Check if user exists and is registered
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { error: 'Пользователь не найден' };
    }
    if (user.authType !== 'registered') {
      return { error: 'Только зарегистрированные пользователи могут оставлять комментарии' };
    }

    // Check if product exists
    const product = await ctx.db.get(args.productId);
    if (!product) {
      return { error: 'Продукт не найден' };
    }

    // Check if user already commented on this product (one comment per user per product)
    const existingComment = await ctx.db
      .query('comments')
      .withIndex('by_product_user', (q) =>
        q.eq('productId', args.productId).eq('userId', args.userId)
      )
      .first();

    if (existingComment && !existingComment.isDeleted) {
      return { error: 'Вы уже оставили комментарий к этому продукту' };
    }

    // Create comment
    const commentId = await ctx.db.insert('comments', {
      productId: args.productId,
      userId: args.userId,
      text: trimmedText,
      createdAt: Date.now(),
    });

    // Update comments count on product
    await ctx.db.patch(args.productId, {
      commentsCount: (product.commentsCount || 0) + 1,
    });

    return { commentId };
  },
});

// Get comments for a product
export const getCommentsForProduct = query({
  args: {
    productId: v.id('products'),
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query('comments')
      .withIndex('by_product', (q) => q.eq('productId', args.productId))
      .collect();

    // Filter out deleted comments and sort by date (newest first)
    const activeComments = comments
      .filter((c) => !c.isDeleted)
      .sort((a, b) => b.createdAt - a.createdAt);

    // Get user info for each comment
    const commentsWithUsers = await Promise.all(
      activeComments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          _id: comment._id,
          productId: comment.productId,
          userId: comment.userId,
          text: comment.text,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          user: user
            ? {
                displayName: user.displayName || 'Пользователь',
                avatarUrl: user.avatarUrl,
              }
            : {
                displayName: 'Удалённый пользователь',
                avatarUrl: undefined,
              },
        };
      })
    );

    return commentsWithUsers;
  },
});

// Check if user has commented on a product
export const hasUserCommented = query({
  args: {
    productId: v.id('products'),
    userId: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    const userId = args.userId;
    if (!userId) {
      return { hasCommented: false };
    }

    const comment = await ctx.db
      .query('comments')
      .withIndex('by_product_user', (q) =>
        q.eq('productId', args.productId).eq('userId', userId)
      )
      .first();

    return { hasCommented: !!comment && !comment.isDeleted };
  },
});

// Delete a comment (soft delete)
export const deleteComment = mutation({
  args: {
    commentId: v.id('comments'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);

    if (!comment) {
      return { error: 'Комментарий не найден' };
    }

    // Only the author can delete their comment
    if (comment.userId !== args.userId) {
      return { error: 'Вы не можете удалить чужой комментарий' };
    }

    // Soft delete
    await ctx.db.patch(args.commentId, {
      isDeleted: true,
      updatedAt: Date.now(),
    });

    // Update comments count on product
    const product = await ctx.db.get(comment.productId);
    if (product && (product.commentsCount || 0) > 0) {
      await ctx.db.patch(comment.productId, {
        commentsCount: (product.commentsCount || 1) - 1,
      });
    }

    return { success: true };
  },
});

// Update a comment
export const updateComment = mutation({
  args: {
    commentId: v.id('comments'),
    userId: v.id('users'),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);

    if (!comment) {
      return { error: 'Комментарий не найден' };
    }

    if (comment.isDeleted) {
      return { error: 'Комментарий удалён' };
    }

    // Only the author can edit their comment
    if (comment.userId !== args.userId) {
      return { error: 'Вы не можете редактировать чужой комментарий' };
    }

    // Validate text
    const trimmedText = args.text.trim();
    if (trimmedText.length === 0) {
      return { error: 'Комментарий не может быть пустым' };
    }
    if (trimmedText.length > 1000) {
      return { error: 'Комментарий слишком длинный (максимум 1000 символов)' };
    }

    await ctx.db.patch(args.commentId, {
      text: trimmedText,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get comment count for a product
export const getCommentCount = query({
  args: {
    productId: v.id('products'),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    return { count: product?.commentsCount || 0 };
  },
});
