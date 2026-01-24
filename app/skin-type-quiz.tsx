import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSkinType } from '@/hooks/useSkinType';
import { getSkinTypeOptions, SkinType } from '@/types/skinType';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronArrow } from '@/components/ChevronArrow';

const SKIN_TYPES = getSkinTypeOptions();

export default function SkinTypeQuizScreen() {
  const [selectedType, setSelectedType] = useState<SkinType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { skinType, saveSkinType, isLoading } = useSkinType();

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
      
      // Возвращаемся назад через небольшую задержку для лучшего UX
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      }, 300);
    } catch (error) {
      console.error('Ошибка сохранения типа кожи:', error);
      alert('Не удалось сохранить тип кожи. Попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
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
            } else {
              router.replace('/');
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

      {/* Header */}
      <View style={styles.header}>
        <Text style={[APPLE_TEXT_STYLES.largeTitle, styles.title]}>
          Тип кожи
        </Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Skin Types Section */}
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
                    {type.label}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark" size={22} color="#007AFF" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Description Section */}
        <View style={styles.descriptionSection}>
          <Text style={[APPLE_TEXT_STYLES.subhead, styles.descriptionText]}>
            Выберите тип кожи, чтобы мы могли подобрать для вас идеальную косметику и предупредить о неподходящих продуктах.
          </Text>
        </View>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#F2F2F7',
  },
  title: {
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  listItemLast: {
    borderBottomWidth: 0,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    color: '#000000',
  },
  descriptionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
  },
  descriptionText: {
    color: '#8E8E93',
    lineHeight: 20,
  },
});

