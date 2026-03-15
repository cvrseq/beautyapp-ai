import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { useTheme, Theme } from '@/hooks/useTheme';

interface CommentItemProps {
  displayName: string;
  avatarUrl?: string;
  text: string;
  createdAt: number;
  updatedAt?: number;
  isBlurred: boolean;
  onRegisterPress?: () => void;
}

export function CommentItem({
  displayName,
  text,
  createdAt,
  updatedAt,
  isBlurred,
  onRegisterPress,
}: CommentItemProps) {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createThemedStyles(theme), [theme]);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;

    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header with avatar and name */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={16} color={theme.textSecondary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={[APPLE_TEXT_STYLES.subhead, styles.displayName]}>
            {displayName}
          </Text>
          <Text style={[APPLE_TEXT_STYLES.caption2, styles.date]}>
            {formatDate(createdAt)}
            {updatedAt && updatedAt !== createdAt && ' (ред.)'}
          </Text>
        </View>
      </View>

      {/* Comment text */}
      <View style={styles.textContainer}>
        {isBlurred ? (
          <TouchableOpacity
            style={styles.blurContainer}
            onPress={onRegisterPress}
            activeOpacity={0.8}
          >
            <BlurView intensity={20} style={styles.blurView}>
              <Text
                style={[APPLE_TEXT_STYLES.body, styles.commentText]}
                numberOfLines={3}
              >
                {text}
              </Text>
            </BlurView>
            <View style={[styles.blurOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}>
              <Ionicons name="lock-closed" size={20} color={theme.primary} />
              <Text style={[APPLE_TEXT_STYLES.caption1, styles.blurText]}>
                Зарегистрируйтесь, чтобы читать комментарии
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <Text style={[APPLE_TEXT_STYLES.body, styles.commentText]}>
            {text}
          </Text>
        )}
      </View>
    </View>
  );
}

const createThemedStyles = (theme: Theme) => StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  displayName: {
    color: theme.text,
    fontWeight: '600',
  },
  date: {
    color: theme.textSecondary,
    marginTop: 1,
  },
  textContainer: {
    marginLeft: 42,
  },
  commentText: {
    color: theme.text,
    lineHeight: 22,
  },
  blurContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  blurView: {
    padding: 12,
    backgroundColor: theme.backgroundSecondary,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  blurText: {
    color: theme.primary,
  },
});
