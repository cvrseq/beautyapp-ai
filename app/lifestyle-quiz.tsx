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
import { useLifestyle } from '@/hooks/useLifestyle';
import { getLifestyleOptions, Lifestyle } from '@/types/userProfile';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronArrow } from '@/components/ChevronArrow';

const LIFESTYLES = getLifestyleOptions();

export default function LifestyleQuizScreen() {
  const [selectedLifestyle, setSelectedLifestyle] = useState<Lifestyle | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { lifestyle, saveLifestyle, isLoading } = useLifestyle();

  useEffect(() => {
    if (!isLoading && lifestyle) {
      setSelectedLifestyle(lifestyle);
    }
  }, [lifestyle, isLoading]);

  const handleSelect = async (value: Lifestyle) => {
    if (isSaving) return;

    setSelectedLifestyle(value);

    try {
      setIsSaving(true);
      await saveLifestyle(value);

      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      }, 300);
    } catch (error) {
      console.error('Ошибка сохранения образа жизни:', error);
      alert('Не удалось сохранить образ жизни. Попробуйте ещё раз.');
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
          Образ жизни
        </Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Lifestyle Section */}
        <View style={styles.section}>
          {LIFESTYLES.map((item, index) => {
            const isSelected = selectedLifestyle === item.id;
            const isLast = index === LIFESTYLES.length - 1;

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.listItem, isLast && styles.listItemLast]}
                onPress={() => handleSelect(item.id)}
                activeOpacity={0.6}
                disabled={isSaving}
              >
                <View style={styles.listIcon}>
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={22} color="#007AFF" />
                </View>
                <View style={styles.listItemContent}>
                  <Text style={[APPLE_TEXT_STYLES.body, styles.listItemTitle]}>
                    {item.label}
                  </Text>
                  <Text style={[APPLE_TEXT_STYLES.caption1, styles.listItemSubtitle]}>
                    {item.desc}
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
            Образ жизни влияет на состояние кожи. Стресс, активность и время на улице — всё это учитывается при анализе.
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
  },
  listItemTitle: {
    color: '#000000',
    marginBottom: 2,
  },
  listItemSubtitle: {
    color: '#8E8E93',
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
