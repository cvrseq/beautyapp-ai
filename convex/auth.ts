import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Simple hash function for passwords (in production, use bcrypt on a server)
// This is a basic implementation - for real apps, use proper auth service
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36) + password.length.toString(36);
}

// Generate a random session token
function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create anonymous user
export const createAnonymousUser = mutation({
  args: {
    deviceId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user with this deviceId already exists
    const existing = await ctx.db
      .query('users')
      .withIndex('by_deviceId', (q) => q.eq('deviceId', args.deviceId))
      .first();

    if (existing) {
      // Update lastActiveAt
      await ctx.db.patch(existing._id, {
        lastActiveAt: Date.now(),
      });
      return { userId: existing._id, isNew: false };
    }

    // Create new anonymous user
    const userId = await ctx.db.insert('users', {
      authType: 'anonymous',
      deviceId: args.deviceId,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    return { userId, isNew: true };
  },
});

// Register new user
export const registerUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    displayName: v.string(),
    deviceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      return { error: 'Неверный формат email' };
    }

    // Validate password length
    if (args.password.length < 6) {
      return { error: 'Пароль должен быть не менее 6 символов' };
    }

    // Check if email already exists
    const existingEmail = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email.toLowerCase()))
      .first();

    if (existingEmail) {
      return { error: 'Пользователь с таким email уже существует' };
    }

    // Check if there's an anonymous user with this deviceId to upgrade
    let existingAnonymous = null;
    if (args.deviceId) {
      existingAnonymous = await ctx.db
        .query('users')
        .withIndex('by_deviceId', (q) => q.eq('deviceId', args.deviceId))
        .first();
    }

    const sessionToken = generateSessionToken();
    const now = Date.now();

    if (existingAnonymous && existingAnonymous.authType === 'anonymous') {
      // Upgrade anonymous user to registered
      await ctx.db.patch(existingAnonymous._id, {
        authType: 'registered',
        email: args.email.toLowerCase(),
        passwordHash: simpleHash(args.password),
        displayName: args.displayName,
        sessionToken,
        lastActiveAt: now,
      });
      return { userId: existingAnonymous._id, sessionToken };
    }

    // Create new registered user
    const userId = await ctx.db.insert('users', {
      authType: 'registered',
      email: args.email.toLowerCase(),
      passwordHash: simpleHash(args.password),
      displayName: args.displayName,
      deviceId: args.deviceId,
      sessionToken,
      createdAt: now,
      lastActiveAt: now,
    });

    return { userId, sessionToken };
  },
});

// Login user
export const loginUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    deviceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email.toLowerCase()))
      .first();

    if (!user) {
      return { error: 'Пользователь не найден' };
    }

    if (user.authType !== 'registered') {
      return { error: 'Этот аккаунт не зарегистрирован' };
    }

    // Check password
    if (user.passwordHash !== simpleHash(args.password)) {
      return { error: 'Неверный пароль' };
    }

    // Generate new session token
    const sessionToken = generateSessionToken();

    // Update user with new session and deviceId
    await ctx.db.patch(user._id, {
      sessionToken,
      deviceId: args.deviceId || user.deviceId,
      lastActiveAt: Date.now(),
    });

    return { userId: user._id, sessionToken, displayName: user.displayName };
  },
});

// Logout user
export const logoutUser = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_sessionToken', (q) => q.eq('sessionToken', args.sessionToken))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        sessionToken: undefined,
      });
    }

    return { success: true };
  },
});

// Get current user by deviceId or sessionToken
export const getCurrentUser = query({
  args: {
    deviceId: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Try session token first (for logged-in users)
    if (args.sessionToken) {
      const userBySession = await ctx.db
        .query('users')
        .withIndex('by_sessionToken', (q) => q.eq('sessionToken', args.sessionToken))
        .first();

      if (userBySession) {
        return {
          _id: userBySession._id,
          authType: userBySession.authType,
          email: userBySession.email,
          displayName: userBySession.displayName,
          avatarUrl: userBySession.avatarUrl,
          profile: userBySession.profile,
        };
      }
    }

    // Fall back to deviceId (for anonymous users)
    if (args.deviceId) {
      const userByDevice = await ctx.db
        .query('users')
        .withIndex('by_deviceId', (q) => q.eq('deviceId', args.deviceId))
        .first();

      if (userByDevice) {
        return {
          _id: userByDevice._id,
          authType: userByDevice.authType,
          email: userByDevice.email,
          displayName: userByDevice.displayName,
          avatarUrl: userByDevice.avatarUrl,
          profile: userByDevice.profile,
        };
      }
    }

    return null;
  },
});

// Check if email exists
export const checkEmailExists = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email.toLowerCase()))
      .first();

    return { exists: !!user };
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    sessionToken: v.string(),
    profile: v.optional(v.object({
      skinType: v.optional(v.string()),
      hairType: v.optional(v.string()),
      age: v.optional(v.string()),
      lifestyle: v.optional(v.string()),
      location: v.optional(v.string()),
    })),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_sessionToken', (q) => q.eq('sessionToken', args.sessionToken))
      .first();

    if (!user) {
      return { error: 'Пользователь не найден' };
    }

    const updates: Record<string, unknown> = {
      lastActiveAt: Date.now(),
    };

    if (args.profile !== undefined) {
      updates.profile = args.profile;
    }
    if (args.displayName !== undefined) {
      updates.displayName = args.displayName;
    }
    if (args.avatarUrl !== undefined) {
      updates.avatarUrl = args.avatarUrl;
    }

    await ctx.db.patch(user._id, updates);

    return { success: true };
  },
});

// Upgrade anonymous user to registered
export const upgradeToRegistered = mutation({
  args: {
    deviceId: v.string(),
    email: v.string(),
    password: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    // Find anonymous user
    const user = await ctx.db
      .query('users')
      .withIndex('by_deviceId', (q) => q.eq('deviceId', args.deviceId))
      .first();

    if (!user) {
      return { error: 'Пользователь не найден' };
    }

    if (user.authType !== 'anonymous') {
      return { error: 'Пользователь уже зарегистрирован' };
    }

    // Check if email already exists
    const existingEmail = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email.toLowerCase()))
      .first();

    if (existingEmail) {
      return { error: 'Пользователь с таким email уже существует' };
    }

    // Validate password
    if (args.password.length < 6) {
      return { error: 'Пароль должен быть не менее 6 символов' };
    }

    const sessionToken = generateSessionToken();

    // Upgrade user
    await ctx.db.patch(user._id, {
      authType: 'registered',
      email: args.email.toLowerCase(),
      passwordHash: simpleHash(args.password),
      displayName: args.displayName,
      sessionToken,
      lastActiveAt: Date.now(),
    });

    return { userId: user._id, sessionToken };
  },
});

// Get user by ID (for comments display)
export const getUserById = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return {
      _id: user._id,
      displayName: user.displayName || 'Пользователь',
      avatarUrl: user.avatarUrl,
      authType: user.authType,
    };
  },
});
