import { AgeRange, isValidAgeRange } from '@/types/userProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export const STORAGE_KEY = '@beauty_ai_age';

export type AgeRangeOrNull = AgeRange | null;

export function useAge() {
  const [age, setAge] = useState<AgeRangeOrNull>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAge = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (isValidAgeRange(stored)) {
        setAge(stored);
      } else {
        setAge(null);
      }
    } catch (error) {
      console.error('Ошибка загрузки возраста:', error);
      setAge(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAge();
  }, [loadAge]);

  const saveAge = async (value: AgeRangeOrNull) => {
    try {
      if (value) {
        await AsyncStorage.setItem(STORAGE_KEY, value);
        setAge(value);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
        setAge(null);
      }
    } catch (error) {
      console.error('Ошибка сохранения возраста:', error);
      throw error;
    }
  };

  return { age, isLoading, saveAge, loadAge };
}
