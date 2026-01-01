import { SkinType, isValidSkinType } from '@/types/skinType';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export const STORAGE_KEY = '@beauty_ai_skin_type';

export type SkinTypeOrNull = SkinType | null;

export function useSkinType() {
  const [skinType, setSkinType] = useState<SkinTypeOrNull>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSkinType();
  }, []);

  const loadSkinType = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (isValidSkinType(stored)) {
        setSkinType(stored);
      }
    } catch (error) {
      console.error('Ошибка загрузки типа кожи:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSkinType = async (type: SkinTypeOrNull) => {
    try {
      if (type) {
        await AsyncStorage.setItem(STORAGE_KEY, type);
        setSkinType(type);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
        setSkinType(null);
      }
    } catch (error) {
      console.error('Ошибка сохранения типа кожи:', error);
      throw error;
    }
  };

  return { skinType, isLoading, saveSkinType, loadSkinType };
}

