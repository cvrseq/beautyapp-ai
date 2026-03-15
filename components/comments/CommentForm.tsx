import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { useTheme, Theme } from '@/hooks/useTheme';

interface CommentFormProps {
  onSubmit: (text: string) => Promise<{ error?: string }>;
  disabled?: boolean;
  onInputFocus?: () => void;
}

export function CommentForm({ onSubmit, disabled, onInputFocus }: CommentFormProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const styles = useMemo(() => createThemedStyles(theme), [theme]);

  const handleSubmit = async () => {
    const trimmedText = text.trim();
    if (!trimmedText || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await onSubmit(trimmedText);
      if (result.error) {
        setError(result.error);
      } else {
        setText('');
      }
    } catch (e) {
      setError('Не удалось отправить комментарий');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = text.trim().length > 0 && !isSubmitting && !disabled;

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color={theme.error} />
          <Text style={[APPLE_TEXT_STYLES.caption1, styles.errorText]}>
            {error}
          </Text>
        </View>
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={[APPLE_TEXT_STYLES.body, styles.input]}
          placeholder="Написать комментарий..."
          placeholderTextColor={theme.textTertiary}
          value={text}
          onChangeText={setText}
          onFocus={onInputFocus}
          multiline
          maxLength={1000}
          editable={!isSubmitting && !disabled}
        />
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.7}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={theme.textInverse} />
          ) : (
            <Ionicons name="arrow-up" size={18} color={theme.textInverse} />
          )}
        </TouchableOpacity>
      </View>
      <Text style={[APPLE_TEXT_STYLES.caption2, styles.charCount]}>
        {text.length}/1000
      </Text>
    </View>
  );
}

const createThemedStyles = (theme: Theme) => StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primaryLight,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  errorText: {
    color: theme.error,
    marginLeft: 6,
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: theme.inputBackground,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 12,
    color: theme.text,
    maxHeight: 100,
    minHeight: 36,
  },
  submitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  submitButtonDisabled: {
    backgroundColor: theme.textTertiary,
  },
  charCount: {
    color: theme.textSecondary,
    textAlign: 'right',
    marginTop: 6,
  },
});
