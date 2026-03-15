import { Ionicons } from '@expo/vector-icons';
import { router, RelativePathString } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { useTheme, Theme } from '@/hooks/useTheme';

interface RegisterPromptProps {
  variant?: 'comment' | 'view';
}

export function RegisterPrompt({ variant = 'comment' }: RegisterPromptProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createThemedStyles(theme), [theme]);

  const handleRegister = () => {
    router.push('/auth/register' as RelativePathString);
  };

  const handleLogin = () => {
    router.push('/auth/login' as RelativePathString);
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={variant === 'comment' ? 'chatbubble-ellipses' : 'eye'}
          size={28}
          color={theme.primary}
        />
      </View>
      <Text style={[APPLE_TEXT_STYLES.headline, styles.title]}>
        {variant === 'comment'
          ? 'Хотите оставить комментарий?'
          : 'Хотите читать комментарии?'}
      </Text>
      <Text style={[APPLE_TEXT_STYLES.subhead, styles.description]}>
        Зарегистрируйтесь, чтобы делиться мнением о продуктах с сообществом
      </Text>
      <TouchableOpacity
        style={styles.registerButton}
        onPress={handleRegister}
        activeOpacity={0.8}
      >
        <Text style={[APPLE_TEXT_STYLES.headline, styles.registerButtonText]}>
          Зарегистрироваться
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleLogin}
        activeOpacity={0.7}
      >
        <Text style={[APPLE_TEXT_STYLES.subhead, styles.loginButtonText]}>
          Уже есть аккаунт? Войти
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const createThemedStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  registerButton: {
    backgroundColor: theme.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  registerButtonText: {
    color: theme.textInverse,
  },
  loginButton: {
    paddingVertical: 8,
  },
  loginButtonText: {
    color: theme.primary,
  },
});
