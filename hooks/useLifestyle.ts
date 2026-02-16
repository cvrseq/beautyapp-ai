import { Lifestyle, isValidLifestyle } from '@/types/userProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export const STORAGE_KEY = '@beauty_ai_lifestyle';

export type LifestyleOrNull = Lifestyle | null;

export function useLifestyle() {
  const [lifestyle, setLifestyle] = useState<LifestyleOrNull>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLifestyle = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (isValidLifestyle(stored)) {
        setLifestyle(stored);
      } else {
        setLifestyle(null);
      }
    } catch (error) {
      console.error('Ошибка загрузки образа жизни:', error);
      setLifestyle(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLifestyle();
  }, [loadLifestyle]);

  const saveLifestyle = async (value: LifestyleOrNull) => {
    try {
      if (value) {
        await AsyncStorage.setItem(STORAGE_KEY, value);
        setLifestyle(value);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
        setLifestyle(null);
      }
    } catch (error) {
      console.error('Ошибка сохранения образа жизни:', error);
      throw error;
    }
  };

  return { lifestyle, isLoading, saveLifestyle, loadLifestyle };
}
