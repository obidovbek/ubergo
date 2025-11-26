/**
 * Register First Screen
 * Shown when driver tries to register with phone number not registered in user app
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { createTheme } from '../themes';
import { useTranslation } from '../hooks/useTranslation';

const theme = createTheme('light');

export const RegisterFirstScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  
  // Extract app store URLs from route params
  const routeParams = route.params as any;
  const appStoreUrls = routeParams?.appStoreUrls || {
    android: 'https://play.google.com/store/apps/details?id=com.ubexgo.user',
    ios: 'https://apps.apple.com/us/app/ubexgo-user/id1234567890',
  };

  console.log('RegisterFirstScreen - Route params:', routeParams);
  console.log('RegisterFirstScreen - App store URLs:', appStoreUrls);

  const handleOpenStore = async (platform: 'android' | 'ios') => {
    const url = platform === 'android' ? appStoreUrls.android : appStoreUrls.ios;
    
    if (!url) {
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.error('Cannot open URL:', url);
      }
    } catch (error) {
      console.error('Error opening app store:', error);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📱</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {t('registerFirst.title')}
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          {t('registerFirst.description')}
        </Text>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>
              {t('registerFirst.step1')}
            </Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>
              {t('registerFirst.step2')}
            </Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>
              {t('registerFirst.step3')}
            </Text>
          </View>
        </View>

        {/* App Store Buttons - Always show both */}
        <View style={styles.storeButtonsContainer}>
          {appStoreUrls.android && (
            <TouchableOpacity
              style={[styles.storeButton, styles.androidButton]}
              onPress={() => handleOpenStore('android')}
              activeOpacity={0.7}
            >
              <Text style={styles.storeButtonIcon}>📱</Text>
              <View style={styles.storeButtonTextContainer}>
                <Text style={styles.storeButtonText}>
                  {t('registerFirst.downloadAndroid')}
                </Text>
                <Text style={styles.storeButtonSubtext}>
                  Google Play
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {appStoreUrls.ios && (
            <TouchableOpacity
              style={[styles.storeButton, styles.iosButton]}
              onPress={() => handleOpenStore('ios')}
              activeOpacity={0.7}
            >
              <View style={styles.storeButtonIconContainer}>
                <MaterialIcons name="phone-iphone" size={32} color="#fff" />
              </View>
              <View style={styles.storeButtonTextContainer}>
                <Text style={styles.storeButtonText}>
                  {t('registerFirst.downloadIOS')}
                </Text>
                <Text style={styles.storeButtonSubtext}>
                  App Store
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {!appStoreUrls.android && !appStoreUrls.ios && (
            <View style={styles.noUrlsContainer}>
              <Text style={styles.noUrlsText}>
                {t('registerFirst.noUrlsAvailable') || 'App store URLs are not configured'}
              </Text>
            </View>
          )}
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>
            {t('common.back')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.palette.background.default,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.palette.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    ...theme.typography.h3,
    color: theme.palette.text.primary,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  description: {
    ...theme.typography.body1,
    color: theme.palette.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  stepsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.palette.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  stepNumberText: {
    ...theme.typography.body2,
    color: theme.palette.primary.contrastText,
    fontWeight: 'bold',
  },
  stepText: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    flex: 1,
    lineHeight: 22,
  },
  storeButtonsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  storeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...theme.shadows.md,
  },
  androidButton: {
    backgroundColor: '#000',
  },
  iosButton: {
    backgroundColor: '#007AFF',
  },
  storeButtonIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  storeButtonIconContainer: {
    width: 32,
    height: 32,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeButtonTextContainer: {
    flex: 1,
  },
  storeButtonText: {
    ...theme.typography.body1,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  storeButtonSubtext: {
    ...theme.typography.body2,
    color: '#fff',
    opacity: 0.8,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.palette.primary.main,
  },
  backButtonText: {
    ...theme.typography.button,
    color: theme.palette.primary.main,
  },
  noUrlsContainer: {
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  noUrlsText: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    textAlign: 'center',
  },
});

