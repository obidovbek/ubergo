/**
 * Blocked Screen
 * Creative and modern design for blocked/pending deletion accounts
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { createTheme } from '../themes';
import { useTranslation } from '../hooks/useTranslation';

const { width } = Dimensions.get('window');
const theme = createTheme('light');

export const BlockedScreen: React.FC = () => {
  const { logout, user } = useAuth();
  const { t } = useTranslation();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [supportContact, setSupportContact] = useState<{ email: string; phone: string }>({
    email: 'support@ubexgo.uz',
    phone: '+998901234567',
  });
  const [loadingContact, setLoadingContact] = useState(false);

  const status = (user as any)?.status;
  const isBlocked = status === 'blocked';
  const isPendingDelete = status === 'pending_delete';

  // Fetch support contact from API (if available)
  useEffect(() => {
    // TODO: Implement support contact API call if available
    // For now, using default values
    setLoadingContact(false);
  }, []);

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const getStatusConfig = () => {
    if (isBlocked) {
      return {
        icon: '🚫',
        title: t('auth.accountBlocked'),
        description: t('auth.accountBlockedDescription'),
        primaryColor: '#FF6B6B',
        secondaryColor: '#EE5A6F',
        iconBg: '#FF6B6B15',
        cardBg: '#FFF5F5',
      };
    }
    if (isPendingDelete) {
      return {
        icon: '⏳',
        title: t('auth.accountPendingDelete'),
        description: t('auth.accountPendingDeleteDescription'),
        primaryColor: '#FFA726',
        secondaryColor: '#FB8C00',
        iconBg: '#FFA72615',
        cardBg: '#FFF8F0',
      };
    }
    return {
      icon: '⚠️',
      title: t('auth.accountSuspended'),
      description: t('auth.accountSuspendedDescription'),
      primaryColor: '#FFB74D',
      secondaryColor: '#FFA726',
      iconBg: '#FFB74D15',
      cardBg: '#FFFBF0',
    };
  };

  const config = getStatusConfig();

  // Use support contact from API
  const email = supportContact.email;
  const phone = supportContact.phone.replace(/\s/g, '');

  const handleEmailPress = async () => {
    const emailUrl = `mailto:${email}?subject=${encodeURIComponent('Account Support Request')}&body=${encodeURIComponent('Hello,\n\nI need assistance with my account.\n\nThank you.')}`;
    
    try {
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert(
          t('common.error'),
          t('auth.emailNotAvailable')
        );
      }
    } catch (error) {
      console.error('Error opening email:', error);
      Alert.alert(
        t('common.error'),
        t('auth.emailError')
      );
    }
  };

  const handlePhonePress = async () => {
    const phoneUrl = `tel:${phone}`;
    
    try {
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert(
          t('common.error'),
          t('auth.phoneNotAvailable')
        );
      }
    } catch (error) {
      console.error('Error opening phone:', error);
      Alert.alert(
        t('common.error'),
        t('auth.phoneError')
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.background}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Icon Container with Animation */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: config.iconBg,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Text style={styles.icon}>{config.icon}</Text>
            </Animated.View>

            {/* Title */}
            <Text style={[styles.title, { color: config.primaryColor }]}>
              {config.title}
            </Text>

            {/* Description Card */}
            <View style={[styles.descriptionCard, { backgroundColor: config.cardBg }]}>
              <View style={[styles.cardAccent, { backgroundColor: config.primaryColor }]} />
              <Text style={styles.description}>{config.description}</Text>
            </View>

            {/* Support Information Card */}
            <View style={styles.supportCard}>
              <View style={styles.supportHeader}>
                <View style={[styles.supportIconContainer, { backgroundColor: config.iconBg }]}>
                  <Text style={styles.supportIcon}>💬</Text>
                </View>
                <Text style={[styles.supportTitle, { color: config.primaryColor }]}>
                  {t('auth.contactSupport')}
                </Text>
              </View>
              
              <View style={styles.supportInfo}>
                <TouchableOpacity
                  style={styles.supportRow}
                  onPress={handleEmailPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.supportLabelContainer, { backgroundColor: config.iconBg }]}>
                    <Text style={styles.supportLabel}>📧</Text>
                  </View>
                  <Text style={[styles.supportText, styles.clickableText]}>
                    {loadingContact ? t('common.loading') : email}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.supportRow}
                  onPress={handlePhonePress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.supportLabelContainer, { backgroundColor: config.iconBg }]}>
                    <Text style={styles.supportLabel}>📞</Text>
                  </View>
                  <Text style={[styles.supportText, styles.clickableText]}>
                    {loadingContact ? t('common.loading') : phone}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: config.primaryColor },
                styles.buttonShadow,
              ]}
              onPress={logout}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {t('auth.logout')}
              </Text>
            </TouchableOpacity>

            {/* Decorative Elements */}
            <View style={[styles.decorativeCircle1, { backgroundColor: config.iconBg }]} />
            <View style={[styles.decorativeCircle2, { backgroundColor: config.iconBg }]} />
            <View style={[styles.decorativeCircle3, { backgroundColor: config.iconBg }]} />
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  background: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    minHeight: '100%',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    ...theme.shadows.lg,
  },
  icon: {
    fontSize: 72,
  },
  title: {
    ...theme.typography.h2,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '700',
    fontSize: 28,
  },
  descriptionCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    width: '100%',
    ...theme.shadows.md,
    position: 'relative',
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  description: {
    ...theme.typography.body1,
    color: '#5A6C7D',
    textAlign: 'center',
    lineHeight: 26,
    fontSize: 16,
  },
  supportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    width: '100%',
    ...theme.shadows.md,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  supportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  supportIcon: {
    fontSize: 24,
  },
  supportTitle: {
    ...theme.typography.h5,
    fontWeight: '700',
    fontSize: 18,
  },
  supportInfo: {
    gap: 16,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  supportLabelContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  supportLabel: {
    fontSize: 20,
  },
  supportText: {
    ...theme.typography.body2,
    color: '#5A6C7D',
    flex: 1,
    fontSize: 14,
  },
  clickableText: {
    color: '#4A90E2',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  primaryButton: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  buttonShadow: {
    ...theme.shadows.lg,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -80,
    right: -80,
    zIndex: 0,
    opacity: 0.3,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    bottom: 120,
    left: -40,
    zIndex: 0,
    opacity: 0.2,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: '45%',
    right: 30,
    zIndex: 0,
    opacity: 0.25,
  },
});

