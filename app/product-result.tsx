import { SKIN_COMPATIBILITY_SCORES } from '@/constants/thresholds';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useSkinType } from '@/hooks/useSkinType';
import { CosmeticAnalysis, Ingredient, IngredientStatus } from '@/types/products';
import { SKIN_TYPE_LABELS } from '@/types/skinType';
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
  const { skinType } = useSkinType();

  // Получаем данные
  const product = useQuery(api.products.getById, id ? { id: id as Id<'products'> } : 'skip');

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

  // 2. Парсим JSON с анализом
  let analysis: CosmeticAnalysis = { pros: [], cons: [], hazards: 'low', ingredients: [] };
  try {
    const parsed = typeof product.ingredientsAnalysis === 'string'
      ? JSON.parse(product.ingredientsAnalysis)
      : product.ingredientsAnalysis;
    if (parsed && typeof parsed === 'object') {
      analysis = {
        pros: Array.isArray(parsed.pros) ? parsed.pros : [],
        cons: Array.isArray(parsed.cons) ? parsed.cons : [],
        hazards: parsed.hazards || 'low',
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      };
    }
  } catch (e) {
    console.error('Failed to parse ingredientsAnalysis', e);
  }

  // Функция для цветов
  const getStatusStyle = (status: IngredientStatus) => {
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

        {/* Блок совместимости с типом кожи */}
        {skinType && product.skinTypeCompatibility && (
          (() => {
            const compatibility = product.skinTypeCompatibility[skinType];
            if (!compatibility || typeof compatibility !== 'object') return null;
            
            const status = compatibility.status || 'neutral';
            const score = typeof compatibility.score === 'number' ? compatibility.score : 50;
            
            // Определяем стиль в зависимости от статуса
            if (status === 'bad' || score < SKIN_COMPATIBILITY_SCORES.NEUTRAL_MIN) {
              return (
                <View className="bg-red-50 border-2 border-red-200 p-4 rounded-2xl mb-6">
                  <View className="flex-row items-start mb-2">
                    <Ionicons name="alert-circle" size={24} color="#DC2626" style={{ marginRight: 8 }} />
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-red-800 font-bold text-lg">
                          Не рекомендуется для {SKIN_TYPE_LABELS[skinType].toLowerCase()} кожи
                        </Text>
                        <View className="bg-red-200 px-3 py-1 rounded-full">
                          <Text className="text-red-800 font-bold text-sm">{score}%</Text>
                        </View>
                      </View>
                      <Text className="text-red-700 text-sm leading-5">
                        Состав этого продукта может не подойти твоему типу кожи. 
                        Обрати внимание на ингредиенты ниже — некоторые из них могут вызвать 
                        нежелательные реакции.
                      </Text>
                    </View>
                  </View>
                </View>
              );
            } else if (status === 'good' || score >= SKIN_COMPATIBILITY_SCORES.GOOD_MIN) {
              return (
                <View className="bg-green-50 border-2 border-green-200 p-4 rounded-2xl mb-6">
                  <View className="flex-row items-start mb-2">
                    <Ionicons name="checkmark-circle" size={24} color="#16A34A" style={{ marginRight: 8 }} />
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-green-800 font-bold text-lg">
                          Отлично подходит для {SKIN_TYPE_LABELS[skinType].toLowerCase()} кожи
                        </Text>
                        <View className="bg-green-200 px-3 py-1 rounded-full">
                          <Text className="text-green-800 font-bold text-sm">{score}%</Text>
                        </View>
                      </View>
                      <Text className="text-green-700 text-sm leading-5">
                        Состав этого продукта хорошо подходит для твоего типа кожи. 
                        Ингредиенты должны работать эффективно и безопасно.
                      </Text>
                    </View>
                  </View>
                </View>
              );
            } else {
              // neutral или 40-69
              return (
                <View className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-2xl mb-6">
                  <View className="flex-row items-start mb-2">
                    <Ionicons name="help-circle" size={24} color="#CA8A04" style={{ marginRight: 8 }} />
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-yellow-800 font-bold text-lg">
                          Нейтрально для {SKIN_TYPE_LABELS[skinType].toLowerCase()} кожи
                        </Text>
                        <View className="bg-yellow-200 px-3 py-1 rounded-full">
                          <Text className="text-yellow-800 font-bold text-sm">{score}%</Text>
                        </View>
                      </View>
                      <Text className="text-yellow-700 text-sm leading-5">
                        Продукт может подойти, но стоит внимательно изучить состав. 
                        Обрати внимание на ингредиенты ниже.
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }
          })()
        )}

        <Text className="text-xl font-bold mb-4 text-slate-800">
          Разбор состава ✨
        </Text>

        {/* Список ингредиентов */}
        {analysis.ingredients.map((item: Ingredient, index: number) => {
          const style = getStatusStyle(item.status);
          return (
            <View
              key={index}
              className={`flex-row p-4 mb-3 rounded-2xl ${style.bg} items-start`}
            >
              <Ionicons
                name={style.icon as keyof typeof Ionicons.glyphMap}
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
