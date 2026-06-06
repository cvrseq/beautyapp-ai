import { ChevronArrow } from '@/components/ChevronArrow';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { useAge } from '@/hooks/useAge';
import { useAuth } from '@/hooks/useAuth';
import { useHairType } from '@/hooks/useHairType';
import { useLifestyle } from '@/hooks/useLifestyle';
import { useLocale } from '@/hooks/useLocale';
import { useLocation } from '@/hooks/useLocation';
import { useSkinType } from '@/hooks/useSkinType';
import { useTheme, Theme } from '@/hooks/useTheme';
import { HAIR_TYPE_SHORT_LABELS } from '@/types/hairType';
import { SKIN_TYPE_SHORT_LABELS } from '@/types/skinType';
import { AGE_RANGE_LABELS, LIFESTYLE_LABELS, LOCATION_LABELS } from '@/types/userProfile';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { skinType, isLoading: isLoadingSkin, loadSkinType } = useSkinType();
  const { hairType, isLoading: isLoadingHair, loadHairType } = useHairType();
  const { age, isLoading: isLoadingAge, loadAge } = useAge();
  const { lifestyle, isLoading: isLoadingLifestyle, loadLifestyle } = useLifestyle();
  const { location, isLoading: isLoadingLocation, loadLocation } = useLocation();
  const { user } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const { t, locale, toggleLocale } = useLocale();

  const themedStyles = useMemo(() => createThemedStyles(theme), [theme]);

  useFocusEffect(
    useCallback(() => {
      loadSkinType();
      loadHairType();
      loadAge();
      loadLifestyle();
      loadLocation();
    }, [loadSkinType, loadHairType, loadAge, loadLifestyle, loadLocation])
  );

  return (
    <SafeAreaView style={themedStyles.container} edges={['top']}>
      <ScrollView style={themedStyles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={themedStyles.header}>
          <Text style={[APPLE_TEXT_STYLES.largeTitle, themedStyles.title]}>
            Beauty AI
          </Text>
          <View style={themedStyles.headerActions}>
            {/* Locale Toggle */}
            <TouchableOpacity
              style={themedStyles.themeButton}
              onPress={toggleLocale}
              activeOpacity={0.7}
            >
              <Text style={[APPLE_TEXT_STYLES.footnote, { color: theme.primary, fontWeight: '700' }]}>
                {locale === 'ru' ? 'EN' : 'RU'}
              </Text>
            </TouchableOpacity>
            {/* Theme Toggle */}
            <TouchableOpacity
              style={themedStyles.themeButton}
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isDark ? 'sunny' : 'moon'}
                size={24}
                color={theme.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={themedStyles.searchBar}
          onPress={() => router.push('/search')}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={18} color={theme.textSecondary} style={themedStyles.searchIcon} />
          <Text style={[APPLE_TEXT_STYLES.body, themedStyles.searchPlaceholder]}>
            {t('home.search')}
          </Text>
          <Ionicons name="mic-outline" size={18} color={theme.textSecondary} style={themedStyles.micIcon} />
        </TouchableOpacity>

        {/* Profile Card */}
        <TouchableOpacity
          style={themedStyles.profileCard}
          onPress={() => router.push('/profile')}
          activeOpacity={0.7}
        >
          <View style={themedStyles.profileIconContainer}>
            <View style={[themedStyles.profileIconOuter, { borderColor: theme.primary }]}>
              <View style={themedStyles.profileIconInner}>
                <Ionicons name="person-circle" size={28} color={theme.primary} />
              </View>
            </View>
          </View>
          <View style={themedStyles.profileContent}>
            <Text style={[APPLE_TEXT_STYLES.headline, themedStyles.profileTitle]}>
              Beauty Profile
            </Text>
            <Text style={[APPLE_TEXT_STYLES.subhead, themedStyles.profileSubtitle]}>
              {skinType || hairType
                ? `${skinType ? SKIN_TYPE_SHORT_LABELS[skinType] : ''}${skinType && hairType ? ', ' : ''}${hairType ? HAIR_TYPE_SHORT_LABELS[hairType] : ''}`
                : t('home.profileSetup')}
            </Text>
          </View>
          <ChevronArrow color={theme.textTertiary} size={20} direction="right" />
        </TouchableOpacity>

        {/* Main Actions Section */}
        <View style={themedStyles.section}>
          <SettingsItem
            icon="scan-circle"
            iconColor={theme.primary}
            title={t('home.scanner')}
            subtitle={t('home.scannerSub')}
            onPress={() => router.push('/camera')}
            isLast={true}
            theme={theme}
          />
        </View>

        {/* Profile Settings Section */}
        <View style={themedStyles.section}>
          <SettingsItem
            icon="person-circle-outline"
            iconColor={theme.textSecondary}
            title={t('home.skinType')}
            subtitle={skinType ? SKIN_TYPE_SHORT_LABELS[skinType] : t('notSet')}
            onPress={() => router.push('/skin-type-quiz')}
            showPrompt={!skinType && !isLoadingSkin}
            isLast={false}
            theme={theme}
          />
          <SettingsItem
            icon="cut-outline"
            iconColor={theme.textSecondary}
            title={t('home.hairType')}
            subtitle={hairType ? HAIR_TYPE_SHORT_LABELS[hairType] : t('notSet')}
            onPress={() => router.push('/hair-type-quiz')}
            showPrompt={!hairType && !isLoadingHair}
            isLast={false}
            theme={theme}
          />
          <SettingsItem
            icon="calendar-outline"
            iconColor={theme.textSecondary}
            title={t('home.age')}
            subtitle={age ? AGE_RANGE_LABELS[age] : t('notSpecifiedM')}
            onPress={() => router.push('/age-quiz')}
            showPrompt={!age && !isLoadingAge}
            isLast={false}
            theme={theme}
          />
          <SettingsItem
            icon="fitness-outline"
            iconColor={theme.textSecondary}
            title={t('home.lifestyle')}
            subtitle={lifestyle ? LIFESTYLE_LABELS[lifestyle] : t('notSpecifiedM')}
            onPress={() => router.push('/lifestyle-quiz')}
            showPrompt={!lifestyle && !isLoadingLifestyle}
            isLast={false}
            theme={theme}
          />
          <SettingsItem
            icon="location-outline"
            iconColor={theme.textSecondary}
            title={t('home.location')}
            subtitle={location ? LOCATION_LABELS[location] : t('notSpecifiedF')}
            onPress={() => router.push('/location-quiz')}
            showPrompt={!location && !isLoadingLocation}
            isLast={true}
            theme={theme}
          />
        </View>

        {/* History Section */}
        <View style={themedStyles.section}>
          <SettingsItem
            icon="images-outline"
            iconColor={theme.textSecondary}
            title={t('home.history')}
            subtitle={t('home.historySub')}
            onPress={() => router.push('/scan-history')}
            isLast={true}
            theme={theme}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showPrompt?: boolean;
  isLast?: boolean;
  theme: Theme;
}

const SettingsItem = ({ icon, iconColor, title, subtitle, onPress, showPrompt, isLast = false, theme }: SettingsItemProps) => {
  const styles = useMemo(() => createThemedStyles(theme), [theme]);

  return (
    <TouchableOpacity
      style={[styles.settingsItem, isLast && styles.settingsItemLast]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={[styles.settingsIcon, showPrompt && styles.settingsIconPrompt]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.settingsContent}>
        <Text style={[APPLE_TEXT_STYLES.body, styles.settingsTitle]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[APPLE_TEXT_STYLES.caption1, styles.settingsSubtitle]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <ChevronArrow color={theme.textTertiary} size={20} direction="right" />
    </TouchableOpacity>
  );
};

const createThemedStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    color: theme.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.searchBar,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 36,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    flex: 1,
    color: theme.textSecondary,
  },
  micIcon: {
    marginLeft: 8,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
  },
  profileIconContainer: {
    marginRight: 12,
  },
  profileIconOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContent: {
    flex: 1,
    marginRight: 8,
  },
  profileTitle: {
    color: theme.text,
    marginBottom: 4,
  },
  profileSubtitle: {
    color: theme.textSecondary,
  },
  section: {
    backgroundColor: theme.card,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 32,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  settingsItemLast: {
    borderBottomWidth: 0,
  },
  settingsIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingsIconPrompt: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 16,
  },
  settingsContent: {
    flex: 1,
    marginRight: 8,
  },
  settingsTitle: {
    color: theme.text,
    marginBottom: 2,
  },
  settingsSubtitle: {
    color: theme.textSecondary,
  },
});
