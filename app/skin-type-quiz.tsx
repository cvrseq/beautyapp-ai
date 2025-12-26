import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSkinType } from '@/hooks/useSkinType';

const SKIN_TYPES = [
  { id: 'dry', label: 'Сухая', icon: 'water-outline', desc: 'Чувство стянутости, шелушение' },
  { id: 'oily', label: 'Жирная', icon: 'flash-outline', desc: 'Блеск, расширенные поры' },
  { id: 'combination', label: 'Комбинированная', icon: 'layers-outline', desc: 'Сухость на щеках, жирность в Т-зоне' },
  { id: 'normal', label: 'Нормальная', icon: 'checkmark-circle-outline', desc: 'Сбалансированная, без проблем' },
  { id: 'sensitive', label: 'Чувствительная', icon: 'heart-outline', desc: 'Покраснения, раздражения' },
];

export default function SkinTypeQuizScreen() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { saveSkinType } = useSkinType();

  const handleSave = async () => {
    if (!selectedType) return;

    try {
      setIsSaving(true);
      await saveSkinType(selectedType as any);
      
      // Возвращаемся назад или на главный экран
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/');
      }
    } catch (error) {
      console.error('Ошибка сохранения типа кожи:', error);
      alert('Не удалось сохранить тип кожи. Попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 p-6">
        <View className="mb-8 pt-12">
          <Text className="text-pink-500 font-bold uppercase tracking-widest text-xs mb-2">
            Персональная настройка
          </Text>
          <Text className="text-3xl font-black text-slate-900 mb-2">
            Какой у тебя тип кожи?
          </Text>
          <Text className="text-slate-600 text-base leading-6">
            Мы подберём для тебя идеальную косметику и предупредим о неподходящих продуктах ✨
          </Text>
        </View>

        <View className="space-y-3 mb-8">
          {SKIN_TYPES.map((type) => {
            const isSelected = selectedType === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                onPress={() => setSelectedType(type.id)}
                className={`p-5 rounded-2xl border-2 flex-row items-center ${
                  isSelected
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                    isSelected ? 'bg-pink-500' : 'bg-slate-100'
                  }`}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={24}
                    color={isSelected ? 'white' : '#64748b'}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-lg font-bold mb-1 ${
                      isSelected ? 'text-pink-700' : 'text-slate-900'
                    }`}
                  >
                    {type.label}
                  </Text>
                  <Text
                    className={`text-sm ${
                      isSelected ? 'text-pink-600' : 'text-slate-500'
                    }`}
                  >
                    {type.desc}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={28} color="#EC4899" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View className="p-6 border-t border-slate-100 bg-white">
        <TouchableOpacity
          onPress={handleSave}
          disabled={!selectedType || isSaving}
          className={`p-5 rounded-3xl ${
            selectedType && !isSaving
              ? 'bg-pink-500 active:opacity-90'
              : 'bg-slate-300'
          }`}
        >
          <Text className="text-white text-center font-bold text-lg">
            {isSaving ? 'Сохранение...' : 'Сохранить и продолжить'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

