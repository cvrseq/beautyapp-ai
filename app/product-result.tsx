import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ВАЖНО: export default — обязателен для Expo Router
export default function ProductResultScreen() {
  const { id } = useLocalSearchParams();

  // Получаем данные. id прилетает строкой, приводим к any для Convex
  const product = useQuery(api.products.getById, { id: id as any });

  if (!id) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-8">
        <Text className="text-xl font-bold text-slate-900 mb-2">
          Что‑то пошло не так
        </Text>
        <Text className="text-slate-500 text-center mb-6">
          Не удалось определить продукт. Попробуйте отсканировать ещё раз.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/camera')}
          className="bg-slate-900 px-6 py-4 rounded-2xl"
        >
          <Text className="text-white font-bold">Вернуться к сканеру</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 1. Состояние загрузки
  if (!product) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#FF69B4" />
        <Text className="text-slate-500 mt-4 font-medium">
          ИИ анализирует состав...
        </Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-8">
        <Text className="text-xl font-bold text-slate-900 mb-2">
          Продукт не найден
        </Text>
        <Text className="text-slate-500 text-center mb-6">
          Не удалось загрузить данные по этому скану. Возможно, запись была
          удалена или произошла ошибка сети.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/camera')}
          className="bg-slate-900 px-6 py-4 rounded-2xl"
        >
          <Text className="text-white font-bold">Попробовать ещё раз</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Парсим JSON с анализом
  let analysis: any = { ingredients: [] };
  try {
    analysis =
      typeof product.ingredientsAnalysis === 'string'
        ? JSON.parse(product.ingredientsAnalysis)
        : product.ingredientsAnalysis;
  } catch (e) {
    console.error('Failed to parse ingredientsAnalysis', e);
    analysis = { ingredients: [] };
  }

  // Функция для цветов
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'green':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: 'checkmark-circle',
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: 'warning',
        };
      case 'red':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: 'alert-circle' };
      default:
        return {
          bg: 'bg-slate-100',
          text: 'text-slate-800',
          icon: 'help-circle',
        };
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 p-6">
        {/* Заголовок */}
        <View className="mb-8 items-center pt-4">
          <Text className="text-pink-500 font-bold uppercase tracking-widest text-xs">
            {product.brand}
          </Text>
          <Text className="text-3xl font-black text-slate-900 text-center mt-1">
            {product.name}
          </Text>
          <View className="bg-slate-100 px-4 py-2 rounded-full mt-3">
            <Text className="text-slate-600 font-bold text-sm">
              Цена: {product.priceEstimate}
            </Text>
          </View>
        </View>

        <Text className="text-xl font-bold mb-4 text-slate-800">
          Разбор состава ✨
        </Text>

        {/* Список ингредиентов */}
        {analysis?.ingredients?.map((item: any, index: number) => {
          const style = getStatusStyle(item.status);
          return (
            <View
              key={index}
              className={`flex-row p-4 mb-3 rounded-2xl ${style.bg} items-start`}
            >
              <Ionicons
                name={style.icon as any}
                size={24}
                className={style.text}
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <View className="flex-1">
                <Text className={`font-bold text-lg ${style.text}`}>
                  {item.name}
                </Text>
                <Text
                  className={`text-sm opacity-80 mt-1 leading-5 ${style.text}`}
                >
                  {item.desc}
                </Text>
              </View>
            </View>
          );
        })}

        <View className="h-24" />
      </ScrollView>

      {/* Кнопка закрытия */}
      <View className="p-6 border-t border-slate-100 bg-white">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-slate-900 p-5 rounded-3xl active:opacity-90"
        >
          <Text className="text-white text-center font-bold text-lg">
            Понятно, спасибо!
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
