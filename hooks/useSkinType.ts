import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY = '@beauty_ai_skin_type';

export type SkinType = 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive' | null;

export function useSkinType() {
  const [skinType, setSkinType] = useState<SkinType>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSkinType();
  }, []);

  const loadSkinType = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored && ['dry', 'oily', 'combination', 'normal', 'sensitive'].includes(stored)) {
        setSkinType(stored as SkinType);
      }
    } catch (error) {
      console.error('Ошибка загрузки типа кожи:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSkinType = async (type: SkinType) => {
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

