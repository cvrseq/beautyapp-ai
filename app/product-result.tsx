import { ChevronArrow } from '@/components/ChevronArrow';
import { CommentSection } from '@/components/comments/CommentSection';
import { PerfumeResultView } from '@/components/perfume/PerfumeResultView';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { TranslationKey } from '@/constants/i18n';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useHairType } from '@/hooks/useHairType';
import { useLocale } from '@/hooks/useLocale';
import { useSkinType } from '@/hooks/useSkinType';
import { useTheme, Theme } from '@/hooks/useTheme';
import { CosmeticAnalysis, Ingredient, IngredientStatus } from '@/types/products';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useMemo, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  const { theme } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => createThemedStyles(theme), [theme]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [compatibilityModal, setCompatibilityModal] = useState<{
    visible: boolean;
    type: 'skin' | 'hair';
    compatibility: { status: string; score: number };
    status: string;
    score: number;
  } | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const commentsLayoutY = useRef<number>(0);

  const handleCommentInputFocus = useCallback(() => {
    // Прокручиваем к секции комментариев при фокусе на инпуте
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: commentsLayoutY.current - 100,
        animated: true,
      });
    }, 300);
  }, []);

  // Fetch product data
  const product = useQuery(api.products.getById, id ? { id: id as Id<'products'> } : 'skip');

  if (!id) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={40} color={theme.textSecondary} />
          </View>
          <Text style={[APPLE_TEXT_STYLES.title2, styles.errorTitle]} numberOfLines={2}>
            {t('result.errTitle')}
          </Text>
          <Text style={[APPLE_TEXT_STYLES.body, styles.errorText]} numberOfLines={3}>
            {t('result.errText')}
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.replace('/(tabs)/camera')}
          >
            <Text style={[APPLE_TEXT_STYLES.headline, styles.errorButtonText]}>
              {t('result.errBtn')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state
  if (!product) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.text} />
          <Text style={[APPLE_TEXT_STYLES.body, styles.loadingText]}>
            {t('result.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Perfume display
  if (product.category === 'perfume' && product.perfumeData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.navBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}
              activeOpacity={0.7}
            >
              <ChevronArrow color={theme.primary} size={20} direction="left" />
              <Text style={[APPLE_TEXT_STYLES.body, styles.backButtonText]}>
                Beauty AI
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <PerfumeResultView
              productName={product.name}
              brand={product.brand}
              perfumeData={product.perfumeData}
            />

            <View
              style={styles.commentsContainer}
              onLayout={(event) => {
                commentsLayoutY.current = event.nativeEvent.layout.y;
              }}
            >
              <CommentSection
                productId={id as Id<'products'>}
                onInputFocus={handleCommentInputFocus}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Parse analysis JSON
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

  // Parse hair type compatibility
  let hairCompatibility = product.hairTypeCompatibility;
  if (hairCompatibility && typeof hairCompatibility === 'string') {
    try {
      hairCompatibility = JSON.parse(hairCompatibility);
    } catch (e) {
      console.error('Failed to parse hairTypeCompatibility', e);
      hairCompatibility = undefined;
    }
  }

  // Parse skin type compatibility
  let skinCompatibility = product.skinTypeCompatibility;
  if (skinCompatibility && typeof skinCompatibility === 'string') {
    try {
      skinCompatibility = JSON.parse(skinCompatibility);
    } catch (e) {
      console.error('Failed to parse skinTypeCompatibility', e);
      skinCompatibility = undefined;
    }
  }

  // Get icon color by status
  const getIconColor = (status: IngredientStatus): string => {
    switch (status) {
      case 'green':
        return theme.success;
      case 'yellow':
        return theme.warning;
      case 'red':
        return theme.error;
      default:
        return theme.textSecondary;
    }
  };

  // Get appropriate icon for ingredient
  const getIngredientIcon = (ingredient: Ingredient): keyof typeof Ionicons.glyphMap => {
    const name = ingredient.name.toLowerCase();
    const desc = ingredient.desc.toLowerCase();

    if (name.includes('глицерин') || name.includes('glycerin') ||
        name.includes('гиалурон') || name.includes('hyaluron') ||
        desc.includes('увлажн') || desc.includes('влагу')) {
      return 'water';
    }

    if (name.includes('витамин') || name.includes('vitamin') ||
        name.includes('токоферол') || name.includes('tocopherol') ||
        name.includes('аскорби') || name.includes('ascorbic') ||
        desc.includes('антиоксидант') || desc.includes('витамин')) {
      return 'leaf';
    }

    if (name.includes('кислот') || name.includes('acid') ||
        name.includes('салицилов') || name.includes('salicylic') ||
        name.includes('гликолев') || name.includes('glycolic') ||
        desc.includes('отшелуш') || desc.includes('exfoliat')) {
      return 'flask';
    }

    if (name.includes('масло') || name.includes('oil') ||
        name.includes('сквалан') || name.includes('squalane') ||
        desc.includes('эмолент') || desc.includes('масло')) {
      return 'water';
    }

    if (name.includes('пептид') || name.includes('peptide') ||
        name.includes('белок') || name.includes('protein') ||
        desc.includes('пептид') || desc.includes('белок')) {
      return 'fitness';
    }

    if (name.includes('керамид') || name.includes('ceramide') ||
        desc.includes('керамид')) {
      return 'shield-checkmark';
    }

    if (name.includes('парабен') || name.includes('paraben') ||
        name.includes('фенокси') || name.includes('phenoxy') ||
        desc.includes('консервант') || desc.includes('стабилизатор')) {
      return 'lock-closed';
    }

    if (name.includes('спирт') || name.includes('alcohol') ||
        name.includes('этанол') || name.includes('ethanol') ||
        desc.includes('спирт')) {
      return 'flame';
    }

    if (name.includes('оксид') || name.includes('oxide') ||
        name.includes('цинк') || name.includes('zinc') ||
        desc.includes('spf') || desc.includes('uv') || desc.includes('солнце')) {
      return 'sunny';
    }

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

  // Get compatibility description
  const getCompatibilityDescription = (
    type: 'skin' | 'hair',
    status: string,
    score: number
  ): string => {
    const typeLabel = type === 'skin'
      ? t(('skin.' + (skinType || 'normal')) as TranslationKey)
      : t(('hair.' + (hairType || 'normal')) as TranslationKey);

    if (status === 'good' && score >= 70) {
      if (type === 'skin') {
        const skinSpecific = skinType === 'dry' ? t('compat.goodSkin.dry')
          : skinType === 'oily' ? t('compat.goodSkin.oily')
          : skinType === 'sensitive' ? t('compat.goodSkin.sensitive')
          : skinType === 'combination' ? t('compat.goodSkin.combination')
          : t('compat.goodSkin.normal');
        return `${t('compat.goodSkin.prefix')} ${typeLabel.toLowerCase()}. ${skinSpecific} ${t('compat.goodSkin.suffix')}`;
      } else {
        return `${t('compat.goodHair.prefix')} ${typeLabel.toLowerCase()} ${t('result.hairSuffix')}. ${t('compat.goodHair.suffix')}`;
      }
    } else if (status === 'bad' || score < 40) {
      if (type === 'skin') {
        return `${t('compat.badSkin.prefix')} ${typeLabel.toLowerCase()}. ${t('compat.badSkin.suffix')}`;
      } else {
        return `${t('compat.badHair.prefix')} ${typeLabel.toLowerCase()} ${t('result.hairSuffix')}. ${t('compat.badHair.suffix')}`;
      }
    } else {
      if (type === 'skin') {
        return `${t('compat.neutralSkin.prefix')} ${typeLabel.toLowerCase()}. ${t('compat.neutralSkin.suffix')}`;
      } else {
        return `${t('compat.neutralHair.prefix')} ${typeLabel.toLowerCase()} ${t('result.hairSuffix')}. ${t('compat.neutralHair.suffix')}`;
      }
    }
  };

  // Get compatibility style
  const getCompatibilityStyle = (status: string, score: number) => {
    if (status === 'bad' || score < 40) {
      return {
        iconColor: theme.error,
        iconName: 'alert-circle' as keyof typeof Ionicons.glyphMap,
        bgColor: theme.error,
        label: t('result.compatBad'),
      };
    } else if (status === 'good' || score >= 70) {
      return {
        iconColor: theme.success,
        iconName: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
        bgColor: theme.success,
        label: t('result.compatGood'),
      };
    } else {
      return {
        iconColor: theme.warning,
        iconName: 'help-circle' as keyof typeof Ionicons.glyphMap,
        bgColor: theme.warning,
        label: t('result.compatNeutral'),
      };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }}
            activeOpacity={0.7}
          >
            <ChevronArrow color={theme.primary} size={20} direction="left" />
            <Text style={[APPLE_TEXT_STYLES.body, styles.backButtonText]}>
              Beauty AI
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerCard}>
            <View style={styles.headerIcon}>
              <Ionicons name="flask-outline" size={48} color={theme.textInverse} />
            </View>
            <Text style={[APPLE_TEXT_STYLES.largeTitle, styles.headerTitle]}>
              {product.name}
            </Text>
            <Text style={[APPLE_TEXT_STYLES.callout, styles.headerDescription]}>
              {t('result.headerDesc')}
            </Text>
            <TouchableOpacity
              style={styles.learnMoreButton}
              activeOpacity={0.7}
              onPress={() => setIsExpanded(!isExpanded)}
            >
              <Text style={[APPLE_TEXT_STYLES.callout, styles.learnMoreText]}>
                {isExpanded ? t('result.collapse') : t('result.readMore')}
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
                <Ionicons name="person-circle-outline" size={24} color={theme.primary} />
                <Text style={[APPLE_TEXT_STYLES.title3, styles.expandedTitle]}>
                  {t('result.personalAnalysis')}
                </Text>
              </View>

              {/* Skin Type Analysis */}
              {skinType && (
                <View style={styles.analysisBlock}>
                  <Text style={[APPLE_TEXT_STYLES.headline, styles.analysisBlockTitle]}>
                    {t('result.forSkinPrefix')} {t(('skin.' + skinType) as TranslationKey).toLowerCase()} {t('result.skinSuffix')}
                  </Text>
                  {skinCompatibility && skinCompatibility[skinType] && (
                    <View style={styles.compatibilityDetails}>
                      <View style={styles.compatibilityRow}>
                        <Text style={[APPLE_TEXT_STYLES.body, styles.compatibilityLabel]}>
                          {t('result.compatLabel')}
                        </Text>
                        <View style={styles.compatibilityValue}>
                          <Text style={[APPLE_TEXT_STYLES.body, {
                            color: skinCompatibility[skinType].status === 'good' ? theme.success :
                                   skinCompatibility[skinType].status === 'bad' ? theme.error : theme.warning
                          }]}>
                            {skinCompatibility[skinType].status === 'good' ? t('result.compatGood') :
                             skinCompatibility[skinType].status === 'bad' ? t('result.compatBad') : t('result.compatNeutral')}
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
                        {t('result.suitableIngr')}
                      </Text>
                      <View style={styles.ingredientsTagsContainer}>
                        {analysis.ingredients
                          .filter(ing => ing.status === 'green')
                          .slice(0, 5)
                          .map((ing, idx) => (
                            <View key={idx} style={styles.ingredientTag}>
                              <Ionicons name="checkmark-circle" size={16} color={theme.success} />
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
                    {t('result.forSkinPrefix')} {t(('hair.' + hairType) as TranslationKey).toLowerCase()} {t('result.hairSuffix')}
                  </Text>
                  {hairCompatibility && hairCompatibility[hairType] && (
                    <View style={styles.compatibilityDetails}>
                      <View style={styles.compatibilityRow}>
                        <Text style={[APPLE_TEXT_STYLES.body, styles.compatibilityLabel]}>
                          {t('result.compatLabel')}
                        </Text>
                        <View style={styles.compatibilityValue}>
                          <Text style={[APPLE_TEXT_STYLES.body, {
                            color: hairCompatibility[hairType].status === 'good' ? theme.success :
                                   hairCompatibility[hairType].status === 'bad' ? theme.error : theme.warning
                          }]}>
                            {hairCompatibility[hairType].status === 'good' ? t('result.compatGood') :
                             hairCompatibility[hairType].status === 'bad' ? t('result.compatBad') : t('result.compatNeutral')}
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
                      <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                      <Text style={[APPLE_TEXT_STYLES.headline, styles.prosConsTitle]}>
                        {t('result.pros')}
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
                      <Ionicons name="alert-circle" size={20} color={theme.warning} />
                      <Text style={[APPLE_TEXT_STYLES.headline, styles.prosConsTitle]}>
                        {t('result.cons')}
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
                    color={analysis.hazards === 'low' ? theme.success :
                           analysis.hazards === 'medium' ? theme.warning : theme.error}
                  />
                  <Text style={[APPLE_TEXT_STYLES.headline, styles.safetyTitle]}>
                    {t('result.safetyTitle')}
                  </Text>
                </View>
                <Text style={[APPLE_TEXT_STYLES.body, styles.safetyText]}>
                  {analysis.hazards === 'low'
                    ? t('result.safetyLow')
                    : analysis.hazards === 'medium'
                    ? t('result.safetyMedium')
                    : t('result.safetyHigh')}
                </Text>
              </View>

              {/* Detailed Ingredients Info */}
              {analysis.ingredients.length > 0 && (
                <View style={styles.detailedIngredientsSection}>
                  <View style={styles.detailedIngredientsHeader}>
                    <Ionicons name="flask-outline" size={20} color={theme.primary} />
                    <Text style={[APPLE_TEXT_STYLES.headline, styles.detailedIngredientsTitle]}>
                      {t('result.ingrDetailed')}
                    </Text>
                  </View>
                  <Text style={[APPLE_TEXT_STYLES.caption1, styles.detailedIngredientsSubtitle]}>
                    {t('result.ingrTotal')} {analysis.ingredients.length}
                  </Text>
                  <View style={styles.ingredientsStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                      <Text style={[APPLE_TEXT_STYLES.caption1, styles.statText]}>
                        {t('result.ingrSafe')} {analysis.ingredients.filter(i => i.status === 'green').length}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="warning" size={16} color={theme.warning} />
                      <Text style={[APPLE_TEXT_STYLES.caption1, styles.statText]}>
                        {t('result.ingrCaution')} {analysis.ingredients.filter(i => i.status === 'yellow').length}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="alert-circle" size={16} color={theme.error} />
                      <Text style={[APPLE_TEXT_STYLES.caption1, styles.statText]}>
                        {t('result.ingrRisk')} {analysis.ingredients.filter(i => i.status === 'red').length}
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
              <Text style={[APPLE_TEXT_STYLES.caption1, styles.sectionHeader]}>{t('result.sectionCompat')}</Text>
              <View style={styles.sectionContent}>
                <TouchableOpacity
                  style={[styles.listItem, styles.listItemLast]}
                  activeOpacity={0.6}
                  onPress={() => setCompatibilityModal({
                    visible: true,
                    type: 'skin',
                    compatibility,
                    status,
                    score,
                  })}
                >
                  <View style={[styles.listIcon, { backgroundColor: style.bgColor }]}>
                    <Ionicons name={style.iconName} size={24} color={theme.textInverse} />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={[APPLE_TEXT_STYLES.body, styles.listItemTitle]}>
                      {style.label}
                    </Text>
                    <Text style={[APPLE_TEXT_STYLES.caption1, styles.listItemSubtitle]}>
                      {t('result.forSkinPrefix')} {t(('skin.' + skinType) as TranslationKey).toLowerCase()} {t('result.skinSuffix')} - {score}%
                    </Text>
                  </View>
                  <ChevronArrow color={theme.textTertiary} size={20} direction="right" />
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
              <Text style={[APPLE_TEXT_STYLES.caption1, styles.sectionHeader]}>{t('result.sectionCompat')}</Text>
              <View style={styles.sectionContent}>
                <TouchableOpacity
                  style={[styles.listItem, styles.listItemLast]}
                  activeOpacity={0.6}
                  onPress={() => setCompatibilityModal({
                    visible: true,
                    type: 'hair',
                    compatibility,
                    status,
                    score,
                  })}
                >
                  <View style={[styles.listIcon, { backgroundColor: style.bgColor }]}>
                    <Ionicons name={style.iconName} size={24} color={theme.textInverse} />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={[APPLE_TEXT_STYLES.body, styles.listItemTitle]}>
                      {style.label}
                    </Text>
                    <Text style={[APPLE_TEXT_STYLES.caption1, styles.listItemSubtitle]}>
                      {t('result.forSkinPrefix')} {t(('hair.' + hairType) as TranslationKey).toLowerCase()} {t('result.hairSuffix')} - {score}%
                    </Text>
                  </View>
                  <ChevronArrow color={theme.textTertiary} size={20} direction="right" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}

        {/* Ingredients Section */}
        {analysis.ingredients.length > 0 && (
          <View style={styles.section}>
            <Text style={[APPLE_TEXT_STYLES.caption1, styles.sectionHeader]}>{t('result.sectionIngr')}</Text>
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
                      <Ionicons name={iconName} size={24} color={theme.textInverse} />
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
                    <ChevronArrow color={theme.textTertiary} size={20} direction="right" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Comments Section */}
        <View
          style={styles.commentsContainer}
          onLayout={(event) => {
            commentsLayoutY.current = event.nativeEvent.layout.y;
          }}
        >
          <CommentSection
            productId={id as Id<'products'>}
            onInputFocus={handleCommentInputFocus}
          />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

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
                  <Ionicons name="close" size={28} color={theme.text} />
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
                      color={theme.textInverse}
                    />
                  </View>
                  <View style={styles.modalStatusBadge}>
                    <Text style={[APPLE_TEXT_STYLES.headline, {
                      color: getIconColor(selectedIngredient.status)
                    }]}>
                      {selectedIngredient.status === 'green' ? t('result.ingrStatusSafe') :
                       selectedIngredient.status === 'yellow' ? t('result.ingrStatusCaution') : t('result.ingrStatusRisk')}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                {selectedIngredient.desc && (
                  <View style={styles.modalSection}>
                    <Text style={[APPLE_TEXT_STYLES.headline, styles.modalSectionTitle]}>
                      {t('result.ingrDesc')}
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
                      <Ionicons name="person" size={20} color={theme.primary} />
                      <Text style={[APPLE_TEXT_STYLES.headline, styles.modalSectionTitle]}>
                        {t('result.forSkinPrefix')} {t(('skin.' + skinType) as TranslationKey).toLowerCase()} {t('result.skinSuffix')}
                      </Text>
                    </View>

                    {/* Benefits */}
                    <View style={styles.modalBenefitBlock}>
                      <View style={styles.modalBenefitHeader}>
                        <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                        <Text style={[APPLE_TEXT_STYLES.subhead, styles.modalBenefitTitle]}>
                          {t('result.benefitTitle')}
                        </Text>
                      </View>
                      {selectedIngredient.status === 'green' ? (
                        <Text style={[APPLE_TEXT_STYLES.body, styles.modalBenefitText]}>
                          {t('ingr.benefitGreenPrefix')} {t(('skin.' + skinType) as TranslationKey).toLowerCase()} {t('ingr.benefitGreenSuffix')}
                          {selectedIngredient.desc && ` ${selectedIngredient.desc}`}
                        </Text>
                      ) : selectedIngredient.status === 'yellow' ? (
                        <Text style={[APPLE_TEXT_STYLES.body, styles.modalBenefitText]}>
                          {t('ingr.benefitYellowPrefix')} {t(('skin.' + skinType) as TranslationKey).toLowerCase()} {t('ingr.benefitYellowSuffix')}
                        </Text>
                      ) : (
                        <Text style={[APPLE_TEXT_STYLES.body, styles.modalBenefitText]}>
                          {t('ingr.benefitRedPrefix')} {t(('skin.' + skinType) as TranslationKey).toLowerCase()} {t('ingr.benefitRedSuffix')}
                        </Text>
                      )}
                    </View>

                    {/* Risks */}
                    {selectedIngredient.status !== 'green' && (
                      <View style={styles.modalRiskBlock}>
                        <View style={styles.modalBenefitHeader}>
                          <Ionicons name="alert-circle" size={20} color={theme.warning} />
                          <Text style={[APPLE_TEXT_STYLES.subhead, styles.modalRiskTitle]}>
                            {t('result.harmTitle')}
                          </Text>
                        </View>
                        {selectedIngredient.status === 'yellow' ? (
                          <Text style={[APPLE_TEXT_STYLES.body, styles.modalRiskText]}>
                            {t('ingr.riskYellow')}
                          </Text>
                        ) : (
                          <Text style={[APPLE_TEXT_STYLES.body, styles.modalRiskText]}>
                            {t('ingr.riskRedPrefix')} {t(('skin.' + skinType) as TranslationKey).toLowerCase()} {t('ingr.riskRedSuffix')}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Specific recommendations by skin type */}
                    <View style={styles.modalRecommendationBlock}>
                      <Text style={[APPLE_TEXT_STYLES.subhead, styles.modalRecommendationTitle]}>
                        {t('result.recTitle')}
                      </Text>
                      {(skinType === 'dry' || skinType === 'oily' || skinType === 'sensitive' || skinType === 'combination' || skinType === 'normal') && (
                        <Text style={[APPLE_TEXT_STYLES.body, styles.modalRecommendationText]}>
                          {selectedIngredient.status === 'green'
                            ? t(('ingr.rec.' + skinType + '.green') as TranslationKey)
                            : t(('ingr.rec.' + skinType + '.other') as TranslationKey)}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Hair Type Analysis */}
                {hairType && (product.category === 'hair' || product.category === 'mixed') && (
                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionHeader}>
                      <Ionicons name="cut" size={20} color={theme.primary} />
                      <Text style={[APPLE_TEXT_STYLES.headline, styles.modalSectionTitle]}>
                        {t('result.forSkinPrefix')} {t(('hair.' + hairType) as TranslationKey).toLowerCase()} {t('result.hairSuffix')}
                      </Text>
                    </View>
                    <Text style={[APPLE_TEXT_STYLES.body, styles.modalSectionText]}>
                      {selectedIngredient.status === 'green'
                        ? `${t('ingr.hairGreenPrefix')} ${t(('hair.' + hairType) as TranslationKey).toLowerCase()} ${t('ingr.hairGreenSuffix')}`
                        : selectedIngredient.status === 'yellow'
                        ? `${t('ingr.hairYellowPrefix')} ${t(('hair.' + hairType) as TranslationKey).toLowerCase()} ${t('ingr.hairYellowSuffix')}`
                        : `${t('ingr.hairRedPrefix')} ${t(('hair.' + hairType) as TranslationKey).toLowerCase()} ${t('ingr.hairRedSuffix')}`}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* Compatibility Detail Modal */}
      <Modal
        visible={compatibilityModal !== null && compatibilityModal.visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCompatibilityModal(null)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          {compatibilityModal && (
            <>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setCompatibilityModal(null)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[APPLE_TEXT_STYLES.title2, styles.modalTitle]}>
                  {t('result.modalCompat')}
                </Text>
                <View style={styles.modalHeaderSpacer} />
              </View>

              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                {(() => {
                  const style = getCompatibilityStyle(compatibilityModal.status, compatibilityModal.score);
                  const typeLabel = compatibilityModal.type === 'skin'
                    ? t(('skin.' + (skinType || 'normal')) as TranslationKey)
                    : t(('hair.' + (hairType || 'normal')) as TranslationKey);
                  const description = getCompatibilityDescription(
                    compatibilityModal.type,
                    compatibilityModal.status,
                    compatibilityModal.score
                  );

                  return (
                    <>
                      {/* Compatibility Status */}
                      <View style={styles.modalIconSection}>
                        <View style={[styles.modalIconContainer, { backgroundColor: style.bgColor }]}>
                          <Ionicons name={style.iconName} size={64} color={theme.textInverse} />
                        </View>
                        <View style={styles.modalStatusBadge}>
                          <Text style={[APPLE_TEXT_STYLES.headline, {
                            color: style.iconColor
                          }]}>
                            {style.label}
                          </Text>
                          <Text style={[APPLE_TEXT_STYLES.subhead, { color: theme.textSecondary, marginTop: 4 }]}>
                            {typeLabel.toLowerCase()} - {compatibilityModal.score}%
                          </Text>
                        </View>
                      </View>

                      {/* Full Description */}
                      <View style={styles.modalSection}>
                        <Text style={[APPLE_TEXT_STYLES.headline, styles.modalSectionTitle]}>
                          {compatibilityModal.status === 'good' ? t('result.whyGood') : compatibilityModal.status === 'bad' ? t('result.whyBad') : t('result.whyNeutral')}
                        </Text>
                        <Text style={[APPLE_TEXT_STYLES.body, styles.modalSectionText]}>
                          {description}
                        </Text>
                      </View>

                      {/* Additional Benefits or Risks */}
                      {compatibilityModal.status === 'good' && analysis.pros.length > 0 && (
                        <View style={styles.modalSection}>
                          <View style={styles.modalSectionHeader}>
                            <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                            <Text style={[APPLE_TEXT_STYLES.headline, styles.modalSectionTitle]}>
                              {t('result.productBenefits')}
                            </Text>
                          </View>
                          {analysis.pros.slice(0, 3).map((pro, idx) => (
                            <View key={idx} style={styles.modalBenefitBlock}>
                              <View style={styles.modalBenefitHeader}>
                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.success, marginRight: 8 }} />
                                <Text style={[APPLE_TEXT_STYLES.body, styles.modalBenefitText]}>
                                  {pro}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {compatibilityModal.status === 'bad' && analysis.cons.length > 0 && (
                        <View style={styles.modalSection}>
                          <View style={styles.modalSectionHeader}>
                            <Ionicons name="alert-circle" size={20} color={theme.error} />
                            <Text style={[APPLE_TEXT_STYLES.headline, styles.modalSectionTitle]}>
                              {t('result.risksLimits')}
                            </Text>
                          </View>
                          {analysis.cons.slice(0, 3).map((con, idx) => (
                            <View key={idx} style={styles.modalRiskBlock}>
                              <View style={styles.modalBenefitHeader}>
                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.error, marginRight: 8 }} />
                                <Text style={[APPLE_TEXT_STYLES.body, styles.modalRiskText]}>
                                  {con}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  );
                })()}
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const createThemedStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.backgroundSecondary,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  backButtonText: {
    color: theme.primary,
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
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 18,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: theme.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  headerDescription: {
    color: theme.text,
    textAlign: 'left',
    lineHeight: 20,
    marginBottom: 12,
  },
  learnMoreButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  learnMoreText: {
    color: theme.primary,
  },
  section: {
    marginTop: 32,
    marginHorizontal: 16,
  },
  sectionHeader: {
    color: theme.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: theme.card,
    borderRadius: 10,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
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
    color: theme.text,
    marginBottom: 2,
  },
  listItemSubtitle: {
    color: theme.textSecondary,
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
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    color: theme.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    color: theme.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: theme.text,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  errorButtonText: {
    color: theme.textInverse,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.textSecondary,
    marginTop: 16,
  },
  expandedSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  expandedCard: {
    backgroundColor: theme.card,
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
    color: theme.text,
    marginLeft: 8,
  },
  analysisBlock: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  analysisBlockTitle: {
    color: theme.text,
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
    color: theme.textSecondary,
  },
  compatibilityValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    color: theme.textSecondary,
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  ingredientsForType: {
    marginTop: 16,
  },
  ingredientsForTypeTitle: {
    color: theme.text,
    marginBottom: 12,
  },
  ingredientsTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ingredientTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    marginRight: 8,
  },
  ingredientTagText: {
    color: theme.text,
    marginLeft: 6,
  },
  prosConsSection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
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
    color: theme.text,
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
    backgroundColor: theme.success,
    marginTop: 6,
    marginRight: 12,
  },
  consBullet: {
    backgroundColor: theme.warning,
  },
  prosConsText: {
    color: theme.text,
    flex: 1,
    lineHeight: 20,
  },
  safetySection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  safetyTitle: {
    color: theme.text,
    marginLeft: 8,
  },
  safetyText: {
    color: theme.text,
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
    color: theme.text,
    marginLeft: 8,
  },
  detailedIngredientsSubtitle: {
    color: theme.textSecondary,
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
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
    marginBottom: 8,
  },
  statText: {
    color: theme.text,
    marginLeft: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: theme.text,
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
    backgroundColor: theme.card,
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.backgroundSecondary,
  },
  modalSection: {
    backgroundColor: theme.card,
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
    color: theme.text,
    marginLeft: 8,
    marginBottom: 12,
  },
  modalSectionText: {
    color: theme.text,
    lineHeight: 22,
  },
  modalBenefitBlock: {
    backgroundColor: theme.primaryLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.success,
  },
  modalBenefitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalBenefitTitle: {
    color: theme.text,
    marginLeft: 8,
    fontWeight: '600',
  },
  modalBenefitText: {
    color: theme.text,
    lineHeight: 22,
  },
  modalRiskBlock: {
    backgroundColor: theme.primaryLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.warning,
  },
  modalRiskTitle: {
    color: theme.text,
    marginLeft: 8,
    fontWeight: '600',
  },
  modalRiskText: {
    color: theme.text,
    lineHeight: 22,
  },
  modalRecommendationBlock: {
    backgroundColor: theme.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  modalRecommendationTitle: {
    color: theme.text,
    marginBottom: 8,
    fontWeight: '600',
  },
  modalRecommendationText: {
    color: theme.text,
    lineHeight: 22,
  },
  commentsContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
  },
});
