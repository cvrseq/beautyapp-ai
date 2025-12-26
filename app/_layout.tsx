import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { Stack } from 'expo-router';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL || '');

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <Stack>
        {/* Скрываем заголовок для группы табов, так как у них будут свои заголовки */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="skin-type-quiz" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: false }} />
      </Stack>
    </ConvexProvider>
  );
}
