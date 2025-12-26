import { useSkinType } from '@/hooks/useSkinType';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { skinType, isLoading } = useSkinType();
  const [showSkinTypePrompt, setShowSkinTypePrompt] = useState(false);

  useEffect(() => {
    if (!isLoading && !skinType) {
      setShowSkinTypePrompt(true);
    }
  }, [skinType, isLoading]);
  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="p-8 pt-20">
        <Text className="text-sm font-bold text-pink-500 uppercase tracking-widest">
          Beauty AI Project
        </Text>
        <Text className="text-4xl font-extrabold text-slate-900 mt-2">
          Выбирай лучшее ✨
        </Text>

        {/* Предупреждение/кнопка для настройки типа кожи */}
        {showSkinTypePrompt && (
          <View className="mt-6 bg-yellow-50 border-2 border-yellow-200 p-4 rounded-2xl">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-yellow-900 font-bold text-base mb-1">
                  Расскажи о своём типе кожи
                </Text>
                <Text className="text-yellow-800 text-sm leading-5">
                  Мы подберём идеальную косметику специально для тебя
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowSkinTypePrompt(false);
                  router.push('/skin-type-quiz' as any);
                }}
                className="bg-yellow-600 px-4 py-2 rounded-xl"
              >
                <Text className="text-white font-bold text-sm">Настроить</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Кнопка изменения типа кожи (если уже настроен) */}
        {skinType && !showSkinTypePrompt && (
          <TouchableOpacity
            onPress={() => router.push('/skin-type-quiz' as any)}
            className="mt-6 bg-white border border-slate-200 p-3 rounded-xl flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <Ionicons name="person-circle-outline" size={20} color="#64748b" />
              <Text className="text-slate-700 text-sm ml-2">
                Тип кожи: {
                  skinType === 'dry' ? 'Сухая' :
                  skinType === 'oily' ? 'Жирная' :
                  skinType === 'combination' ? 'Комбинированная' :
                  skinType === 'normal' ? 'Нормальная' : 'Чувствительная'
                }
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>
        )}

        <View className="mt-10 space-y-4">
          {/* Кнопка СКАНЕРА */}
          <TouchableOpacity
            onPress={() => router.push('/camera')}
            className="bg-pink-500 p-6 rounded-3xl shadow-xl flex-row items-center justify-between"
          >
            <View>
              <Text className="text-white text-xl font-bold">Умный сканер</Text>
              <Text className="text-pink-100 text-sm">
                Наведи камеру на состав
              </Text>
            </View>
            <Ionicons name="scan-circle" size={40} color="white" />
          </TouchableOpacity>

          {/* Кнопка ПОИСКА */}
          <TouchableOpacity
            onPress={() => router.push('/search' as any)}
            className="bg-white border-2 border-slate-200 p-6 rounded-3xl flex-row items-center justify-between active:bg-slate-50"
          >
            <View>
              <Text className="text-slate-800 text-xl font-bold">
                Поиск по названию
              </Text>
              <Text className="text-slate-500 text-sm">
                Введи бренд вручную
              </Text>
            </View>
            <Ionicons name="search" size={32} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View className="mt-12">
          <Text className="text-lg font-bold text-slate-800">
            Твои последние сканы
          </Text>
          <View className="bg-white p-10 rounded-3xl mt-4 border border-dashed border-slate-300 items-center">
            <Text className="text-slate-400">
              Здесь пока пусто. Давай что-нибудь отсканим!
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
