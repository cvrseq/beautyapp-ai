import { api } from '@/convex/_generated/api';
import { useSkinType } from '@/hooks/useSkinType';
import { useHairType } from '@/hooks/useHairType';
import { useAge } from '@/hooks/useAge';
import { useLifestyle } from '@/hooks/useLifestyle';
import { useLocation } from '@/hooks/useLocation';
import { useLocale } from '@/hooks/useLocale';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { useAction, useQuery } from 'convex/react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { BarcodeType } from 'expo-camera';

const BEAUTY_BARCODE_TYPES: BarcodeType[] = ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'];
const BARCODE_COOLDOWN_MS = 2000;

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);

  const cameraRef = useRef<CameraView>(null);
  const hasNavigatedRef = useRef(false);
  const lastBarcodeRef = useRef<{ value: string; ts: number } | null>(null);

  const analyze = useAction(api.analysis.analyzeProduct);
  const { skinType } = useSkinType();
  const { hairType } = useHairType();
  const { age } = useAge();
  const { lifestyle } = useLifestyle();
  const { location } = useLocation();
  const { t } = useLocale();

  const barcodeProduct = useQuery(
    api.products.findByBarcode,
    scannedBarcode ? { barcode: scannedBarcode } : 'skip'
  );

  useEffect(() => {
    if (!barcodeProduct || hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    router.push({ pathname: '/product-result', params: { id: barcodeProduct._id } });
  }, [barcodeProduct]);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (isAnalyzing || hasNavigatedRef.current) return;

      const now = Date.now();
      const last = lastBarcodeRef.current;
      if (last && last.value === data && now - last.ts < BARCODE_COOLDOWN_MS) return;

      lastBarcodeRef.current = { value: data, ts: now };
      setScannedBarcode(data);
      setErrorMessage(null);
    },
    [isAnalyzing]
  );

  const clearBarcode = () => {
    setScannedBarcode(null);
    lastBarcodeRef.current = null;
    hasNavigatedRef.current = false;
  };

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
            {t('camera.permTitle')}
          </Text>
          <Text style={[APPLE_TEXT_STYLES.callout, { textAlign: 'center', color: '#8E8E93', maxWidth: '100%' }]} numberOfLines={3}>
            {t('camera.permText')}
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
            {t('camera.allowAccess')}
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
            {t('back')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takeAndAnalyzePhoto = async () => {
    if (!cameraRef.current || isAnalyzing) return;

    const safetyTimer = setTimeout(() => {
      console.warn('[Camera] SAFETY-NET: forcing isAnalyzing=false after 100s');
      setIsAnalyzing(false);
      setErrorMessage(t('camera.errSafety'));
    }, 100_000);

    try {
      setErrorMessage(null);
      setIsAnalyzing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        base64: true,
      });

      if (!photo?.base64) {
        setErrorMessage(t('camera.errNoPhoto'));
        return;
      }

      type AnalyzeResult = Awaited<ReturnType<typeof analyze>>;
      const TIMEOUT_MS = 60_000;
      const MAX_RETRIES = 3;

      let result: AnalyzeResult | null = null;
      let lastErr: unknown = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const timeoutPromise = new Promise<never>((_resolve, reject) =>
            setTimeout(() => reject(new Error('client_timeout')), TIMEOUT_MS)
          );
          result = await Promise.race([
            analyze({
              imageBase64: photo.base64,
              barcode: scannedBarcode ?? undefined,
              skinType: skinType || undefined,
              hairType: hairType || undefined,
              age: age || undefined,
              lifestyle: lifestyle || undefined,
              location: location || undefined,
            }),
            timeoutPromise,
          ]);
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
          const msg = err instanceof Error ? err.message : '';
          if ((msg.includes('Connection lost') || msg.includes('WebSocket')) && attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          throw err;
        }
      }
      if (lastErr) throw lastErr;

      if (!result) {
        setErrorMessage(t('camera.errNoResponse'));
      } else if ('error' in result) {
        setErrorMessage(result.error);
      } else if ('productId' in result) {
        clearBarcode();
        router.push({ pathname: '/product-result', params: { id: result.productId } });
      } else {
        setErrorMessage(t('camera.errAnalyze'));
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('Connection lost') || msg.includes('WebSocket')) {
        setErrorMessage(t('camera.errConnection'));
      } else if (msg.includes('timeout')) {
        setErrorMessage(t('camera.errTimeout'));
      } else {
        setErrorMessage(t('camera.errUnknown'));
      }
    } finally {
      clearTimeout(safetyTimer);
      setIsAnalyzing(false);
    }
  };

  const barcodeStatus: 'checking' | 'not_found' | 'found' | null =
    scannedBarcode === null
      ? null
      : barcodeProduct === undefined
        ? 'checking'
        : barcodeProduct === null
          ? 'not_found'
          : 'found';

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: BEAUTY_BARCODE_TYPES }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Back button */}
      <SafeAreaView style={styles.topSafeArea} edges={['top']}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/')}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Error box */}
        {errorMessage && !isAnalyzing && (
          <View style={styles.errorBox}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={styles.errorIcon}>
                <Ionicons name="alert-circle" size={22} color="white" />
              </View>
              <View style={{ flex: 1, flexShrink: 1 }}>
                <Text style={[APPLE_TEXT_STYLES.headline, { color: 'white', marginBottom: 6 }]} numberOfLines={1}>
                  {t('errorTitle')}
                </Text>
                <Text style={[APPLE_TEXT_STYLES.subhead, { color: 'rgba(255,255,255,0.9)', flexShrink: 1 }]} numberOfLines={3}>
                  {errorMessage}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Barcode indicator */}
        {barcodeStatus !== null && !isAnalyzing && (
          <View style={styles.barcodeBox}>
            <View style={styles.barcodeRow}>
              <Ionicons
                name={barcodeStatus === 'found' ? 'checkmark-circle' : barcodeStatus === 'checking' ? 'scan' : 'barcode-outline'}
                size={16}
                color={barcodeStatus === 'found' ? '#30D158' : 'rgba(255,255,255,0.85)'}
              />
              <Text style={[APPLE_TEXT_STYLES.footnote, styles.barcodeText]} numberOfLines={1}>
                {barcodeStatus === 'checking' && t('camera.barcodeChecking')}
                {barcodeStatus === 'not_found' && t('camera.barcodeNotFound')}
                {barcodeStatus === 'found' && t('camera.barcodeFound')}
              </Text>
              {barcodeStatus === 'not_found' && (
                <TouchableOpacity onPress={clearBarcode} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={14} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Loading / capture button */}
        {isAnalyzing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={[APPLE_TEXT_STYLES.headline, { marginTop: 16, color: '#000' }]}>
              {scannedBarcode ? t('camera.analyzingNew') : t('camera.analyzing')}
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
    backgroundColor: 'rgba(255,255,255,0.95)',
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
    backgroundColor: 'rgba(0,0,0,0.85)',
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
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  barcodeBox: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 16,
    maxWidth: '100%',
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barcodeText: {
    color: 'rgba(255,255,255,0.9)',
    flexShrink: 1,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.1)',
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
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
