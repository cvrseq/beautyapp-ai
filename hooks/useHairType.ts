import { HairType, isValidHairType } from '@/types/hairType';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export const STORAGE_KEY = '@beauty_ai_hair_type';

export type HairTypeOrNull = HairType | null;

export function useHairType() {
  const [hairType, setHairType] = useState<HairTypeOrNull>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadHairType = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (isValidHairType(stored)) {
        setHairType(stored);
      } else {
        setHairType(null);
      }
    } catch (error) {
      console.error('Ошибка загрузки типа волос:', error);
      setHairType(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHairType();
  }, [loadHairType]);

  const saveHairType = async (type: HairTypeOrNull) => {
    try {
      if (type) {
        await AsyncStorage.setItem(STORAGE_KEY, type);
        setHairType(type);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
        setHairType(null);
      }
    } catch (error) {
      console.error('Ошибка сохранения типа волос:', error);
      throw error;
    }
  };

  return { hairType, isLoading, saveHairType, loadHairType };
}

