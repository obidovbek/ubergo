/**
 * Splash Screen Component
 * Professional loading screen for driver app with modern design
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
              {/*
                T-050: the wordmark used to wrap and drop its final "o" onto a
                second line. "UbexGo" at 36px bold + letterSpacing 2 needs
                ~150-160px; the circle is 140px wide, so it never fit — a large
                system font scale only made an existing overflow obvious.
                One line, always, shrunk to fit rather than re-wrapped.
              */}
              <Text
                style={styles.logoText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {t('splash.appName')}
              </Text>
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
              color={theme.palette.action}
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
    // T-101 (2026-08-31): this screen was dark navy (#0d1b2a) from the pre-redesign
    // look — the twin of the user app's splash, redesigned the same day. No artboard
    // defines a splash, so the owner chose to bring it onto the light system rather
    // than keep one dark screen in a light-only app.
    backgroundColor: theme.palette.ground,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  gradientCircle: {
    position: 'absolute',
    borderRadius: 1000,
    // The dark version hid these at 0.08 against navy. On the light ground the same
    // opacity is invisible, so the tint does the work instead of the alpha.
    opacity: 0.5,
  },
  // NOTE: the driver app mirrors the user app's circle layout (left/right swapped).
  // That is a pre-existing, deliberate difference — preserved, not "corrected".
  circle1: {
    width: 500,
    height: 500,
    backgroundColor: theme.palette.successTintSoft,
    top: -150,
    left: -150,
  },
  circle2: {
    width: 400,
    height: 400,
    backgroundColor: theme.palette.successTint,
    bottom: -100,
    right: -100,
  },
  circle3: {
    width: 300,
    height: 300,
    backgroundColor: theme.palette.successTintSoft,
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
    // A white sheen is invisible on a light ground; the sweep now reads as a very
    // faint lift of the surface colour instead.
    backgroundColor: theme.palette.surface,
    opacity: 0.35,
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
    backgroundColor: theme.palette.surface,
    borderWidth: 2,
    borderColor: theme.palette.action,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.raised,
  },
  logoText: {
    fontSize: 36,
    // The artboards set the wordmark at weight 900; Manrope stops at 800 and Google
    // Fonts silently serves 800 for 900, so 800 IS what the design renders.
    ...theme.font('sans', 800),
    /**
     * 🔴 `action`, NOT `brand` — the same measured departure made in the user app.
     * `brand` #05BB42 is 2.56:1 on white; `action` is 5.29:1.
     * 🔵 AND NOT `brandSuffix` EITHER. The driver wordmark is two words in the
     * artboards ("UbexGo" green + "Driver" blue); this splash renders ONE string from
     * `t('splash.appName')`, so it is the green half. Do not paint it blue.
     */
    color: theme.palette.action,
    // T-050: letterSpacing was the hidden cost — 6 characters carry 6 extra
    // points of width, which is what pushed "UbexGo" past the 140px circle.
    letterSpacing: 1,
    // Give adjustsFontSizeToFit a defined width to shrink into, and keep the
    // glyphs off the circle's border.
    width: '100%',
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  taglineContainer: {
    marginBottom: 48,
    paddingHorizontal: 32,
  },
  tagline: {
    fontSize: 18,
    // text.secondary measures 3.98:1 here and 18px regular is NOT "large text"
    // (that needs 18pt/24px, or 14pt bold). text.muted is 6.41:1.
    color: theme.palette.text.muted,
    textAlign: 'center',
    letterSpacing: 0.5,
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
    // text.tertiary measures 3.28:1 — fine for the meta text it is named for, not for
    // a 14px label that a user reads while waiting.
    color: theme.palette.text.muted,
    letterSpacing: 0.5,
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: theme.palette.brand,
  },
});
