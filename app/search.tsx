import { ChevronArrow } from '@/components/ChevronArrow';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { SEARCH } from '@/constants/thresholds';
import { api } from '@/convex/_generated/api';
import { useLocale } from '@/hooks/useLocale';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, Theme } from '@/hooks/useTheme';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { theme } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => createThemedStyles(theme), [theme]);

  const shouldSearch = debouncedQuery.trim().length >= SEARCH.MIN_QUERY_LENGTH;
  const products = useQuery(
    api.products.searchProducts,
    shouldSearch ? { searchQuery: debouncedQuery } : 'skip'
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleProductPress = (productId: string) => {
    router.push({
      pathname: '/product-result',
      params: { id: productId },
    });
  };

  const handleCancel = () => {
    setSearchQuery('');
    setIsFocused(false);
    inputRef.current?.blur();
    if (router.canGoBack()) {
      router.back();
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Back Button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={handleCancel}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <View style={styles.backButtonContent}>
            <Ionicons name="chevron-back" size={24} color={theme.primary} />
            <Text style={[APPLE_TEXT_STYLES.headline, styles.backButtonText]}>
              Beauty AI
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={[APPLE_TEXT_STYLES.body, styles.searchInput]}
            placeholder={t('home.search')}
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoFocus={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color={theme.textSecondary} style={styles.rightIcon} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="mic-outline" size={18} color={theme.textSecondary} style={styles.rightIcon} />
          )}
        </View>
      </View>

      {/* Content */}
      {shouldSearch ? (
        <View style={styles.resultsContainer}>
          {products === undefined ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={theme.text} />
              <Text style={[APPLE_TEXT_STYLES.body, styles.emptyStateText]}>
                {t('search.loading')}
              </Text>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="search-outline" size={40} color={theme.textTertiary} />
              </View>
              <Text style={[APPLE_TEXT_STYLES.headline, styles.emptyStateTitle]} numberOfLines={1}>
                {t('search.nothingFound')}
              </Text>
              <Text style={[APPLE_TEXT_STYLES.subhead, styles.emptyStateSubtitle]} numberOfLines={2}>
                {t('search.tryAnother')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.productItem}
                  onPress={() => handleProductPress(item._id)}
                  activeOpacity={0.6}
                >
                  <View style={styles.productContent}>
                    <Text style={[APPLE_TEXT_STYLES.caption1, styles.productBrand]} numberOfLines={1}>
                      {item.brand}
                    </Text>
                    <Text style={[APPLE_TEXT_STYLES.body, styles.productName]} numberOfLines={2}>
                      {item.name}
                    </Text>
                    {item.priceEstimate && (
                      <Text style={[APPLE_TEXT_STYLES.subhead, styles.productPrice]} numberOfLines={1}>
                        {item.priceEstimate}
                      </Text>
                    )}
                  </View>
                  <ChevronArrow color={theme.textTertiary} size={20} direction="right" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={[APPLE_TEXT_STYLES.subhead, styles.emptyStateSubtitle]}>
                    {t('search.notFound')}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const createThemedStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: theme.backgroundSecondary,
  },
  backButton: {
    padding: 4,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.primary,
    marginLeft: -2,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: theme.backgroundSecondary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundTertiary,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: theme.text,
    paddingVertical: 0,
  },
  rightIcon: {
    marginLeft: 8,
  },
  resultsContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    color: theme.textSecondary,
    marginTop: 16,
  },
  emptyStateSubtitle: {
    color: theme.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
  },
  productContent: {
    flex: 1,
    marginRight: 12,
  },
  productBrand: {
    color: theme.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  productName: {
    color: theme.text,
    marginBottom: 4,
  },
  productPrice: {
    color: theme.textSecondary,
  },
});
