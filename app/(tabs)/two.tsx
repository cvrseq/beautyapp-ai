import { Text, View } from 'react-native';

export default function TabTwoScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Text className="text-2xl font-bold text-slate-800">Твой Профиль</Text>
      <Text className="text-slate-500 mt-2 text-center">
        Здесь будет твоя история подписок и избранные продукты.
      </Text>
    </View>
  );
}
