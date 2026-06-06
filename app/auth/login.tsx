import { Ionicons } from '@expo/vector-icons';
import { router, RelativePathString } from 'expo-router';
import { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { ChevronArrow } from '@/components/ChevronArrow';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useTheme, Theme } from '@/hooks/useTheme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, completeOnboarding } = useAuth();
  const { theme } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => createThemedStyles(theme), [theme]);

  const validateForm = (): string | null => {
    if (!email.trim()) return t('auth.login.errEmail');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return t('auth.login.errEmailFmt');
    if (!password) return t('auth.login.errPassword');
    return null;
  };

  const handleLogin = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        setError(result.error || t('auth.login.errFailed'));
        return;
      }
      await completeOnboarding();
      router.replace('/(tabs)');
    } catch (e) {
      setError(t('errGeneric'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronArrow color={theme.primary} size={20} direction="left" />
            <Text style={[APPLE_TEXT_STYLES.body, styles.backButtonText]}>
              {t('back')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[APPLE_TEXT_STYLES.largeTitle, styles.title]}>
              {t('auth.login.title')}
            </Text>
            <Text style={[APPLE_TEXT_STYLES.body, styles.subtitle]}>
              {t('auth.login.subtitle')}
            </Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={theme.error} />
              <Text style={[APPLE_TEXT_STYLES.subhead, styles.errorText]}>
                {error}
              </Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[APPLE_TEXT_STYLES.subhead, styles.inputLabel]}>
                Email
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[APPLE_TEXT_STYLES.body, styles.input]}
                  placeholder="example@email.com"
                  placeholderTextColor={theme.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isSubmitting}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[APPLE_TEXT_STYLES.subhead, styles.inputLabel]}>
                {t('auth.login.passwordLabel')}
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[APPLE_TEXT_STYLES.body, styles.input, styles.passwordInput]}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  placeholderTextColor={theme.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  editable={!isSubmitting}
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.textInverse} />
            ) : (
              <Text style={[APPLE_TEXT_STYLES.headline, styles.submitButtonText]}>
                {t('auth.login.submit')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.replace('/auth/register' as RelativePathString)}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            <Text style={[APPLE_TEXT_STYLES.subhead, styles.registerLinkText]}>
              {t('auth.login.noAccount')}{' '}
              <Text style={styles.registerLinkAccent}>{t('auth.login.toRegister')}</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createThemedStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
  },
  keyboardView: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.backgroundSecondary,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  backButtonText: {
    color: theme.primary,
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    color: theme.text,
    marginBottom: 8,
  },
  subtitle: {
    color: theme.textSecondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primaryLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: theme.error,
    marginLeft: 8,
    flex: 1,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: theme.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: theme.card,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.text,
  },
  passwordInput: {
    paddingRight: 50,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  submitButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: theme.textInverse,
  },
  registerLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  registerLinkText: {
    color: theme.textSecondary,
  },
  registerLinkAccent: {
    color: theme.primary,
  },
});
