import { api } from '@/convex/_generated/api';
import { useAction } from 'convex/react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const analyze = useAction(api.analysis.analyzeProduct);

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
          },
        ]}
      >
        <Text style={{ textAlign: 'center', marginBottom: 20, fontSize: 18 }}>
          Нужен доступ к камере 📸
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{ backgroundColor: '#EC4899', padding: 15, borderRadius: 30 }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            Дать разрешение
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
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });

      if (photo) {
        const manipulated = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 800 } }],
          {
            compress: 0.7,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );

        if (manipulated.base64) {
          const result = await analyze({ imageBase64: manipulated.base64 });
          if (!result || (result as any).error || !(result as any).productId) {
            setErrorMessage(
              (result as any)?.error ||
                'Не удалось проанализировать фото. Попробуйте поднести камеру ближе и убрать блики.'
            );
          } else {
            router.push({
              pathname: '/product-result',
              params: { id: (result as any).productId },
            });
          }
        } else {
          setErrorMessage(
            'Не удалось получить данные снимка. Попробуйте сделать фото ещё раз.'
          );
        }
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('Ошибка камеры. Попробуйте перезапустить приложение или сделать снимок ещё раз.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ВАЖНО: Используем style={{ flex: 1 }} вместо className */}
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      {/* Интерфейс поверх камеры */}
      <View style={styles.overlay}>
        {errorMessage && !isAnalyzing && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Не получилось 😔</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {isAnalyzing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#FF69B4" />
            <Text style={{ marginTop: 10, fontWeight: 'bold' }}>
              ИИ изучает состав...
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={takeAndAnalyzePhoto}
            style={styles.captureButton}
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
  },
  loadingBox: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  errorBox: {
    backgroundColor: 'rgba(248, 113, 113, 0.95)', // красный, но мягкий
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 18,
    marginBottom: 12,
    maxWidth: '90%',
  },
  errorTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 14,
  },
  errorText: {
    color: 'white',
    fontSize: 13,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    borderWidth: 6,
    borderColor: '#FBCFE8', // pink-200
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EC4899', // pink-500
  },
});
