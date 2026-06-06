import { AuthProvider } from '@/hooks/useAuth';
import { LocaleProvider } from '@/hooks/useLocale';
import { ThemeProvider } from '@/hooks/useTheme';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { Stack } from 'expo-router';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error('EXPO_PUBLIC_CONVEX_URL environment variable is not set');
}
const convex = new ConvexReactClient(convexUrl);

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <ThemeProvider>
        <LocaleProvider>
        <AuthProvider>
          <Stack>
          {/* Index redirect */}
          <Stack.Screen name="index" options={{ headerShown: false }} />
          {/* Main tabs */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* Onboarding and Auth */}
          <Stack.Screen name="onboarding/welcome" options={{ headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          {/* Quiz screens */}
          <Stack.Screen name="skin-type-quiz" options={{ headerShown: false }} />
          <Stack.Screen name="hair-type-quiz" options={{ headerShown: false }} />
          <Stack.Screen name="age-quiz" options={{ headerShown: false }} />
          <Stack.Screen name="lifestyle-quiz" options={{ headerShown: false }} />
          <Stack.Screen name="location-quiz" options={{ headerShown: false }} />
          {/* Other screens */}
          <Stack.Screen name="search" options={{ headerShown: false }} />
          <Stack.Screen name="product-result" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="scan-history" options={{ headerShown: false }} />
          </Stack>
        </AuthProvider>
        </LocaleProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
}
