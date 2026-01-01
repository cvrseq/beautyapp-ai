import { api } from '@/convex/_generated/api';
import { SEARCH } from '@/constants/thresholds';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Используем поиск только когда запрос не пустой и длина >= MIN_QUERY_LENGTH
  const shouldSearch = debouncedQuery.trim().length >= SEARCH.MIN_QUERY_LENGTH;
  const products = useQuery(
    api.products.searchProducts,
    shouldSearch ? { searchQuery: debouncedQuery } : 'skip'
  );

  // Debounce поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleProductPress = (productId: string) => {
    router.push({
      pathname: '/product-result',
      params: { id: productId },
    });
  };

  return (
    <View className="flex-1 bg-white">
      {/* Заголовок с поисковой строкой */}
      <View className="bg-white border-b border-slate-200 pt-12 pb-4 px-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900 flex-1">
            Поиск продуктов
          </Text>
        </View>

        {/* Поисковая строка */}
        <View className="flex-row items-center bg-slate-100 rounded-2xl px-4 py-3">
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            className="flex-1 ml-3 text-slate-900 text-base"
            placeholder="Введи название или бренд..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Результаты поиска */}
      <View className="flex-1">
        {!shouldSearch ? (
          <View className="flex-1 justify-center items-center px-8">
            <Ionicons name="search-outline" size={64} color="#cbd5e1" />
            <Text className="text-slate-500 text-lg font-medium mt-4 text-center">
              Начни вводить название{'\n'}или бренд продукта
            </Text>
            <Text className="text-slate-400 text-sm mt-2 text-center">
              Нужно минимум {SEARCH.MIN_QUERY_LENGTH} символа
            </Text>
          </View>
        ) : products === undefined ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#FF69B4" />
            <Text className="text-slate-500 mt-4">Ищем продукты...</Text>
          </View>
        ) : products.length === 0 ? (
          <View className="flex-1 justify-center items-center px-8">
            <Ionicons name="search-outline" size={64} color="#cbd5e1" />
            <Text className="text-slate-500 text-lg font-medium mt-4 text-center">
              Ничего не найдено
            </Text>
            <Text className="text-slate-400 text-sm mt-2 text-center">
              Попробуй другой запрос или используй сканер
            </Text>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item._id}
            contentContainerClassName="p-4"
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleProductPress(item._id)}
                className="bg-white border border-slate-200 rounded-2xl p-4 mb-3 shadow-sm"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-pink-500 font-bold text-xs uppercase tracking-widest mb-1">
                      {item.brand}
                    </Text>
                    <Text className="text-slate-900 font-bold text-lg mb-2">
                      {item.name}
                    </Text>
                    {item.priceEstimate && (
                      <Text className="text-slate-600 text-sm">
                        {item.priceEstimate}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color="#cbd5e1"
                  />
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View className="py-8">
                <Text className="text-slate-400 text-center">
                  Продукты не найдены
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

