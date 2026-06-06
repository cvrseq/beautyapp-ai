import { Ionicons } from '@expo/vector-icons';
import { router, RelativePathString } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useTheme, Theme } from '@/hooks/useTheme';

export default function WelcomeScreen() {
  const { skipOnboarding, isLoading } = useAuth();
  const { theme } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => createThemedStyles(theme), [theme]);

  const handleRegister = () => {
    router.push('/auth/register' as RelativePathString);
  };

  const handleLogin = () => {
    router.push('/auth/login' as RelativePathString);
  };

  const handleSkip = async () => {
    await skipOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Logo and Title */}
      <View style={styles.heroSection}>
        <View style={styles.logoContainer}>
          <Ionicons name="sparkles" size={64} color={theme.primary} />
        </View>
        <Text style={[APPLE_TEXT_STYLES.largeTitle, styles.title]}>
          Beauty AI
        </Text>
        <Text style={[APPLE_TEXT_STYLES.body, styles.subtitle]}>
          {t('onboarding.subtitle')}
        </Text>
      </View>

      {/* Features List */}
      <View style={styles.featuresSection}>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="scan-outline" size={24} color={theme.primary} />
          </View>
          <View style={styles.featureText}>
            <Text style={[APPLE_TEXT_STYLES.headline, styles.featureTitle]}>
              {t('onboarding.scanTitle')}
            </Text>
            <Text style={[APPLE_TEXT_STYLES.subhead, styles.featureDescription]}>
              {t('onboarding.scanDesc')}
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="chatbubbles-outline" size={24} color={theme.primary} />
          </View>
          <View style={styles.featureText}>
            <Text style={[APPLE_TEXT_STYLES.headline, styles.featureTitle]}>
              {t('onboarding.reviewTitle')}
            </Text>
            <Text style={[APPLE_TEXT_STYLES.subhead, styles.featureDescription]}>
              {t('onboarding.reviewDesc')}
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="people-outline" size={24} color={theme.primary} />
          </View>
          <View style={styles.featureText}>
            <Text style={[APPLE_TEXT_STYLES.headline, styles.featureTitle]}>
              {t('onboarding.shareTitle')}
            </Text>
            <Text style={[APPLE_TEXT_STYLES.subhead, styles.featureDescription]}>
              {t('onboarding.shareDesc')}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleRegister}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <Text style={[APPLE_TEXT_STYLES.headline, styles.primaryButtonText]}>
            {t('onboarding.register')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleLogin}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <Text style={[APPLE_TEXT_STYLES.body, styles.secondaryButtonText]}>
            {t('onboarding.loginLink')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.6}
          disabled={isLoading}
        >
          <Text style={[APPLE_TEXT_STYLES.subhead, styles.skipButtonText]}>
            {t('onboarding.skip')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Note about registration */}
      <View style={styles.noteSection}>
        <Text style={[APPLE_TEXT_STYLES.caption1, styles.noteText]}>
          {t('onboarding.note')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const createThemedStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: theme.textSecondary,
    textAlign: 'center',
  },
  featuresSection: {
    flex: 1,
    paddingVertical: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    color: theme.text,
    marginBottom: 2,
  },
  featureDescription: {
    color: theme.textSecondary,
  },
  actionsSection: {
    paddingBottom: 16,
  },
  primaryButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: theme.textInverse,
  },
  secondaryButton: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: theme.primary,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: theme.textSecondary,
  },
  noteSection: {
    paddingBottom: 16,
  },
  noteText: {
    color: theme.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
