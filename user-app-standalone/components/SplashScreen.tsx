/**
 * Splash Screen Component
 * Professional loading screen for user app with modern design
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '../hooks/useTranslation';
import { createTheme } from '../themes';

const { width, height } = Dimensions.get('window');
const theme = createTheme('light');

export const SplashScreen: React.FC = () => {
  const { t } = useTranslation();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo fade in and scale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle logo rotation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shimmer effect
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const logoRotation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.background}>
        {/* Gradient overlay circles */}
        <View style={[styles.gradientCircle, styles.circle1]} />
        <View style={[styles.gradientCircle, styles.circle2]} />
        <View style={[styles.gradientCircle, styles.circle3]} />

        {/* Shimmer overlay */}
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { rotate: logoRotation },
                ],
              },
            ]}
          >
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>{t('splash.appName')}</Text>
            </View>
          </Animated.View>

          {/* Tagline */}
          <Animated.View
            style={[
              styles.taglineContainer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Text style={styles.tagline}>{t('splash.tagline')}</Text>
          </Animated.View>

          {/* Loading indicator */}
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#4A90E2"
              style={styles.spinner}
            />
            <Animated.Text
              style={[
                styles.loadingText,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              {t('splash.loading')}
            </Animated.Text>
          </View>
        </View>

        {/* Bottom accent */}
        <View style={styles.bottomAccent} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: '#0a1929',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  gradientCircle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.08,
  },
  circle1: {
    width: 500,
    height: 500,
    backgroundColor: '#4A90E2',
    top: -150,
    right: -150,
  },
  circle2: {
    width: 400,
    height: 400,
    backgroundColor: '#00D9A5',
    bottom: -100,
    left: -100,
  },
  circle3: {
    width: 300,
    height: 300,
    backgroundColor: '#4A90E2',
    top: '50%',
    left: '50%',
    marginTop: -150,
    marginLeft: -150,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width * 2,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    transform: [{ skewX: '-20deg' }],
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(74, 144, 226, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(74, 144, 226, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  taglineContainer: {
    marginBottom: 48,
    paddingHorizontal: 32,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '400',
    color: '#E0E0E0',
    textAlign: 'center',
    letterSpacing: 0.5,
    opacity: 0.9,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#B0B0B0',
    letterSpacing: 0.5,
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(74, 144, 226, 0.4)',
  },
});
