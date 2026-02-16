import { ChevronArrow } from '@/components/ChevronArrow';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { useHairType } from '@/hooks/useHairType';
import { useSkinType } from '@/hooks/useSkinType';
import { useAge } from '@/hooks/useAge';
import { useLifestyle } from '@/hooks/useLifestyle';
import { useLocation } from '@/hooks/useLocation';
import { HAIR_TYPE_SHORT_LABELS } from '@/types/hairType';
import { SKIN_TYPE_SHORT_LABELS } from '@/types/skinType';
import { AGE_RANGE_LABELS, LIFESTYLE_LABELS, LOCATION_LABELS } from '@/types/userProfile';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { skinType, isLoading: isLoadingSkin, loadSkinType } = useSkinType();
  const { hairType, isLoading: isLoadingHair, loadHairType } = useHairType();
  const { age, isLoading: isLoadingAge, loadAge } = useAge();
  const { lifestyle, isLoading: isLoadingLifestyle, loadLifestyle } = useLifestyle();
  const { location, isLoading: isLoadingLocation, loadLocation } = useLocation();

  // Обновляем данные при возврате на экран
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[APPLE_TEXT_STYLES.largeTitle, styles.title]}>
            Beauty AI
          </Text>
        </View>

        {/* Search Bar */}
        <TouchableOpacity 
          style={styles.searchBar}
          onPress={() => router.push('/search')}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={18} color="#8E8E93" style={styles.searchIcon} />
          <Text style={[APPLE_TEXT_STYLES.body, styles.searchPlaceholder]}>
            Введи запрос
          </Text>
          <Ionicons name="mic-outline" size={18} color="#8E8E93" style={styles.micIcon} />
        </TouchableOpacity>

        {/* Profile Card */}
        <TouchableOpacity 
          style={styles.profileCard}
          onPress={() => router.push('/profile')}
          activeOpacity={0.7}
        >
            <View style={styles.profileIconContainer}>
              <View style={styles.profileIconOuter}>
                <View style={styles.profileIconInner}>
                  <Ionicons name="person-circle" size={28} color="#007AFF" />
                </View>
              </View>
            </View>
            <View style={styles.profileContent}>
              <Text style={[APPLE_TEXT_STYLES.headline, styles.profileTitle]}>
                Beauty Profile
              </Text>
              <Text style={[APPLE_TEXT_STYLES.subhead, styles.profileSubtitle]}>
                {skinType || hairType 
                  ? `${skinType ? SKIN_TYPE_SHORT_LABELS[skinType] : ''}${skinType && hairType ? ', ' : ''}${hairType ? HAIR_TYPE_SHORT_LABELS[hairType] : ''}`
                  : 'Настрой свой профиль для персонализированных рекомендаций'}
              </Text>
            </View>
            <ChevronArrow color="#C7C7CC" size={20} direction="right" />
          </TouchableOpacity>

        {/* Main Actions Section */}
        <View style={styles.section}>
          <SettingsItem
            icon="scan-circle"
            iconColor="#007AFF"
            title="Умный сканер"
            subtitle="Наведи камеру на состав продукта"
            onPress={() => router.push('/camera')}
            isLast={true}
          />
        </View>

        {/* Profile Settings Section */}
        <View style={styles.section}>
          <SettingsItem
            icon="person-circle-outline"
            iconColor="#8E8E93"
            title="Тип кожи"
            subtitle={skinType ? SKIN_TYPE_SHORT_LABELS[skinType] : 'Не настроено'}
            onPress={() => router.push('/skin-type-quiz')}
            showPrompt={!skinType && !isLoadingSkin}
            isLast={false}
          />
          <SettingsItem
            icon="cut-outline"
            iconColor="#8E8E93"
            title="Тип волос"
            subtitle={hairType ? HAIR_TYPE_SHORT_LABELS[hairType] : 'Не настроено'}
            onPress={() => router.push('/hair-type-quiz')}
            showPrompt={!hairType && !isLoadingHair}
            isLast={false}
          />
          <SettingsItem
            icon="calendar-outline"
            iconColor="#8E8E93"
            title="Возраст"
            subtitle={age ? AGE_RANGE_LABELS[age] : 'Не указан'}
            onPress={() => router.push('/age-quiz')}
            showPrompt={!age && !isLoadingAge}
            isLast={false}
          />
          <SettingsItem
            icon="fitness-outline"
            iconColor="#8E8E93"
            title="Образ жизни"
            subtitle={lifestyle ? LIFESTYLE_LABELS[lifestyle] : 'Не указан'}
            onPress={() => router.push('/lifestyle-quiz')}
            showPrompt={!lifestyle && !isLoadingLifestyle}
            isLast={false}
          />
          <SettingsItem
            icon="location-outline"
            iconColor="#8E8E93"
            title="Локация"
            subtitle={location ? LOCATION_LABELS[location] : 'Не указана'}
            onPress={() => router.push('/location-quiz')}
            showPrompt={!location && !isLoadingLocation}
            isLast={true}
          />
        </View>

        {/* History Section */}
        <View style={styles.section}>
          <SettingsItem
            icon="images-outline"
            iconColor="#8E8E93"
            title="История сканов"
            subtitle="Просмотр сохранённых продуктов"
            onPress={() => router.push('/scan-history')}
            isLast={true}
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
}

const SettingsItem = ({ icon, iconColor, title, subtitle, onPress, showPrompt, isLast = false }: SettingsItemProps) => {
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
      <ChevronArrow color="#C7C7CC" size={20} direction="right" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    color: '#000000',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
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
    color: '#8E8E93',
  },
  micIcon: {
    marginLeft: 8,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContent: {
    flex: 1,
    marginRight: 8,
  },
  profileTitle: {
    color: '#000000',
    marginBottom: 4,
  },
  profileSubtitle: {
    color: '#8E8E93',
  },
  section: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
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
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
  },
  settingsContent: {
    flex: 1,
    marginRight: 8,
  },
  settingsTitle: {
    color: '#000000',
    marginBottom: 2,
  },
  settingsSubtitle: {
    color: '#8E8E93',
  },
});
