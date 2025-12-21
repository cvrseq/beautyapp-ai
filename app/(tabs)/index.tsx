import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="p-8 pt-20">
        <Text className="text-sm font-bold text-pink-500 uppercase tracking-widest">
          Beauty AI Project
        </Text>
        <Text className="text-4xl font-extrabold text-slate-900 mt-2">
          Выбирай лучшее ✨
        </Text>

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
          <TouchableOpacity className="bg-white border-2 border-slate-200 p-6 rounded-3xl flex-row items-center justify-between">
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
