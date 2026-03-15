import { api } from '@/convex/_generated/api';
import { useTheme, Theme } from '@/hooks/useTheme';
import { useQuery } from 'convex/react';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { FeedCard } from './FeedCard';

interface FeedListProps {
  isUserRegistered: boolean;
}

export function FeedList({ isUserRegistered }: FeedListProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createThemedStyles(theme), [theme]);
  const feedData = useQuery(api.products.getScanFeed, { limit: 20 });

  if (feedData === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.textSecondary} />
      </View>
    );
  }

  if (feedData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[APPLE_TEXT_STYLES.body, styles.emptyText]}>
          Пока нет сканов в ленте
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {feedData.map((item) => (
        <FeedCard
          key={item._id}
          productId={item._id}
          brand={item.brand}
          name={item.name}
          category={item.category}
          imageUrl={item.imageUrl}
          commentsCount={item.commentsCount}
          scannedBy={item.scannedBy}
          createdAt={item.createdAt}
          isBlurred={!isUserRegistered}
        />
      ))}
    </ScrollView>
  );
}

const createThemedStyles = (theme: Theme) => StyleSheet.create({
  loadingContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  emptyText: {
    color: theme.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
