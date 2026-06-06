import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { useLocale } from '@/hooks/useLocale';
import { useTheme, Theme } from '@/hooks/useTheme';
import { useQuery } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ListRenderItemInfo,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────────────────

interface FeedItem {
  _id: Id<'products'>;
  brand: string;
  name: string;
  category?: string;
  imageUrl?: string;
  commentsCount: number;
  createdAt: number;
  scannedBy: { _id: Id<'users'>; displayName: string; avatarUrl?: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  '#FF375F', '#FF9500', '#34C759',
  '#007AFF', '#AF52DE', '#FF6B35', '#5AC8FA',
];

function avatarColor(name: string): string {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}

// ─── Category config ─────────────────────────────────────────────────────────

interface CatConfig {
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CAT_CONFIG: Record<string, CatConfig> = {
  skin:    { color: '#007AFF', icon: 'sparkles-outline' },
  hair:    { color: '#AF52DE', icon: 'cut-outline'      },
  perfume: { color: '#FF375F', icon: 'rose-outline'     },
  mixed:   { color: '#FF9500', icon: 'flask-outline'    },
  unknown: { color: '#8E8E93', icon: 'flask-outline'    },
};

function getCatConfig(c?: string): CatConfig {
  return CAT_CONFIG[c ?? 'unknown'] ?? CAT_CONFIG.unknown;
}

// ─── Post card ───────────────────────────────────────────────────────────────

const IMAGE_H = Math.round(SW * 0.72);

interface PostCardProps {
  item: FeedItem;
  styles: ReturnType<typeof createStyles>;
  t: ReturnType<typeof useLocale>['t'];
  reviewsLabel: ReturnType<typeof useLocale>['reviewsLabel'];
  catLabel: (c?: string) => string;
  timeAgo: (ts: number) => string;
  theme: Theme;
}

function PostCard({ item, styles, t, reviewsLabel, catLabel, timeAgo, theme }: PostCardProps) {
  const cat = getCatConfig(item.category);
  const displayName = item.scannedBy?.displayName || t('user');
  const color = avatarColor(displayName);
  const initial = displayName[0]?.toUpperCase() ?? '?';

  const onPress = () =>
    router.push({ pathname: '/product-result', params: { id: item._id } });

  return (
    <View style={styles.card}>
      {/* User row */}
      <View style={styles.userRow}>
        <View style={[styles.avatar, { backgroundColor: color }]}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
        <View style={styles.userMeta}>
          <Text style={[APPLE_TEXT_STYLES.subhead, styles.displayName]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[APPLE_TEXT_STYLES.caption2, styles.timeText]}>
            {timeAgo(item.createdAt)}
          </Text>
        </View>
        <View style={[styles.catPill, { backgroundColor: cat.color + '1A' }]}>
          <Ionicons name={cat.icon} size={11} color={cat.color} />
          <Text style={[APPLE_TEXT_STYLES.caption2, { color: cat.color, marginLeft: 3, fontWeight: '600' }]}>
            {catLabel(item.category)}
          </Text>
        </View>
      </View>

      {/* Product text */}
      <View style={styles.productText}>
        <Text style={[APPLE_TEXT_STYLES.caption1, styles.brand]} numberOfLines={1}>
          {item.brand.toUpperCase()}
        </Text>
        <Text style={[APPLE_TEXT_STYLES.headline, styles.productName]} numberOfLines={2}>
          {item.name}
        </Text>
      </View>

      {/* Image */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.95} style={styles.imageWrap}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.imageFallback, { backgroundColor: theme.backgroundSecondary }]}>
            <Ionicons name={cat.icon} size={48} color={theme.textTertiary} />
          </View>
        )}
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Ionicons name="chatbubble-outline" size={15} color={theme.textSecondary} />
          <Text style={[APPLE_TEXT_STYLES.footnote, styles.commentsText]}>
            {reviewsLabel(item.commentsCount)}
          </Text>
        </View>
        <TouchableOpacity style={styles.openBtn} onPress={onPress} activeOpacity={0.7}>
          <Text style={[APPLE_TEXT_STYLES.footnote, styles.openBtnLabel]}>{t('community.view')}</Text>
          <Ionicons name="arrow-forward" size={12} color={theme.text} style={{ marginLeft: 3 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function CommunityScreen() {
  const { theme } = useTheme();
  const { t, reviewsLabel, locale } = useLocale();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [refreshing, setRefreshing] = useState(false);
  const feedData = useQuery(api.products.getScanFeed, { limit: 50 });

  const timeAgo = useCallback((ts: number): string => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return t('justNow');
    if (m < 60) return `${m} ${t('minAgo')}`;
    if (h < 24) return `${h} ${t('hourAgo')}`;
    if (d < 7) return `${d} ${t('dayAgo')}`;
    return new Date(ts).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });
  }, [t, locale]);

  const catLabel = useCallback((c?: string): string => {
    const key = `cat.${c ?? 'unknown'}` as Parameters<typeof t>[0];
    return t(key in { 'cat.skin': 1, 'cat.hair': 1, 'cat.perfume': 1, 'cat.mixed': 1, 'cat.unknown': 1 }
      ? key
      : 'cat.unknown');
  }, [t]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<FeedItem>) => (
    <PostCard
      item={item}
      styles={styles}
      t={t}
      reviewsLabel={reviewsLabel}
      catLabel={catLabel}
      timeAgo={timeAgo}
      theme={theme}
    />
  ), [styles, t, reviewsLabel, catLabel, timeAgo, theme]);

  const keyExtractor = useCallback((item: FeedItem) => item._id, []);

  const ListHeader = useMemo(() => (
    <View style={styles.header}>
      <Text style={[APPLE_TEXT_STYLES.largeTitle, styles.title]}>{t('community.title')}</Text>
      <Text style={[APPLE_TEXT_STYLES.footnote, styles.headerSub]}>{t('community.subtitle')}</Text>
    </View>
  ), [styles, t]);

  const ListEmpty = feedData !== undefined ? (
    <View style={styles.emptyWrap}>
      <Ionicons name="people-outline" size={60} color={theme.textTertiary} />
      <Text style={[APPLE_TEXT_STYLES.title3, styles.emptyTitle]}>{t('community.emptyTitle')}</Text>
      <Text style={[APPLE_TEXT_STYLES.subhead, styles.emptySub]}>{t('community.emptySub')}</Text>
      <TouchableOpacity style={styles.scanCta} onPress={() => router.push('/camera')}>
        <Ionicons name="scan" size={16} color="#fff" style={{ marginRight: 6 }} />
        <Text style={[APPLE_TEXT_STYLES.headline, { color: '#fff' }]}>{t('community.scan')}</Text>
      </TouchableOpacity>
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {feedData === undefined ? (
        <>
          {ListHeader}
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.text} />
          </View>
        </>
      ) : (
        <FlatList
          data={feedData as FeedItem[]}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.text}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.backgroundSecondary },

    header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
    title: { color: theme.text },
    headerSub: { color: theme.textSecondary, marginTop: 2 },

    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    emptyWrap: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
    emptyTitle: { color: theme.text, marginTop: 20, marginBottom: 8 },
    emptySub: { color: theme.textSecondary, textAlign: 'center', marginBottom: 28 },
    scanCta: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.text,
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 14,
    },

    listContent: { paddingBottom: 16 },
    separator: { height: 8, backgroundColor: theme.backgroundSecondary },

    card: { backgroundColor: theme.card },

    userRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    avatarInitial: { color: '#fff', fontSize: 15, fontWeight: '600' },
    userMeta: { flex: 1, marginRight: 8 },
    displayName: { color: theme.text, fontWeight: '500' },
    timeText: { color: theme.textSecondary, marginTop: 1 },
    catPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },

    productText: { paddingHorizontal: 16, paddingBottom: 12 },
    brand: { color: theme.textSecondary, letterSpacing: 0.6, marginBottom: 3 },
    productName: { color: theme.text, lineHeight: 22 },

    imageWrap: { width: SW, height: IMAGE_H, backgroundColor: theme.backgroundSecondary },
    image: { width: '100%', height: '100%' },
    imageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.borderLight,
    },
    footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    commentsText: { color: theme.textSecondary },
    openBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundSecondary,
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 10,
    },
    openBtnLabel: { color: theme.text, fontWeight: '600' },
  });
}
