import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GestureResponderEvent, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

interface ScanButtonProps {
  onPress?: ((e: GestureResponderEvent) => void) | null;
}

function ScanTabButton({ onPress, isDark }: ScanButtonProps & { isDark: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress ?? undefined}
      style={scanStyles.root}
      activeOpacity={0.8}
    >
      <View style={[scanStyles.circle, { backgroundColor: isDark ? '#E0E0E0' : '#000' }]}>
        <Ionicons name="scan" size={22} color={isDark ? '#000' : '#fff'} />
      </View>
    </TouchableOpacity>
  );
}

const scanStyles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 6,
  },
});

export default function TabLayout() {
  const { theme, isDark } = useTheme();
  const { t } = useLocale();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.tabBarBorder,
          height: Platform.OS === 'ios' ? 80 : 60,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500' as const,
          fontFamily: Platform.select({ ios: 'System', default: undefined }),
          marginTop: 2,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size ?? 24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="camera"
        options={{
          title: '',
          tabBarButton: ({ onPress }) => (
            <ScanTabButton
              onPress={onPress as ScanButtonProps['onPress']}
              isDark={isDark}
            />
          ),
          tabBarStyle: { display: 'none' },
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: t('tabs.feed'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size ?? 24} color={color} />
          ),
        }}
      />

      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}
