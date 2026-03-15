import { useAuth } from '@/hooks/useAuth';
import { Redirect, RelativePathString } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function IndexRedirect() {
  const { isLoading, hasCompletedOnboarding } = useAuth();

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Redirect based on onboarding status
  if (!hasCompletedOnboarding) {
    return <Redirect href={'/onboarding/welcome' as RelativePathString} />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
