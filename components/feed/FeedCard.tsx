import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { Id } from '@/convex/_generated/dataModel';
import { useTheme, Theme } from '@/hooks/useTheme';

interface FeedCardProps {
  productId: Id<'products'>;
  brand: string;
  name: string;
  category?: string;
  imageUrl?: string;
  commentsCount: number;
  scannedBy?: {
    displayName: string;
    avatarUrl?: string;
  } | null;
  createdAt: number;
  isBlurred?: boolean;
}

export function FeedCard({
  productId,
  brand,
  name,
  category,
  imageUrl,
  commentsCount,
  scannedBy,
  createdAt,
}: FeedCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createThemedStyles(theme), [theme]);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин.`;
    if (diffHours < 24) return `${diffHours} ч.`;
    if (diffDays < 7) return `${diffDays} дн.`;

    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getCategoryIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (category) {
      case 'perfume':
        return 'rose-outline';
      case 'skin':
        return 'sparkles-outline';
      case 'hair':
        return 'cut-outline';
      default:
        return 'flask-outline';
    }
  };

  const handlePress = () => {
    router.push({
      pathname: '/product-result',
      params: { id: productId },
    });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name={getCategoryIcon()} size={32} color={theme.textSecondary} />
          </View>
        )}
        {/* Category Badge */}
        <View style={[styles.categoryBadge, { backgroundColor: theme.primary }]}>
          <Ionicons name={getCategoryIcon()} size={14} color="#FFFFFF" />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Product Info */}
        <Text style={[APPLE_TEXT_STYLES.caption1, styles.brand]} numberOfLines={1}>
          {brand}
        </Text>
        <Text style={[APPLE_TEXT_STYLES.subhead, styles.name]} numberOfLines={2}>
          {name}
        </Text>

        {/* Footer */}
        <View style={styles.footer}>
          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={10} color={theme.textSecondary} />
            </View>
            <Text style={[APPLE_TEXT_STYLES.caption2, styles.username]} numberOfLines={1}>
              {scannedBy?.displayName || 'Пользователь'}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-outline" size={12} color={theme.textSecondary} />
              <Text style={[APPLE_TEXT_STYLES.caption2, styles.statText]}>
                {commentsCount}
              </Text>
            </View>
            <Text style={[APPLE_TEXT_STYLES.caption2, styles.timeText]}>
              {formatDate(createdAt)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createThemedStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.card,
    borderRadius: 12,
    overflow: 'hidden',
    width: 160,
    marginRight: 12,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 100,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 10,
  },
  brand: {
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  name: {
    color: theme.text,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 8,
    minHeight: 36,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  username: {
    color: theme.textSecondary,
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  statText: {
    color: theme.textSecondary,
    marginLeft: 2,
  },
  timeText: {
    color: theme.textTertiary,
  },
});
