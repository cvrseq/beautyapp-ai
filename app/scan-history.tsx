import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScanHistoryScreen() {
  const products = useQuery(api.products.getAllProducts);

  const handleProductPress = (productId: Id<'products'>) => {
    router.push({
      pathname: '/product-result',
      params: { id: productId },
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Сегодня';
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return `${diffDays} дн. назад`;
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  if (products === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={[APPLE_TEXT_STYLES.body, styles.loadingText]}>
            Загрузка истории...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (products.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={[APPLE_TEXT_STYLES.largeTitle, styles.title]}>
            История сканов
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="images-outline" size={64} color="#C7C7CC" />
          </View>
          <Text style={[APPLE_TEXT_STYLES.title2, styles.emptyTitle]}>
            История пуста
          </Text>
          <Text style={[APPLE_TEXT_STYLES.body, styles.emptyText]}>
            Отсканируйте продукты, чтобы они появились здесь
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/camera')}
            activeOpacity={0.7}
          >
            <Text style={[APPLE_TEXT_STYLES.headline, styles.emptyButtonText]}>
              Открыть сканер
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={[APPLE_TEXT_STYLES.largeTitle, styles.title]}>
          История сканов
        </Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productItem}
            onPress={() => handleProductPress(item._id)}
            activeOpacity={0.7}
          >
            <View style={styles.productImageContainer}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Ionicons name="image-outline" size={32} color="#C7C7CC" />
                </View>
              )}
            </View>
            <View style={styles.productContent}>
              <Text
                style={[APPLE_TEXT_STYLES.headline, styles.productBrand]}
                numberOfLines={1}
              >
                {item.brand}
              </Text>
              <Text
                style={[APPLE_TEXT_STYLES.body, styles.productName]}
                numberOfLines={2}
              >
                {item.name}
              </Text>
              <Text
                style={[APPLE_TEXT_STYLES.caption1, styles.productDate]}
                numberOfLines={1}
              >
                {formatDate(item._creationTime)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  title: {
    color: '#000000',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#8E8E93',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  productImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#F2F2F7',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  productContent: {
    flex: 1,
    marginRight: 8,
  },
  productBrand: {
    color: '#000000',
    marginBottom: 4,
  },
  productName: {
    color: '#8E8E93',
    marginBottom: 4,
  },
  productDate: {
    color: '#C7C7CC',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#FFFFFF',
  },
});
