import { api } from '@/convex/_generated/api';
import { scanStore } from '@/store/scanStore';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { useLocale } from '@/hooks/useLocale';
import { useAction } from 'convex/react';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function AnalyzingScreen() {
  const scan = scanStore.get();
  const analyze = useAction(api.analysis.analyzeProduct);
  const { t } = useLocale();

  const STAGES = [
    t('analyzing.stage1'),
    t('analyzing.stage2'),
    t('analyzing.stage3'),
    t('analyzing.stage4'),
  ];

  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Animations
  const scanLineY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const stageOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scanLineY, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(stageOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(stageOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      setStageIndex((i) => (i + 1) % STAGES.length);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!scan) {
      router.replace('/(tabs)/camera');
      return;
    }
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    if (!scan) return;
    const MAX_RETRIES = 2;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await analyze({
          imageBase64: scan.imageBase64,
          skinType: scan.skinType as Parameters<typeof analyze>[0]['skinType'],
          hairType: scan.hairType as Parameters<typeof analyze>[0]['hairType'],
          age: scan.age as Parameters<typeof analyze>[0]['age'],
          lifestyle: scan.lifestyle as Parameters<typeof analyze>[0]['lifestyle'],
          location: scan.location as Parameters<typeof analyze>[0]['location'],
        });

        scanStore.clear();

        if (!result) {
          setError(t('analyzing.errNoResponse'));
          return;
        }
        if ('error' in result) {
          setError(result.error);
          return;
        }
        if ('productId' in result) {
          router.replace({ pathname: '/product-result', params: { id: result.productId } });
          return;
        }

        setError(t('analyzing.errUnknown'));
        return;
      } catch (err) {
        lastError = err;
        if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 1500));
      }
    }

    const msg = lastError instanceof Error ? lastError.message : '';
    if (msg.includes('Connection lost') || msg.includes('WebSocket')) {
      setError(t('analyzing.errConnection'));
    } else if (msg.includes('timeout')) {
      setError(t('analyzing.errTimeout'));
    } else {
      setError(t('analyzing.errGeneric'));
    }
  };

  const goBack = () => {
    scanStore.clear();
    router.replace('/(tabs)/camera');
  };

  const PHOTO_HEIGHT = 260;

  const scanLineTranslateY = scanLineY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PHOTO_HEIGHT],
  });

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      {/* Photo preview */}
      <View style={styles.photoWrap}>
        {scan?.imageUri ? (
          <Image source={{ uri: scan.imageUri }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.photo, { backgroundColor: '#111' }]} />
        )}

        <View style={styles.photoOverlay} />

        {!error && (
          <Animated.View
            style={[styles.scanLine, { transform: [{ translateY: scanLineTranslateY }] }]}
          />
        )}

        <View style={styles.frameCorners}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
      </View>

      <SafeAreaView style={styles.content} edges={['bottom']}>
        {error ? (
          <View style={styles.errorCard}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={28} color="#FF3B30" />
            </View>
            <Text style={[APPLE_TEXT_STYLES.headline, { color: '#fff', marginBottom: 8 }]}>
              {t('errorTitle')}
            </Text>
            <Text style={[APPLE_TEXT_STYLES.subhead, { color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: 24 }]}>
              {error}
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={goBack}>
              <Text style={[APPLE_TEXT_STYLES.headline, { color: '#000' }]}>{t('retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statusCard}>
            <Animated.View style={[styles.logoRing, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.logoInner}>
                <Ionicons name="sparkles" size={26} color="#fff" />
              </View>
            </Animated.View>

            <Text style={[APPLE_TEXT_STYLES.title3, { color: '#fff', marginBottom: 8, marginTop: 20 }]}>
              {t('analyzing.title')}
            </Text>

            <Animated.Text
              style={[APPLE_TEXT_STYLES.subhead, { color: 'rgba(255,255,255,0.65)', opacity: stageOpacity }]}
            >
              {STAGES[stageIndex]}
            </Animated.Text>

            <TouchableOpacity style={styles.cancelBtn} onPress={goBack}>
              <Text style={[APPLE_TEXT_STYLES.footnote, { color: 'rgba(255,255,255,0.45)' }]}>
                {t('cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Animated.View>
  );
}

const CORNER_W = 20;
const BORDER_W = 2.5;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },

  photoWrap: {
    height: 260,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  frameCorners: {
    ...StyleSheet.absoluteFillObject,
    margin: 24,
  },
  corner: {
    position: 'absolute',
    width: CORNER_W,
    height: CORNER_W,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  tl: { top: 0, left: 0, borderTopWidth: BORDER_W, borderLeftWidth: BORDER_W, borderTopLeftRadius: 3 },
  tr: { top: 0, right: 0, borderTopWidth: BORDER_W, borderRightWidth: BORDER_W, borderTopRightRadius: 3 },
  bl: { bottom: 0, left: 0, borderBottomWidth: BORDER_W, borderLeftWidth: BORDER_W, borderBottomLeftRadius: 3 },
  br: { bottom: 0, right: 0, borderBottomWidth: BORDER_W, borderRightWidth: BORDER_W, borderBottomRightRadius: 3 },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  statusCard: {
    alignItems: 'center',
    width: '100%',
  },
  logoRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  logoInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    marginTop: 40,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },

  errorCard: {
    alignItems: 'center',
    width: '100%',
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,59,48,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.25)',
  },
  retryBtn: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
});
