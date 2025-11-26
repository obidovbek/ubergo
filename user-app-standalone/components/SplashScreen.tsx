/**
 * Splash Screen Component
 * Creative loading screen for user app with passenger/taxi theme
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createTheme } from '../themes';

const { width, height } = Dimensions.get('window');
const theme = createTheme('light');

export const SplashScreen: React.FC = () => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const taxiX = useRef(new Animated.Value(-100)).current;
  const taxiY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const roadLine1 = useRef(new Animated.Value(0)).current;
  const roadLine2 = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    // Logo fade in and scale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Taxi animation - moving across screen
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(taxiX, {
            toValue: width + 100,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(taxiY, {
              toValue: -10,
              duration: 500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(taxiY, {
              toValue: 10,
              duration: 500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(taxiY, {
              toValue: 0,
              duration: 500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.timing(taxiX, {
          toValue: -100,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulsing loading indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Road lines animation
    Animated.loop(
      Animated.parallel([
        Animated.timing(roadLine1, {
          toValue: width,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(roadLine2, {
          toValue: 0,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.background}>
        <View style={[styles.gradientCircle, styles.circle1]} />
        <View style={[styles.gradientCircle, styles.circle2]} />
      </View>

      {/* Road lines */}
      <View style={styles.roadContainer}>
        <Animated.View
          style={[
            styles.roadLine,
            {
              transform: [{ translateX: roadLine1 }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.roadLine,
            {
              transform: [{ translateX: roadLine2 }],
            },
          ]}
        />
      </View>

      {/* Moving taxi */}
      <Animated.View
        style={[
          styles.taxiContainer,
          {
            transform: [
              { translateX: taxiX },
              { translateY: taxiY },
            ],
          },
        ]}
      >
        <Text style={styles.taxiEmoji}>🚕</Text>
      </Animated.View>

      {/* Logo and branding */}
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.logo}>UbexGo</Text>
          <Text style={styles.tagline}>Your Ride, Your Way</Text>
        </Animated.View>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingDot,
              styles.dot1,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              styles.dot2,
              {
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [1, 1.2],
                      outputRange: [1, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              styles.dot3,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gradientCircle: {
    position: 'absolute',
    borderRadius: 500,
    opacity: 0.1,
  },
  circle1: {
    width: 400,
    height: 400,
    backgroundColor: theme.palette.primary.main,
    top: -100,
    right: -100,
  },
  circle2: {
    width: 300,
    height: 300,
    backgroundColor: theme.palette.secondary.main,
    bottom: -50,
    left: -50,
  },
  roadContainer: {
    position: 'absolute',
    bottom: height * 0.3,
    width: '100%',
    height: 4,
    overflow: 'hidden',
  },
  roadLine: {
    position: 'absolute',
    width: 60,
    height: 4,
    backgroundColor: '#fff',
    opacity: 0.3,
  },
  taxiContainer: {
    position: 'absolute',
    bottom: height * 0.28,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taxiEmoji: {
    fontSize: 60,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    letterSpacing: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.palette.primary.main,
    marginHorizontal: 6,
  },
  dot1: {
    backgroundColor: theme.palette.primary.main,
  },
  dot2: {
    backgroundColor: theme.palette.secondary.main,
  },
  dot3: {
    backgroundColor: theme.palette.primary.main,
  },
});

