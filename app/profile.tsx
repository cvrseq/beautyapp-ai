import { ChevronArrow } from '@/components/ChevronArrow';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { useHairType } from '@/hooks/useHairType';
import { useSkinType } from '@/hooks/useSkinType';
import { HAIR_TYPE_LABELS } from '@/types/hairType';
import { SKIN_TYPE_LABELS } from '@/types/skinType';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { skinType, isLoading: isLoadingSkin, loadSkinType } = useSkinType();
  const { hairType, isLoading: isLoadingHair, loadHairType } = useHairType();

  // Обновляем данные при возврате на экран
  useFocusEffect(
    useCallback(() => {
      loadSkinType();
      loadHairType();
    }, [loadSkinType, loadHairType])
  );

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
              <Ionicons name="person-circle" size={64} color="#007AFF" />
            </View>
            <Text style={[APPLE_TEXT_STYLES.largeTitle, styles.headerTitle]}>
              Beauty Profile
            </Text>
            <Text style={[APPLE_TEXT_STYLES.callout, styles.headerSubtitle]}>
              Персонализированные настройки для лучших рекомендаций
            </Text>
          </View>
        </View>

        {/* Skin Type Section */}
        <View style={styles.section}>
          <Text style={[APPLE_TEXT_STYLES.caption1, styles.sectionHeader]}>ТИП КОЖИ</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={[styles.listItem, styles.listItemLast]}
              onPress={() => router.push('/skin-type-quiz')}
              activeOpacity={0.6}
            >
              <View style={styles.listIcon}>
                <Ionicons name="person-circle-outline" size={24} color="#007AFF" />
              </View>
              <View style={styles.listItemContent}>
                <Text style={[APPLE_TEXT_STYLES.body, styles.listItemTitle]}>
                  Тип кожи
                </Text>
                {isLoadingSkin ? (
                  <Text style={[APPLE_TEXT_STYLES.caption1, styles.listItemSubtitle]}>
                    Загрузка...
                  </Text>
                ) : skinType ? (
                  <Text style={[APPLE_TEXT_STYLES.caption1, styles.listItemSubtitle]}>
                    {SKIN_TYPE_LABELS[skinType]}
                  </Text>
                ) : (
                  <Text style={[APPLE_TEXT_STYLES.caption1, styles.listItemSubtitle]}>
                    Не настроено
                  </Text>
                )}
              </View>
              <ChevronArrow color="#C7C7CC" size={20} direction="right" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hair Type Section */}
        <View style={styles.section}>
          <Text style={[APPLE_TEXT_STYLES.caption1, styles.sectionHeader]}>ТИП ВОЛОС</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={[styles.listItem, styles.listItemLast]}
              onPress={() => router.push('/hair-type-quiz')}
              activeOpacity={0.6}
            >
              <View style={styles.listIcon}>
                <Ionicons name="cut-outline" size={24} color="#007AFF" />
              </View>
              <View style={styles.listItemContent}>
                <Text style={[APPLE_TEXT_STYLES.body, styles.listItemTitle]}>
                  Тип волос
                </Text>
                {isLoadingHair ? (
                  <Text style={[APPLE_TEXT_STYLES.caption1, styles.listItemSubtitle]}>
                    Загрузка...
                  </Text>
                ) : hairType ? (
                  <Text style={[APPLE_TEXT_STYLES.caption1, styles.listItemSubtitle]}>
                    {HAIR_TYPE_LABELS[hairType]}
                  </Text>
                ) : (
                  <Text style={[APPLE_TEXT_STYLES.caption1, styles.listItemSubtitle]}>
                    Не настроено
                  </Text>
                )}
              </View>
              <ChevronArrow color="#C7C7CC" size={20} direction="right" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Card */}
        {(skinType || hairType) && (
          <View style={styles.summarySection}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                <Text style={[APPLE_TEXT_STYLES.headline, styles.summaryTitle]}>
                  Профиль настроен
                </Text>
              </View>
              <Text style={[APPLE_TEXT_STYLES.body, styles.summaryText]}>
                {skinType && hairType
                  ? `Ваш тип кожи: ${SKIN_TYPE_LABELS[skinType].toLowerCase()}. Ваш тип волос: ${HAIR_TYPE_LABELS[hairType].toLowerCase()}.`
                  : skinType
                  ? `Ваш тип кожи: ${SKIN_TYPE_LABELS[skinType].toLowerCase()}.`
                  : `Ваш тип волос: ${HAIR_TYPE_LABELS[hairType].toLowerCase()}.`}
              </Text>
              <Text style={[APPLE_TEXT_STYLES.caption1, styles.summarySubtext]}>
                Эти данные используются для персонализированных рекомендаций при анализе продуктов.
              </Text>
            </View>
          </View>
        )}

        {/* Empty State */}
        {!skinType && !hairType && !isLoadingSkin && !isLoadingHair && (
          <View style={styles.emptySection}>
            <View style={styles.emptyCard}>
              <Ionicons name="person-circle-outline" size={48} color="#8E8E93" />
              <Text style={[APPLE_TEXT_STYLES.headline, styles.emptyTitle]}>
                Профиль не настроен
              </Text>
              <Text style={[APPLE_TEXT_STYLES.body, styles.emptyText]}>
                Настройте тип кожи и волос для получения персонализированных рекомендаций
              </Text>
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
    padding: 24,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 16,
  },
  headerTitle: {
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#8E8E93',
    textAlign: 'center',
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
    backgroundColor: '#F2F2F7',
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
  summarySection: {
    marginTop: 32,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  summaryCard: {
    backgroundColor: '#F0F9F4',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    color: '#000000',
    marginLeft: 8,
  },
  summaryText: {
    color: '#000000',
    marginBottom: 8,
    lineHeight: 22,
  },
  summarySubtext: {
    color: '#8E8E93',
    lineHeight: 18,
  },
  emptySection: {
    marginTop: 32,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});
