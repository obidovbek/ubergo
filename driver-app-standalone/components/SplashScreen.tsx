/**
 * Splash Screen Component
 * Creative loading screen for driver app with driver/car theme
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
  const steeringWheelRotate = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const carScale = useRef(new Animated.Value(0.8)).current;
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

    // Steering wheel rotation
    Animated.loop(
      Animated.sequence([
        Animated.timing(steeringWheelRotate, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(steeringWheelRotate, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Car pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(carScale, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(carScale, {
            toValue: 0.9,
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
        ]),
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

  const steeringRotation = steeringWheelRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-30deg', '30deg'],
  });

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

      {/* Content */}
      <View style={styles.content}>
        {/* Logo and branding */}
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
          <Text style={styles.tagline}>Drive & Earn</Text>
        </Animated.View>

        {/* Steering wheel and car */}
        <View style={styles.iconContainer}>
          <Animated.View
            style={[
              styles.steeringWheelContainer,
              {
                transform: [{ rotate: steeringRotation }],
              },
            ]}
          >
            <Text style={styles.steeringWheel}>🚗</Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.carContainer,
              {
                transform: [{ scale: carScale }],
                opacity: pulseAnim,
              },
            ]}
          >
            <Text style={styles.carEmoji}>🚙</Text>
          </Animated.View>
        </View>

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
                      inputRange: [1, 1.1],
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
    backgroundColor: '#0d1b2a',
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
    left: -100,
  },
  circle2: {
    width: 300,
    height: 300,
    backgroundColor: theme.palette.secondary.main,
    bottom: -50,
    right: -50,
  },
  roadContainer: {
    position: 'absolute',
    bottom: height * 0.25,
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
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
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
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  steeringWheelContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  steeringWheel: {
    fontSize: 80,
  },
  carContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carEmoji: {
    fontSize: 80,
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

