import { Location, isValidLocation, LOCATION_CLIMATE, LocationClimate } from '@/types/userProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export const STORAGE_KEY = '@beauty_ai_location';

export type LocationOrNull = Location | null;

export function useLocation() {
  const [location, setLocation] = useState<LocationOrNull>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLocation = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (isValidLocation(stored)) {
        setLocation(stored);
      } else {
        setLocation(null);
      }
    } catch (error) {
      console.error('Ошибка загрузки локации:', error);
      setLocation(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  const saveLocation = async (value: LocationOrNull) => {
    try {
      if (value) {
        await AsyncStorage.setItem(STORAGE_KEY, value);
        setLocation(value);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
        setLocation(null);
      }
    } catch (error) {
      console.error('Ошибка сохранения локации:', error);
      throw error;
    }
  };

  // Helper to get climate data for current location
  const getClimate = (): LocationClimate | null => {
    if (location) {
      return LOCATION_CLIMATE[location];
    }
    return null;
  };

  return { location, isLoading, saveLocation, loadLocation, getClimate };
}
