import { api } from '@/convex/_generated/api';
import { useSkinType } from '@/hooks/useSkinType';
import { useHairType } from '@/hooks/useHairType';
import { IMAGE_PROCESSING } from '@/constants/thresholds';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { useAction } from 'convex/react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const analyze = useAction(api.analysis.analyzeProduct);
  const { skinType } = useSkinType();
  const { hairType } = useHairType();

  // Принудительно запрашиваем права
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'white',
            paddingHorizontal: 24,
          },
        ]}
      >
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Ionicons name="camera-outline" size={40} color="#000" />
          </View>
          <Text style={[APPLE_TEXT_STYLES.title3, { textAlign: 'center', color: '#000', marginBottom: 8, maxWidth: '100%' }]} numberOfLines={2}>
            Нужен доступ к камере
          </Text>
          <Text style={[APPLE_TEXT_STYLES.callout, { textAlign: 'center', color: '#8E8E93', maxWidth: '100%' }]} numberOfLines={3}>
            Чтобы сканировать состав продуктов, разрешите доступ к камере
          </Text>
        </View>
        <TouchableOpacity
          onPress={requestPermission}
          style={{
            backgroundColor: '#000',
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 12,
            width: '100%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            marginBottom: 16,
          }}
        >
          <Text style={[APPLE_TEXT_STYLES.headline, { color: 'white', textAlign: 'center' }]}>
            Разрешить доступ
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/')}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 12,
            width: '100%',
            borderWidth: 1,
            borderColor: 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <Text style={[APPLE_TEXT_STYLES.headline, { color: '#000', textAlign: 'center' }]}>
            Назад
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takeAndAnalyzePhoto = async () => {
    if (!cameraRef.current || isAnalyzing) return;
    try {
      setErrorMessage(null);
      setIsAnalyzing(true);
      console.log('[Camera] Taking picture...');

      const photo = await cameraRef.current.takePictureAsync({
        quality: IMAGE_PROCESSING.QUALITY,
      });

      if (photo) {
        console.log('[Camera] Picture taken, URI:', photo.uri);

        const manipulated = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: IMAGE_PROCESSING.MAX_WIDTH } }],
          {
            compress: IMAGE_PROCESSING.COMPRESSION,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );

        if (manipulated.base64) {
          console.log('[Camera] Image processed, base64 length:', manipulated.base64.length);
          console.log('[Camera] Sending to AI with skinType:', skinType, 'hairType:', hairType);

          const result = await analyze({
            imageBase64: manipulated.base64,
            skinType: skinType || undefined,
            hairType: hairType || undefined,
          });

          console.log('[Camera] AI result received:', result);

          if (!result) {
            console.error('[Camera] No result from AI');
            setErrorMessage('Не удалось получить ответ от сервера. Попробуйте ещё раз.');
          } else if ('error' in result) {
            console.error('[Camera] AI returned error:', result.error);
            setErrorMessage(result.error);
          } else if ('productId' in result) {
            console.log('[Camera] Success! Product ID:', result.productId);
            router.push({
              pathname: '/product-result',
              params: { id: result.productId },
            });
          } else {
            console.error('[Camera] Unexpected result format:', result);
            setErrorMessage('Не удалось проанализировать фото. Попробуйте поднести камеру ближе и убрать блики.');
          }
        } else {
          console.error('[Camera] No base64 data in manipulated image');
          setErrorMessage(
            'Не удалось получить данные снимка. Попробуйте сделать фото ещё раз.'
          );
        }
      }
    } catch (error) {
      console.error('[Camera] Error in takeAndAnalyzePhoto:', error);
      if (error instanceof Error) {
        console.error('[Camera] Error name:', error.name);
        console.error('[Camera] Error message:', error.message);
        console.error('[Camera] Error stack:', error.stack);
      }
      setErrorMessage(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}. Попробуйте ещё раз.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ВАЖНО: Используем style={{ flex: 1 }} вместо className */}
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      {/* Кнопка назад */}
      <SafeAreaView style={styles.topSafeArea} edges={['top']}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/')}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Интерфейс поверх камеры */}
      <View style={styles.overlay}>
        {errorMessage && !isAnalyzing && (
          <View style={styles.errorBox}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="alert-circle" size={22} color="white" />
              </View>
              <View style={{ flex: 1, flexShrink: 1 }}>
                <Text style={[APPLE_TEXT_STYLES.headline, { color: 'white', marginBottom: 6 }]} numberOfLines={1}>Не получилось</Text>
                <Text style={[APPLE_TEXT_STYLES.subhead, { color: 'rgba(255, 255, 255, 0.9)', flexShrink: 1 }]} numberOfLines={3}>{errorMessage}</Text>
              </View>
            </View>
          </View>
        )}

        {isAnalyzing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={[APPLE_TEXT_STYLES.headline, { marginTop: 16, color: '#000' }]}>
              ИИ изучает состав...
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={takeAndAnalyzePhoto}
            style={styles.captureButton}
            activeOpacity={0.8}
          >
            <View style={styles.innerButton} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Обычные стили, чтобы исключить глюки NativeWind с камерой
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
  },
  loadingBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  errorBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    borderWidth: 4,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  innerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#000',
  },
  topSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
