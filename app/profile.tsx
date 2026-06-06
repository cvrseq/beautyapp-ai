import { ChevronArrow } from '@/components/ChevronArrow';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { TranslationKey } from '@/constants/i18n';
import { useHairType } from '@/hooks/useHairType';
import { useSkinType } from '@/hooks/useSkinType';
import { useAge } from '@/hooks/useAge';
import { useLifestyle } from '@/hooks/useLifestyle';
import { useLocation } from '@/hooks/useLocation';
import { useLocale } from '@/hooks/useLocale';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, Theme } from '@/hooks/useTheme';

export default function ProfileScreen() {
  const { skinType, isLoading: isLoadingSkin, loadSkinType } = useSkinType();
  const { hairType, isLoading: isLoadingHair, loadHairType } = useHairType();
  const { age, isLoading: isLoadingAge, loadAge } = useAge();
  const { lifestyle, isLoading: isLoadingLifestyle, loadLifestyle } = useLifestyle();
  const { location, isLoading: isLoadingLocation, loadLocation } = useLocation();
  const { theme } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => createThemedStyles(theme), [theme]);

  useFocusEffect(
    useCallback(() => {
      loadSkinType();
      loadHairType();
      loadAge();
      loadLifestyle();
      loadLocation();
    }, [loadSkinType, loadHairType, loadAge, loadLifestyle, loadLocation])
  );

  const summaryParts = [
    skinType && `${t('home.skinType')}: ${t(('skin.' + skinType) as TranslationKey).toLowerCase()}`,
    hairType && `${t('home.hairType')}: ${t(('hair.' + hairType) as TranslationKey).toLowerCase()}`,
    age && `${t('home.age')}: ${t(('age.' + age) as TranslationKey)}`,
    lifestyle && `${t('home.lifestyle')}: ${t(('lifestyle.' + lifestyle) as TranslationKey).toLowerCase()}`,
    location && `${t('home.location')}: ${t(('location.' + location) as TranslationKey)}`,
  ].filter(Boolean).join('. ');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
          <ChevronArrow color={theme.primary} size={20} direction="left" />
          <Text style={[APPLE_TEXT_STYLES.body, styles.backButtonText]}>
            Beauty AI
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.headerCard}>
            <View style={styles.headerIcon}>
              <Ionicons name="person-circle" size={64} color={theme.primary} />
            </View>
            <Text style={[APPLE_TEXT_STYLES.largeTitle, styles.headerTitle]}>
              Beauty Profile
            </Text>
            <Text style={[APPLE_TEXT_STYLES.callout, styles.headerSubtitle]}>
              {t('profile.subtitle')}
            </Text>
          </View>
        </View>

        {/* Skin Type Section */}
        <View style={styles.section}>
          <Text style={[APPLE_TEXT_STYLES.caption1, styles.sectionHeader]}>
            {t('profile.skinHeader')}
          </Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={[styles.listItem, styles.listItemLast]}
              onPress={() => router.push('/skin-type-quiz')}
              activeOpacity={0.6}
            >
              <View style={styles.listIcon}>
                <Ionicons name="person-circle-outline" size={24} color={theme.primary} />
              </View>
              <View style={styles.listItemContent}>
                <Text style={[APPLE_TEXT_STYLES.body, styles.listItemTitle]}>
                  {t('home.skinType')}
                </Text>
                <Text style={[APPLE_TEXT_STYLES.caption1, styles.listItemSubtitle]}>
                  {isLoadingSkin
                    ? t('loading')
                    : skinType
                      ? t(('skin.' + skinType) as TranslationKey)
                      : t('notSet')}
                </Text>
              </View>
              <ChevronArrow color={theme.textTertiary} size={20} direction="right" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hair Type Section */}
        <View style={styles.section}>
          <Text style={[APPLE_TEXT_STYLES.caption1, styles.sectionHeader]}>
            {t('profile.hairHeader')}
          </Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={[styles.listItem, styles.listItemLast]}
              onPress={() => router.push('/hair-type-quiz')}
              activeOpacity={0.6}
            >
              <View style={styles.listIcon}>
                <Ionicons name="cut-outline" size={24} color={theme.primary} />
              </View>
              <View style={styles.listItemContent}>
                <Text style={[APPLE_TEXT_STYLES.body, styles.listItemTitle]}>
                  {t('home.hairType')}
                </Text>
                <Text style={[APPLE_TEXT_STYLES.caption1, styles.listItemSubtitle]}>
                  {isLoadingHair
                    ? t('loading')
                    : hairType
                      ? t(('hair.' + hairType) as TranslationKey)
                      : t('notSet')}
                </Text>
              </View>
              <ChevronArrow color={theme.textTertiary} size={20} direction="right" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional Info Section */}
        <View style={styles.section}>
          <Text style={[APPLE_TEXT_STYLES.caption1, styles.sectionHeader]}>
            {t('profile.extraHeader')}
          </Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => router.push('/age-quiz')}
              activeOpacity={0.6}
            >
              <View style={styles.listIcon}>
                <Ionicons name="calendar-outline" size={24} color={theme.primary} />
              </View>
              <View style={styles.listItemContent}>
                <Text style={[APPLE_TEXT_STYLES.body, styles.listItemTitle]}>
                  {t('home.age')}
                </Text>
                <Text style={[APPLE_TEXT_STYLES.caption1, styles.listItemSubtitle]}>
                  {isLoadingAge
                    ? t('loading')
                    : age
                      ? t(('age.' + age) as TranslationKey)
                      : t('notSpecifiedM')}
                </Text>
              </View>
              <ChevronArrow color={theme.textTertiary} size={20} direction="right" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.listItem}
              onPress={() => router.push('/lifestyle-quiz')}
              activeOpacity={0.6}
            >
              <View style={styles.listIcon}>
                <Ionicons name="fitness-outline" size={24} color={theme.primary} />
              </View>
              <View style={styles.listItemContent}>
                <Text style={[APPLE_TEXT_STYLES.body, styles.listItemTitle]}>
                  {t('home.lifestyle')}
                </Text>
                <Text style={[APPLE_TEXT_STYLES.caption1, styles.listItemSubtitle]}>
                  {isLoadingLifestyle
                    ? t('loading')
                    : lifestyle
                      ? t(('lifestyle.' + lifestyle) as TranslationKey)
                      : t('notSpecifiedM')}
                </Text>
              </View>
              <ChevronArrow color={theme.textTertiary} size={20} direction="right" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.listItem, styles.listItemLast]}
              onPress={() => router.push('/location-quiz')}
              activeOpacity={0.6}
            >
              <View style={styles.listIcon}>
                <Ionicons name="location-outline" size={24} color={theme.primary} />
              </View>
              <View style={styles.listItemContent}>
                <Text style={[APPLE_TEXT_STYLES.body, styles.listItemTitle]}>
                  {t('home.location')}
                </Text>
                <Text style={[APPLE_TEXT_STYLES.caption1, styles.listItemSubtitle]}>
                  {isLoadingLocation
                    ? t('loading')
                    : location
                      ? t(('location.' + location) as TranslationKey)
                      : t('notSpecifiedF')}
                </Text>
              </View>
              <ChevronArrow color={theme.textTertiary} size={20} direction="right" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Card */}
        {(skinType || hairType || age || lifestyle || location) && (
          <View style={styles.summarySection}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="checkmark-circle" size={24} color={theme.success} />
                <Text style={[APPLE_TEXT_STYLES.headline, styles.summaryTitle]}>
                  {t('profile.configured')}
                </Text>
              </View>
              <Text style={[APPLE_TEXT_STYLES.body, styles.summaryText]}>
                {summaryParts}.
              </Text>
              <Text style={[APPLE_TEXT_STYLES.caption1, styles.summarySubtext]}>
                {t('profile.configuredSub')}
              </Text>
            </View>
          </View>
        )}

        {/* Empty State */}
        {!skinType && !hairType && !age && !lifestyle && !location &&
         !isLoadingSkin && !isLoadingHair && !isLoadingAge && !isLoadingLifestyle && !isLoadingLocation && (
          <View style={styles.emptySection}>
            <View style={styles.emptyCard}>
              <Ionicons name="person-circle-outline" size={48} color={theme.textSecondary} />
              <Text style={[APPLE_TEXT_STYLES.headline, styles.emptyTitle]}>
                {t('profile.emptyTitle')}
              </Text>
              <Text style={[APPLE_TEXT_STYLES.body, styles.emptyText]}>
                {t('profile.emptyText')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createThemedStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
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
    padding: 24,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 16,
  },
  headerTitle: {
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: theme.textSecondary,
    textAlign: 'center',
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
    backgroundColor: theme.backgroundSecondary,
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
  summarySection: {
    marginTop: 32,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  summaryCard: {
    backgroundColor: theme.primaryLight,
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: theme.success,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    color: theme.text,
    marginLeft: 8,
  },
  summaryText: {
    color: theme.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  summarySubtext: {
    color: theme.textSecondary,
    lineHeight: 18,
  },
  emptySection: {
    marginTop: 32,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  emptyCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
