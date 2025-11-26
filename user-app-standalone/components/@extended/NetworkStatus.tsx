/**
 * Network Status Component
 * Shows interactive offline message when there's no internet connection
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from '../../hooks/useTranslation';
import { createTheme } from '../../themes';
import { Button } from '../Button';

const theme = createTheme('light');

export const NetworkStatus: React.FC = () => {
  const { t } = useTranslation();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for WiFi icon
    const pulse = Animated.loop(
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
    );

    // Rotate animation for car icon
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    pulse.start();
    rotate.start();

    return () => {
      pulse.stop();
      rotate.stop();
    };
  }, []);

  const handleRetry = async () => {
    const state = await NetInfo.fetch();
    // The App.tsx will automatically detect the connection change
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        {/* Main WiFi Off Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <MaterialIcons
            name="wifi-off"
            size={120}
            color={theme.palette.error.main}
          />
        </Animated.View>

        {/* Decorative car icons */}
        <View style={styles.decorativeIcons}>
          <Animated.View
            style={[
              styles.carIcon,
              styles.carIconLeft,
              {
                transform: [{ rotate: rotateInterpolate }],
              },
            ]}
          >
            <MaterialIcons
              name="directions-car"
              size={40}
              color={theme.palette.grey[300]}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.carIcon,
              styles.carIconRight,
              {
                transform: [{ rotate: rotateInterpolate }],
              },
            ]}
          >
            <MaterialIcons
              name="local-taxi"
              size={40}
              color={theme.palette.grey[300]}
            />
          </Animated.View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{t('networkStatus.noInternet')}</Text>

        {/* Message */}
        <Text style={styles.message}>{t('networkStatus.noInternetMessage')}</Text>

        {/* Additional context message */}
        <View style={styles.infoContainer}>
          <MaterialIcons
            name="info-outline"
            size={20}
            color={theme.palette.info.main}
            style={styles.infoIcon}
          />
          <Text style={styles.infoText}>{t('networkStatus.hint')}</Text>
        </View>

        {/* Retry Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={t('networkStatus.retry')}
            onPress={handleRetry}
            variant="primary"
            size="large"
            style={styles.retryButton}
          />
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <View style={styles.tipItem}>
            <MaterialIcons
              name="signal-wifi-off"
              size={24}
              color={theme.palette.text.secondary}
            />
            <Text style={styles.tipText}>{t('networkStatus.tip1')}</Text>
          </View>
          <View style={styles.tipItem}>
            <MaterialIcons
              name="refresh"
              size={24}
              color={theme.palette.text.secondary}
            />
            <Text style={styles.tipText}>{t('networkStatus.tip2')}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(4),
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: theme.spacing(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorativeIcons: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing(6),
    opacity: 0.3,
  },
  carIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carIconLeft: {
    alignSelf: 'flex-start',
  },
  carIconRight: {
    alignSelf: 'flex-end',
  },
  title: {
    ...theme.typography.h3,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(2),
    textAlign: 'center',
    fontWeight: '700',
  },
  message: {
    ...theme.typography.body1,
    color: theme.palette.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing(3),
    lineHeight: 24,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.palette.info.light + '20',
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing(4),
    width: '100%',
  },
  infoIcon: {
    marginRight: theme.spacing(1.5),
  },
  infoText: {
    ...theme.typography.body2,
    color: theme.palette.info.dark,
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: theme.spacing(4),
  },
  retryButton: {
    minWidth: 200,
    alignSelf: 'center',
  },
  tipsContainer: {
    width: '100%',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing(1.5),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing(2),
  },
  tipText: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    marginLeft: theme.spacing(2),
    flex: 1,
  },
});


