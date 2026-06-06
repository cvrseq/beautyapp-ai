import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSkinType } from '@/hooks/useSkinType';
import { getSkinTypeOptions, SkinType } from '@/types/skinType';
import { TranslationKey } from '@/constants/i18n';
import { useLocale } from '@/hooks/useLocale';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronArrow } from '@/components/ChevronArrow';
import { useTheme, Theme } from '@/hooks/useTheme';

const SKIN_TYPES = getSkinTypeOptions();

export default function SkinTypeQuizScreen() {
  const [selectedType, setSelectedType] = useState<SkinType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { skinType, saveSkinType, isLoading } = useSkinType();
  const { theme } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => createThemedStyles(theme), [theme]);

  useEffect(() => {
    if (!isLoading && skinType) {
      setSelectedType(skinType);
    }
  }, [skinType, isLoading]);

  const handleSelect = async (type: SkinType) => {
    if (isSaving) return;
    setSelectedType(type);
    try {
      setIsSaving(true);
      await saveSkinType(type);
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      }, 300);
    } catch (error) {
      console.error('Failed to save skin type:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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

      <View style={styles.header}>
        <Text style={[APPLE_TEXT_STYLES.largeTitle, styles.title]}>
          {t('quiz.skin.title')}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {SKIN_TYPES.map((type, index) => {
            const isSelected = selectedType === type.id;
            const isLast = index === SKIN_TYPES.length - 1;

            return (
              <TouchableOpacity
                key={type.id}
                style={[styles.listItem, isLast && styles.listItemLast]}
                onPress={() => handleSelect(type.id)}
                activeOpacity={0.6}
                disabled={isSaving}
              >
                <View style={styles.listItemContent}>
                  <Text style={[APPLE_TEXT_STYLES.body, styles.listItemTitle]}>
                    {t(('skin.' + type.id) as TranslationKey)}
                  </Text>
                  <Text style={[APPLE_TEXT_STYLES.caption1, styles.listItemSubtitle]}>
                    {t(('skin.desc.' + type.id) as TranslationKey)}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark" size={22} color={theme.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.descriptionSection}>
          <Text style={[APPLE_TEXT_STYLES.subhead, styles.descriptionText]}>
            {t('quiz.skin.desc')}
          </Text>
        </View>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: theme.backgroundSecondary,
  },
  title: {
    color: theme.text,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: theme.card,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 32,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  listItemLast: {
    borderBottomWidth: 0,
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
  descriptionSection: {
    backgroundColor: theme.card,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
  },
  descriptionText: {
    color: theme.textSecondary,
    lineHeight: 20,
  },
});
