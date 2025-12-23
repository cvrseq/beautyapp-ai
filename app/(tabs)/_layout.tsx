import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; // Стандартные иконки в Expo

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#FF69B4' }}> 
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="camera" // Это будет наш будущий экран камеры
        options={{
          title: 'Сканер',
          tabBarIcon: ({ color }) => <Ionicons name="camera" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}