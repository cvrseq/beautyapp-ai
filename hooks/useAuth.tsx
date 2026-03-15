import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from 'convex/react';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Storage keys
const DEVICE_ID_KEY = '@beauty_ai_device_id';
const SESSION_TOKEN_KEY = '@beauty_ai_session_token';
const ONBOARDING_COMPLETE_KEY = '@beauty_ai_onboarding_complete';

// Types
type AuthType = 'anonymous' | 'registered';

interface User {
  _id: Id<'users'>;
  authType: AuthType;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  profile?: {
    skinType?: string;
    hairType?: string;
    age?: string;
    lifestyle?: string;
    location?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isRegistered: boolean;
  isAnonymous: boolean;
  deviceId: string | null;
  sessionToken: string | null;
  hasCompletedOnboarding: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  upgradeAccount: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generate a simple UUID-like string
function generateDeviceId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    if (i === 8 || i === 12 || i === 16 || i === 20) {
      result += '-';
    }
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Convex queries and mutations
  const user = useQuery(
    api.auth.getCurrentUser,
    deviceId ? { deviceId, sessionToken: sessionToken || undefined } : 'skip'
  );

  const createAnonymousMutation = useMutation(api.auth.createAnonymousUser);
  const loginMutation = useMutation(api.auth.loginUser);
  const registerMutation = useMutation(api.auth.registerUser);
  const logoutMutation = useMutation(api.auth.logoutUser);
  const upgradeMutation = useMutation(api.auth.upgradeToRegistered);

  // Initialize device ID and session token from storage
  useEffect(() => {
    const init = async () => {
      try {
        // Get or create device ID
        let storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
        if (!storedDeviceId) {
          storedDeviceId = generateDeviceId();
          await AsyncStorage.setItem(DEVICE_ID_KEY, storedDeviceId);
        }
        setDeviceId(storedDeviceId);

        // Get session token if exists
        const storedSessionToken = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
        if (storedSessionToken) {
          setSessionToken(storedSessionToken);
        }

        // Check onboarding status
        const onboardingComplete = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        setHasCompletedOnboarding(onboardingComplete === 'true');

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setIsInitialized(true);
      }
    };

    init();
  }, []);

  // Create anonymous user if needed
  useEffect(() => {
    const createAnonymousIfNeeded = async () => {
      if (isInitialized && deviceId && user === null && !sessionToken) {
        try {
          await createAnonymousMutation({ deviceId });
        } catch (error) {
          console.error('Failed to create anonymous user:', error);
        }
      }
    };

    createAnonymousIfNeeded();
  }, [isInitialized, deviceId, user, sessionToken, createAnonymousMutation]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await loginMutation({
        email,
        password,
        deviceId: deviceId || undefined,
      });

      if ('error' in result) {
        return { success: false, error: result.error };
      }

      if (result.sessionToken) {
        await AsyncStorage.setItem(SESSION_TOKEN_KEY, result.sessionToken);
        setSessionToken(result.sessionToken);
      }

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Ошибка входа. Попробуйте ещё раз.' };
    }
  };

  const register = async (email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await registerMutation({
        email,
        password,
        displayName,
        deviceId: deviceId || undefined,
      });

      if ('error' in result) {
        return { success: false, error: result.error };
      }

      if (result.sessionToken) {
        await AsyncStorage.setItem(SESSION_TOKEN_KEY, result.sessionToken);
        setSessionToken(result.sessionToken);
      }

      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Ошибка регистрации. Попробуйте ещё раз.' };
    }
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        await logoutMutation({ sessionToken });
      }
      await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
      setSessionToken(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const upgradeAccount = async (email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> => {
    if (!deviceId) {
      return { success: false, error: 'Ошибка: устройство не идентифицировано' };
    }

    try {
      const result = await upgradeMutation({
        deviceId,
        email,
        password,
        displayName,
      });

      if ('error' in result) {
        return { success: false, error: result.error };
      }

      if (result.sessionToken) {
        await AsyncStorage.setItem(SESSION_TOKEN_KEY, result.sessionToken);
        setSessionToken(result.sessionToken);
      }

      return { success: true };
    } catch (error) {
      console.error('Upgrade failed:', error);
      return { success: false, error: 'Ошибка регистрации. Попробуйте ещё раз.' };
    }
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    setHasCompletedOnboarding(true);
  };

  const skipOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    setHasCompletedOnboarding(true);
  };

  const isLoading = !isInitialized || (isInitialized && deviceId !== null && user === undefined);

  const value: AuthContextType = {
    user: user as User | null,
    isLoading,
    isRegistered: user?.authType === 'registered',
    isAnonymous: user?.authType === 'anonymous',
    deviceId,
    sessionToken,
    hasCompletedOnboarding,
    login,
    register,
    logout,
    upgradeAccount,
    completeOnboarding,
    skipOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
