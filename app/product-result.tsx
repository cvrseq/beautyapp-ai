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
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

export default function ProductResultScreen() {
  const { id } = useLocalSearchParams();
  const { skinType } = useSkinType();
  const { hairType } = useHairType();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

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

  // Функция для получения подходящей иконки для ингредиента
  const getIngredientIcon = (ingredient: Ingredient): keyof typeof Ionicons.glyphMap => {
    const name = ingredient.name.toLowerCase();
    const desc = ingredient.desc.toLowerCase();

    // Увлажняющие компоненты
    if (name.includes('глицерин') || name.includes('glycerin') || 
        name.includes('гиалурон') || name.includes('hyaluron') ||
        desc.includes('увлажн') || desc.includes('влагу')) {
      return 'water';
    }

    // Антиоксиданты и витамины
    if (name.includes('витамин') || name.includes('vitamin') ||
        name.includes('токоферол') || name.includes('tocopherol') ||
        name.includes('аскорби') || name.includes('ascorbic') ||
        desc.includes('антиоксидант') || desc.includes('витамин')) {
      return 'leaf';
    }

    // Кислоты (AHA/BHA)
    if (name.includes('кислот') || name.includes('acid') ||
        name.includes('салицилов') || name.includes('salicylic') ||
        name.includes('гликолев') || name.includes('glycolic') ||
        desc.includes('отшелуш') || desc.includes('exfoliat')) {
      return 'flask';
    }

    // Масла и эмоленты
    if (name.includes('масло') || name.includes('oil') ||
        name.includes('сквалан') || name.includes('squalane') ||
        desc.includes('эмолент') || desc.includes('масло')) {
      return 'water';
    }

    // Пептиды и белки
    if (name.includes('пептид') || name.includes('peptide') ||
        name.includes('белок') || name.includes('protein') ||
        desc.includes('пептид') || desc.includes('белок')) {
      return 'fitness';
    }

    // Керамиды
    if (name.includes('керамид') || name.includes('ceramide') ||
        desc.includes('керамид')) {
      return 'shield-checkmark';
    }

    // Консерванты и стабилизаторы
    if (name.includes('парабен') || name.includes('paraben') ||
        name.includes('фенокси') || name.includes('phenoxy') ||
        desc.includes('консервант') || desc.includes('стабилизатор')) {
      return 'lock-closed';
    }

    // Спирты
    if (name.includes('спирт') || name.includes('alcohol') ||
        name.includes('этанол') || name.includes('ethanol') ||
        desc.includes('спирт')) {
      return 'flame';
    }

    // Солнцезащитные компоненты
    if (name.includes('оксид') || name.includes('oxide') ||
        name.includes('цинк') || name.includes('zinc') ||
        desc.includes('spf') || desc.includes('uv') || desc.includes('солнце')) {
      return 'sunny';
    }

    // По умолчанию - по статусу
    switch (ingredient.status) {
      case 'green':
        return 'checkmark-circle';
      case 'yellow':
        return 'warning';
      case 'red':
        return 'alert-circle';
      default:
        return 'ellipse';
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
            <TouchableOpacity 
              style={styles.learnMoreButton} 
              activeOpacity={0.7}
              onPress={() => setIsExpanded(!isExpanded)}
            >
              <Text style={[APPLE_TEXT_STYLES.callout, styles.learnMoreText]}>
                {isExpanded ? 'Скрыть' : 'Читать ещё...'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Expanded Detailed Analysis */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            <View style={styles.expandedCard}>
              {/* Personalized Analysis Header */}
              <View style={styles.expandedHeader}>
                <Ionicons name="person-circle-outline" size={24} color="#007AFF" />
                <Text style={[APPLE_TEXT_STYLES.title3, styles.expandedTitle]}>
                  Персонализированный анализ
                </Text>
              </View>

              {/* Skin Type Analysis */}
              {skinType && (
                <View style={styles.analysisBlock}>
                  <Text style={[APPLE_TEXT_STYLES.headline, styles.analysisBlockTitle]}>
                    Для {SKIN_TYPE_LABELS[skinType].toLowerCase()} кожи
                  </Text>
                  {skinCompatibility && skinCompatibility[skinType] && (
                    <View style={styles.compatibilityDetails}>
                      <View style={styles.compatibilityRow}>
                        <Text style={[APPLE_TEXT_STYLES.body, styles.compatibilityLabel]}>
                          Совместимость:
                        </Text>
                        <View style={styles.compatibilityValue}>
                          <Text style={[APPLE_TEXT_STYLES.body, { 
                            color: skinCompatibility[skinType].status === 'good' ? '#34C759' : 
                                   skinCompatibility[skinType].status === 'bad' ? '#FF3B30' : '#FF9500'
                          }]}>
                            {skinCompatibility[skinType].status === 'good' ? 'Отлично подходит' :
                             skinCompatibility[skinType].status === 'bad' ? 'Не рекомендуется' : 'Нейтрально'}
                          </Text>
                          <Text style={[APPLE_TEXT_STYLES.caption1, styles.scoreText]}>
                            {typeof skinCompatibility[skinType].score === 'number' ? skinCompatibility[skinType].score : 0}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                  
                  {/* Ingredients for skin type */}
                  {analysis.ingredients.length > 0 && (
                    <View style={styles.ingredientsForType}>
                      <Text style={[APPLE_TEXT_STYLES.subhead, styles.ingredientsForTypeTitle]}>
                        Подходящие ингредиенты:
                      </Text>
                      <View style={styles.ingredientsTagsContainer}>
                        {analysis.ingredients
                          .filter(ing => ing.status === 'green')
                          .slice(0, 5)
                          .map((ing, idx) => (
                            <View key={idx} style={styles.ingredientTag}>
                              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                              <Text style={[APPLE_TEXT_STYLES.caption1, styles.ingredientTagText]}>
                                {ing.name}
                              </Text>
                            </View>
                          ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Hair Type Analysis */}
              {hairType && (product.category === 'hair' || product.category === 'mixed') && (
                <View style={styles.analysisBlock}>
                  <Text style={[APPLE_TEXT_STYLES.headline, styles.analysisBlockTitle]}>
                    Для {HAIR_TYPE_LABELS[hairType].toLowerCase()} волос
                  </Text>
                  {hairCompatibility && hairCompatibility[hairType] && (
                    <View style={styles.compatibilityDetails}>
                      <View style={styles.compatibilityRow}>
                        <Text style={[APPLE_TEXT_STYLES.body, styles.compatibilityLabel]}>
                          Совместимость:
                        </Text>
                        <View style={styles.compatibilityValue}>
                          <Text style={[APPLE_TEXT_STYLES.body, { 
                            color: hairCompatibility[hairType].status === 'good' ? '#34C759' : 
                                   hairCompatibility[hairType].status === 'bad' ? '#FF3B30' : '#FF9500'
                          }]}>
                            {hairCompatibility[hairType].status === 'good' ? 'Отлично подходит' :
                             hairCompatibility[hairType].status === 'bad' ? 'Не рекомендуется' : 'Нейтрально'}
                          </Text>
                          <Text style={[APPLE_TEXT_STYLES.caption1, styles.scoreText]}>
                            {typeof hairCompatibility[hairType].score === 'number' ? hairCompatibility[hairType].score : 0}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Pros and Cons */}
              <View style={styles.prosConsSection}>
                {analysis.pros.length > 0 && (
                  <View style={styles.prosConsBlock}>
                    <View style={styles.prosConsHeader}>
                      <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                      <Text style={[APPLE_TEXT_STYLES.headline, styles.prosConsTitle]}>
                        Преимущества
                      </Text>
                    </View>
                    {analysis.pros.map((pro, idx) => (
                      <View key={idx} style={styles.prosConsItem}>
                        <View style={styles.prosConsBullet} />
                        <Text style={[APPLE_TEXT_STYLES.body, styles.prosConsText]}>
                          {pro}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {analysis.cons.length > 0 && (
                  <View style={styles.prosConsBlock}>
                    <View style={styles.prosConsHeader}>
                      <Ionicons name="alert-circle" size={20} color="#FF9500" />
                      <Text style={[APPLE_TEXT_STYLES.headline, styles.prosConsTitle]}>
                        Недостатки
                      </Text>
                    </View>
                    {analysis.cons.map((con, idx) => (
                      <View key={idx} style={styles.prosConsItem}>
                        <View style={[styles.prosConsBullet, styles.consBullet]} />
                        <Text style={[APPLE_TEXT_STYLES.body, styles.prosConsText]}>
                          {con}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Safety Level */}
              <View style={styles.safetySection}>
                <View style={styles.safetyHeader}>
                  <Ionicons 
                    name={analysis.hazards === 'low' ? 'shield-checkmark' : 
                          analysis.hazards === 'medium' ? 'shield' : 'warning'} 
                    size={20} 
                    color={analysis.hazards === 'low' ? '#34C759' : 
                           analysis.hazards === 'medium' ? '#FF9500' : '#FF3B30'} 
                  />
                  <Text style={[APPLE_TEXT_STYLES.headline, styles.safetyTitle]}>
                    Уровень безопасности
                  </Text>
                </View>
                <Text style={[APPLE_TEXT_STYLES.body, styles.safetyText]}>
                  {analysis.hazards === 'low' 
                    ? 'Продукт имеет низкий уровень риска и безопасен для использования.'
                    : analysis.hazards === 'medium'
                    ? 'Продукт имеет средний уровень риска. Рекомендуется провести тест на аллергию перед использованием.'
                    : 'Продукт содержит компоненты с высоким уровнем риска. Используйте с осторожностью.'}
                </Text>
              </View>

              {/* Detailed Ingredients Info */}
              {analysis.ingredients.length > 0 && (
                <View style={styles.detailedIngredientsSection}>
                  <View style={styles.detailedIngredientsHeader}>
                    <Ionicons name="flask-outline" size={20} color="#007AFF" />
                    <Text style={[APPLE_TEXT_STYLES.headline, styles.detailedIngredientsTitle]}>
                      Детальная информация об ингредиентах
                    </Text>
                  </View>
                  <Text style={[APPLE_TEXT_STYLES.caption1, styles.detailedIngredientsSubtitle]}>
                    Всего компонентов: {analysis.ingredients.length}
                  </Text>
                  <View style={styles.ingredientsStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                      <Text style={[APPLE_TEXT_STYLES.caption1, styles.statText]}>
                        Безопасные: {analysis.ingredients.filter(i => i.status === 'green').length}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="warning" size={16} color="#FF9500" />
                      <Text style={[APPLE_TEXT_STYLES.caption1, styles.statText]}>
                        Внимание: {analysis.ingredients.filter(i => i.status === 'yellow').length}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                      <Text style={[APPLE_TEXT_STYLES.caption1, styles.statText]}>
                        Риск: {analysis.ingredients.filter(i => i.status === 'red').length}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

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
                const iconName = getIngredientIcon(item);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.listItem, isLast && styles.listItemLast]}
                    activeOpacity={0.6}
                    onPress={() => setSelectedIngredient(item)}
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

      {/* Ingredient Detail Modal */}
      <Modal
        visible={selectedIngredient !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedIngredient(null)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          {selectedIngredient && (
            <>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedIngredient(null)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={28} color="#000000" />
                </TouchableOpacity>
                <Text style={[APPLE_TEXT_STYLES.title2, styles.modalTitle]}>
                  {selectedIngredient.name}
                </Text>
                <View style={styles.modalHeaderSpacer} />
              </View>

              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                {/* Ingredient Icon and Status */}
                <View style={styles.modalIconSection}>
                  <View style={[styles.modalIconContainer, { backgroundColor: getIconColor(selectedIngredient.status) }]}>
                    <Ionicons 
                      name={getIngredientIcon(selectedIngredient)} 
                      size={64} 
                      color="#FFFFFF" 
                    />
                  </View>
                  <View style={styles.modalStatusBadge}>
                    <Text style={[APPLE_TEXT_STYLES.headline, { 
                      color: getIconColor(selectedIngredient.status) 
                    }]}>
                      {selectedIngredient.status === 'green' ? 'Безопасен' :
                       selectedIngredient.status === 'yellow' ? 'Требует внимания' : 'Риск'}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                {selectedIngredient.desc && (
                  <View style={styles.modalSection}>
                    <Text style={[APPLE_TEXT_STYLES.headline, styles.modalSectionTitle]}>
                      Описание
                    </Text>
                    <Text style={[APPLE_TEXT_STYLES.body, styles.modalSectionText]}>
                      {selectedIngredient.desc}
                    </Text>
                  </View>
                )}

                {/* Personalized Analysis for Skin Type */}
                {skinType && (product.category === 'skin' || product.category === 'mixed' || !product.category) && (
                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionHeader}>
                      <Ionicons name="person" size={20} color="#007AFF" />
                      <Text style={[APPLE_TEXT_STYLES.headline, styles.modalSectionTitle]}>
                        Для {SKIN_TYPE_LABELS[skinType].toLowerCase()} кожи
                      </Text>
                    </View>
                    
                    {/* Benefits */}
                    <View style={styles.modalBenefitBlock}>
                      <View style={styles.modalBenefitHeader}>
                        <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                        <Text style={[APPLE_TEXT_STYLES.subhead, styles.modalBenefitTitle]}>
                          Польза
                        </Text>
                      </View>
                      {selectedIngredient.status === 'green' ? (
                        <Text style={[APPLE_TEXT_STYLES.body, styles.modalBenefitText]}>
                          Этот компонент хорошо подходит для {SKIN_TYPE_LABELS[skinType].toLowerCase()} кожи. 
                          {selectedIngredient.desc && ` ${selectedIngredient.desc}`}
                        </Text>
                      ) : selectedIngredient.status === 'yellow' ? (
                        <Text style={[APPLE_TEXT_STYLES.body, styles.modalBenefitText]}>
                          Компонент может быть полезен для {SKIN_TYPE_LABELS[skinType].toLowerCase()} кожи, 
                          но требует осторожного использования. Рекомендуется провести тест на аллергию.
                        </Text>
                      ) : (
                        <Text style={[APPLE_TEXT_STYLES.body, styles.modalBenefitText]}>
                          Компонент может вызывать нежелательные реакции у {SKIN_TYPE_LABELS[skinType].toLowerCase()} кожи.
                        </Text>
                      )}
                    </View>

                    {/* Risks */}
                    {selectedIngredient.status !== 'green' && (
                      <View style={styles.modalRiskBlock}>
                        <View style={styles.modalBenefitHeader}>
                          <Ionicons name="alert-circle" size={20} color="#FF9500" />
                          <Text style={[APPLE_TEXT_STYLES.subhead, styles.modalRiskTitle]}>
                            Вред и предостережения
                          </Text>
                        </View>
                        {selectedIngredient.status === 'yellow' ? (
                          <Text style={[APPLE_TEXT_STYLES.body, styles.modalRiskText]}>
                            Может вызывать раздражение или аллергические реакции у чувствительной кожи. 
                            При появлении покраснения, зуда или других неприятных ощущений прекратите использование.
                          </Text>
                        ) : (
                          <Text style={[APPLE_TEXT_STYLES.body, styles.modalRiskText]}>
                            Высокий риск нежелательных реакций для {SKIN_TYPE_LABELS[skinType].toLowerCase()} кожи. 
                            Может вызывать раздражение, аллергию или другие побочные эффекты. 
                            Не рекомендуется для регулярного использования.
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Specific recommendations by skin type */}
                    <View style={styles.modalRecommendationBlock}>
                      <Text style={[APPLE_TEXT_STYLES.subhead, styles.modalRecommendationTitle]}>
                        Рекомендации
                      </Text>
                      {skinType === 'dry' && (
                        <Text style={[APPLE_TEXT_STYLES.body, styles.modalRecommendationText]}>
                          {selectedIngredient.status === 'green' 
                            ? 'Отлично подходит для сухой кожи. Помогает удерживать влагу и предотвращает обезвоживание.'
                            : 'Используйте с осторожностью. Сухая кожа более склонна к раздражению.'}
                        </Text>
                      )}
                      {skinType === 'oily' && (
                        <Text style={[APPLE_TEXT_STYLES.body, styles.modalRecommendationText]}>
                          {selectedIngredient.status === 'green'
                            ? 'Подходит для жирной кожи. Помогает контролировать выработку себума.'
                            : 'Может усугубить проблемы с жирностью кожи. Используйте умеренно.'}
                        </Text>
                      )}
                      {skinType === 'sensitive' && (
                        <Text style={[APPLE_TEXT_STYLES.body, styles.modalRecommendationText]}>
                          {selectedIngredient.status === 'green'
                            ? 'Безопасен для чувствительной кожи. Не вызывает раздражения.'
                            : 'Требует особой осторожности. Обязательно проведите тест на небольшом участке кожи.'}
                        </Text>
                      )}
                      {skinType === 'combination' && (
                        <Text style={[APPLE_TEXT_STYLES.body, styles.modalRecommendationText]}>
                          {selectedIngredient.status === 'green'
                            ? 'Подходит для комбинированной кожи. Балансирует состояние разных зон.'
                            : 'Применяйте точечно на проблемных зонах, избегая чувствительных участков.'}
                        </Text>
                      )}
                      {skinType === 'normal' && (
                        <Text style={[APPLE_TEXT_STYLES.body, styles.modalRecommendationText]}>
                          {selectedIngredient.status === 'green'
                            ? 'Идеально подходит для нормальной кожи. Поддерживает естественный баланс.'
                            : 'Используйте в умеренных количествах, следите за реакцией кожи.'}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Hair Type Analysis */}
                {hairType && (product.category === 'hair' || product.category === 'mixed') && (
                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionHeader}>
                      <Ionicons name="cut" size={20} color="#007AFF" />
                      <Text style={[APPLE_TEXT_STYLES.headline, styles.modalSectionTitle]}>
                        Для {HAIR_TYPE_LABELS[hairType].toLowerCase()} волос
                      </Text>
                    </View>
                    <Text style={[APPLE_TEXT_STYLES.body, styles.modalSectionText]}>
                      {selectedIngredient.status === 'green'
                        ? `Компонент благотворно влияет на ${HAIR_TYPE_LABELS[hairType].toLowerCase()} волосы, улучшая их состояние и внешний вид.`
                        : selectedIngredient.status === 'yellow'
                        ? `Компонент может быть полезен для ${HAIR_TYPE_LABELS[hairType].toLowerCase()} волос, но требует осторожного применения.`
                        : `Компонент может негативно влиять на ${HAIR_TYPE_LABELS[hairType].toLowerCase()} волосы. Рекомендуется избегать или использовать минимально.`}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
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
  expandedSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  expandedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  expandedTitle: {
    color: '#000000',
    marginLeft: 8,
  },
  analysisBlock: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  analysisBlockTitle: {
    color: '#000000',
    marginBottom: 12,
  },
  compatibilityDetails: {
    marginTop: 8,
  },
  compatibilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compatibilityLabel: {
    color: '#8E8E93',
  },
  compatibilityValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    color: '#8E8E93',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  ingredientsForType: {
    marginTop: 16,
  },
  ingredientsForTypeTitle: {
    color: '#000000',
    marginBottom: 12,
  },
  ingredientsTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ingredientTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    marginRight: 8,
  },
  ingredientTagText: {
    color: '#000000',
    marginLeft: 6,
  },
  prosConsSection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  prosConsBlock: {
    marginBottom: 20,
  },
  prosConsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  prosConsTitle: {
    color: '#000000',
    marginLeft: 8,
  },
  prosConsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  prosConsBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
    marginTop: 6,
    marginRight: 12,
  },
  consBullet: {
    backgroundColor: '#FF9500',
  },
  prosConsText: {
    color: '#000000',
    flex: 1,
    lineHeight: 20,
  },
  safetySection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  safetyTitle: {
    color: '#000000',
    marginLeft: 8,
  },
  safetyText: {
    color: '#000000',
    lineHeight: 20,
  },
  detailedIngredientsSection: {
    marginTop: 8,
  },
  detailedIngredientsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailedIngredientsTitle: {
    color: '#000000',
    marginLeft: 8,
  },
  detailedIngredientsSubtitle: {
    color: '#8E8E93',
    marginBottom: 16,
    marginLeft: 28,
  },
  ingredientsStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
    marginBottom: 8,
  },
  statText: {
    color: '#000000',
    marginLeft: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  modalHeaderSpacer: {
    width: 44,
  },
  modalScrollView: {
    flex: 1,
  },
  modalIconSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  modalIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  modalSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 16,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalSectionTitle: {
    color: '#000000',
    marginLeft: 8,
    marginBottom: 12,
  },
  modalSectionText: {
    color: '#000000',
    lineHeight: 22,
  },
  modalBenefitBlock: {
    backgroundColor: '#F0F9F4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  modalBenefitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalBenefitTitle: {
    color: '#000000',
    marginLeft: 8,
    fontWeight: '600',
  },
  modalBenefitText: {
    color: '#000000',
    lineHeight: 22,
  },
  modalRiskBlock: {
    backgroundColor: '#FFF4E6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  modalRiskTitle: {
    color: '#000000',
    marginLeft: 8,
    fontWeight: '600',
  },
  modalRiskText: {
    color: '#000000',
    lineHeight: 22,
  },
  modalRecommendationBlock: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  modalRecommendationTitle: {
    color: '#000000',
    marginBottom: 8,
    fontWeight: '600',
  },
  modalRecommendationText: {
    color: '#000000',
    lineHeight: 22,
  },
});