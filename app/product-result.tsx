import { ChevronArrow } from '@/components/ChevronArrow';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useHairType } from '@/hooks/useHairType';
import { useSkinType } from '@/hooks/useSkinType';
import { HAIR_TYPE_LABELS } from '@/types/hairType';
import { CosmeticAnalysis, Ingredient, IngredientStatus } from '@/types/products';
import { SKIN_TYPE_LABELS } from '@/types/skinType';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProductResultScreen() {
  const { id } = useLocalSearchParams();
  const { skinType } = useSkinType();
  const { hairType } = useHairType();

  // Получаем данные
  const product = useQuery(api.products.getById, id ? { id: id as Id<'products'> } : 'skip');

  if (!id) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={40} color="#8E8E93" />
          </View>
          <Text style={[APPLE_TEXT_STYLES.title2, styles.errorTitle]} numberOfLines={2}>
            Что‑то пошло не так
          </Text>
          <Text style={[APPLE_TEXT_STYLES.body, styles.errorText]} numberOfLines={3}>
            Не удалось определить продукт. Попробуйте отсканировать ещё раз.
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.replace('/(tabs)/camera')}
          >
            <Text style={[APPLE_TEXT_STYLES.headline, styles.errorButtonText]}>
              Вернуться к сканеру
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Состояние загрузки
  if (!product) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={[APPLE_TEXT_STYLES.body, styles.loadingText]}>
            ИИ анализирует состав...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Парсим JSON с анализом
  let analysis: CosmeticAnalysis = { pros: [], cons: [], hazards: 'low', ingredients: [] };
  try {
    const parsed = typeof product.ingredientsAnalysis === 'string'
      ? JSON.parse(product.ingredientsAnalysis)
      : product.ingredientsAnalysis;
    if (parsed && typeof parsed === 'object') {
      analysis = {
        pros: Array.isArray(parsed.pros) ? parsed.pros : [],
        cons: Array.isArray(parsed.cons) ? parsed.cons : [],
        hazards: parsed.hazards || 'low',
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      };
    }
  } catch (e) {
    console.error('Failed to parse ingredientsAnalysis', e);
  }

  // Парсим совместимость с типом волос
  let hairCompatibility = product.hairTypeCompatibility;
  if (hairCompatibility && typeof hairCompatibility === 'string') {
    try {
      hairCompatibility = JSON.parse(hairCompatibility);
    } catch (e) {
      console.error('Failed to parse hairTypeCompatibility', e);
      hairCompatibility = undefined;
    }
  }

  // Парсим совместимость с типом кожи
  let skinCompatibility = product.skinTypeCompatibility;
  if (skinCompatibility && typeof skinCompatibility === 'string') {
    try {
      skinCompatibility = JSON.parse(skinCompatibility);
    } catch (e) {
      console.error('Failed to parse skinTypeCompatibility', e);
      skinCompatibility = undefined;
    }
  }

  // Функция для получения цвета иконки по статусу
  const getIconColor = (status: IngredientStatus): string => {
    switch (status) {
      case 'green':
        return '#34C759';
      case 'yellow':
        return '#FF9500';
      case 'red':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  // Функция для получения иконки по статусу
  const getIconName = (status: IngredientStatus): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'green':
        return 'checkmark-circle';
      case 'yellow':
        return 'warning';
      case 'red':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  // Функция для получения стиля совместимости
  const getCompatibilityStyle = (status: string, score: number) => {
    if (status === 'bad' || score < 40) {
      return {
        iconColor: '#FF3B30',
        iconName: 'alert-circle' as keyof typeof Ionicons.glyphMap,
        bgColor: '#FF3B30',
        label: 'Не рекомендуется',
      };
    } else if (status === 'good' || score >= 70) {
      return {
        iconColor: '#34C759',
        iconName: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
        bgColor: '#34C759',
        label: 'Отлично подходит',
      };
    } else {
      return {
        iconColor: '#FF9500',
        iconName: 'help-circle' as keyof typeof Ionicons.glyphMap,
        bgColor: '#FF9500',
        label: 'Нейтрально',
      };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } 
          }}
          activeOpacity={0.7}
        >
          <ChevronArrow color="#007AFF" size={20} direction="left" />
          <Text style={[APPLE_TEXT_STYLES.body, styles.backButtonText]}>
            Beauty AI
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerCard}>
            <View style={styles.headerIcon}>
              <Ionicons name="flask-outline" size={48} color="#FFFFFF" />
            </View>
            <Text style={[APPLE_TEXT_STYLES.largeTitle, styles.headerTitle]}>
              {product.name}
            </Text>
            <Text style={[APPLE_TEXT_STYLES.callout, styles.headerDescription]}>
              Персонализированный анализ состава косметики для вашего типа кожи и волос. Оценка совместимости и детальная информация об ингредиентах.
            </Text>
            <TouchableOpacity style={styles.learnMoreButton} activeOpacity={0.7}>
              <Text style={[APPLE_TEXT_STYLES.callout, styles.learnMoreText]}>
                Читать ещё...
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Compatibility Section - Skin */}
        {skinType && skinCompatibility && (product.category === 'skin' || product.category === 'mixed' || !product.category) && (() => {
          const compatibility = skinCompatibility[skinType];
          if (!compatibility || typeof compatibility !== 'object') return null;
          
          const status = compatibility.status || 'neutral';
          const score = typeof compatibility.score === 'number' ? compatibility.score : 50;
          const style = getCompatibilityStyle(status, score);
          
          return (
            <View style={styles.section}>
              <Text style={[APPLE_TEXT_STYLES.caption1, styles.sectionHeader]}>СОВМЕСТИМОСТЬ</Text>
              <View style={styles.sectionContent}>
                <TouchableOpacity style={[styles.listItem, styles.listItemLast]} activeOpacity={0.6}>
                  <View style={[styles.listIcon, { backgroundColor: style.bgColor }]}>
                    <Ionicons name={style.iconName} size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={[APPLE_TEXT_STYLES.body, styles.listItemTitle]}>
                      {style.label}
                    </Text>
                    <Text style={[APPLE_TEXT_STYLES.caption1, styles.listItemSubtitle]}>
                      Для {SKIN_TYPE_LABELS[skinType].toLowerCase()} кожи • {score}%
                    </Text>
                  </View>
                  <ChevronArrow color="#C7C7CC" size={20} direction="right" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}

        {/* Compatibility Section - Hair */}
        {hairType && hairCompatibility && (product.category === 'hair' || product.category === 'mixed' || !product.category) && (() => {
          const compatibility = hairCompatibility[hairType];
          if (!compatibility || typeof compatibility !== 'object') return null;
          
          const status = compatibility.status || 'neutral';
          const score = typeof compatibility.score === 'number' ? compatibility.score : 50;
          const style = getCompatibilityStyle(status, score);
          
          return (
            <View style={styles.section}>
              <Text style={[APPLE_TEXT_STYLES.caption1, styles.sectionHeader]}>СОВМЕСТИМОСТЬ</Text>
              <View style={styles.sectionContent}>
                <TouchableOpacity style={[styles.listItem, styles.listItemLast]} activeOpacity={0.6}>
                  <View style={[styles.listIcon, { backgroundColor: style.bgColor }]}>
                    <Ionicons name={style.iconName} size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={[APPLE_TEXT_STYLES.body, styles.listItemTitle]}>
                      {style.label}
                    </Text>
                    <Text style={[APPLE_TEXT_STYLES.caption1, styles.listItemSubtitle]}>
                      Для {HAIR_TYPE_LABELS[hairType].toLowerCase()} • {score}%
                    </Text>
                  </View>
                  <ChevronArrow color="#C7C7CC" size={20} direction="right" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}

        {/* Ingredients Section */}
        {analysis.ingredients.length > 0 && (
          <View style={styles.section}>
            <Text style={[APPLE_TEXT_STYLES.caption1, styles.sectionHeader]}>ИНГРЕДИЕНТЫ</Text>
            <View style={styles.sectionContent}>
              {analysis.ingredients.map((item: Ingredient, index: number) => {
                const isLast = index === analysis.ingredients.length - 1;
                const iconColor = getIconColor(item.status);
                const iconName = getIconName(item.status);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.listItem, isLast && styles.listItemLast]}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.listIcon, { backgroundColor: iconColor }]}>
                      <Ionicons name={iconName} size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.listItemContent}>
                      <Text style={[APPLE_TEXT_STYLES.body, styles.listItemTitle]}>
                        {item.name}
                      </Text>
                      {item.desc && (
                        <Text style={[APPLE_TEXT_STYLES.caption1, styles.listItemSubtitle]} numberOfLines={1}>
                          {item.desc}
                        </Text>
                      )}
                    </View>
                    <ChevronArrow color="#C7C7CC" size={20} direction="right" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  backButtonText: {
    color: '#007AFF',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 24,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  headerDescription: {
    color: '#000000',
    textAlign: 'left',
    lineHeight: 20,
    marginBottom: 12,
  },
  learnMoreButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  learnMoreText: {
    color: '#007AFF',
  },
  section: {
    marginTop: 32,
    marginHorizontal: 16,
  },
  sectionHeader: {
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  listItemLast: {
    borderBottomWidth: 0,
  },
  listIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
    marginRight: 8,
  },
  listItemTitle: {
    color: '#000000',
    marginBottom: 2,
  },
  listItemSubtitle: {
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    color: '#8E8E93',
    marginBottom: 32,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  errorButtonText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8E8E93',
    marginTop: 16,
  },
});