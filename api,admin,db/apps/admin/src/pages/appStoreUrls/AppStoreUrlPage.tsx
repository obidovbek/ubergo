/**
 * App Store URL Settings Page
 * Admin page for managing app store URLs for user and driver apps
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import * as appStoreUrlsApi from '../../api/appStoreUrls';
import type { AppStoreUrl } from '../../api/appStoreUrls';
import { translations } from '../../utils/translations';
import './AppStoreUrlPage.css';

export const AppStoreUrlPage = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [userAppUrls, setUserAppUrls] = useState<AppStoreUrl>({
    app_name: 'user_app',
    android_url: '',
    ios_url: '',
  });
  
  const [driverAppUrls, setDriverAppUrls] = useState<AppStoreUrl>({
    app_name: 'driver_app',
    android_url: '',
    ios_url: '',
  });

  useEffect(() => {
    if (token) {
      loadAppStoreUrls();
    }
  }, [token]);

  const loadAppStoreUrls = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      
      const [userApp, driverApp] = await Promise.all([
        appStoreUrlsApi.getAppStoreUrls(token, 'user_app'),
        appStoreUrlsApi.getAppStoreUrls(token, 'driver_app'),
      ]);

      setUserAppUrls({
        app_name: 'user_app',
        android_url: userApp.android_url || '',
        ios_url: userApp.ios_url || '',
      });

      setDriverAppUrls({
        app_name: 'driver_app',
        android_url: driverApp.android_url || '',
        ios_url: driverApp.ios_url || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : translations.errors.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (appName: 'user_app' | 'driver_app') => {
    if (!token) return;

    const urls = appName === 'user_app' ? userAppUrls : driverAppUrls;

    // Validate URLs
    if (urls.android_url && !isValidUrl(urls.android_url)) {
      setError('Invalid Android URL format');
      return;
    }

    if (urls.ios_url && !isValidUrl(urls.ios_url)) {
      setError('Invalid iOS URL format');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await appStoreUrlsApi.updateAppStoreUrls(token, appName, {
        android_url: urls.android_url || null,
        ios_url: urls.ios_url || null,
      });

      setSuccess(translations.appStoreUrls?.updateSuccess || 'App store URLs updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : translations.errors.updateFailed || 'Failed to update app store URLs');
    } finally {
      setSaving(false);
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const renderUrlForm = (
    urls: AppStoreUrl,
    setUrls: (urls: AppStoreUrl) => void,
    appName: 'user_app' | 'driver_app',
    appLabel: string
  ) => {
    return (
      <div className="app-store-url-card">
        <h2 className="url-card-title">{appLabel}</h2>
        <div className="url-form">
          <div className="form-group">
            <label htmlFor={`${appName}-android`}>
              {translations.appStoreUrls?.androidUrl || 'Android URL (Google Play)'}
            </label>
            <input
              id={`${appName}-android`}
              type="url"
              value={urls.android_url || ''}
              onChange={(e) => setUrls({ ...urls, android_url: e.target.value })}
              placeholder="https://play.google.com/store/apps/details?id=com.ubexgo.user"
              className="form-input"
            />
            <small className="form-hint">
              {translations.appStoreUrls?.androidHint || 'Google Play Store URL'}
            </small>
          </div>
          <div className="form-group">
            <label htmlFor={`${appName}-ios`}>
              {translations.appStoreUrls?.iosUrl || 'iOS URL (App Store)'}
            </label>
            <input
              id={`${appName}-ios`}
              type="url"
              value={urls.ios_url || ''}
              onChange={(e) => setUrls({ ...urls, ios_url: e.target.value })}
              placeholder="https://apps.apple.com/us/app/ubexgo-user/id1234567890"
              className="form-input"
            />
            <small className="form-hint">
              {translations.appStoreUrls?.iosHint || 'Apple App Store URL'}
            </small>
          </div>
          <Button
            onClick={() => handleSave(appName)}
            disabled={saving}
            className="save-button"
          >
            {saving ? translations.common.loading : translations.common.save || 'Save'}
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="app-store-url-page">
        <div className="page-header">
          <h1>{translations.appStoreUrls?.title || 'App Store URL Settings'}</h1>
        </div>
        <div className="loading">{translations.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="app-store-url-page">
      <div className="page-header">
        <h1>{translations.appStoreUrls?.title || 'App Store URL Settings'}</h1>
        <p className="page-description">
          {translations.appStoreUrls?.description || 'Manage app store URLs shown to users when they need to download the apps'}
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="app-store-urls-container">
        {renderUrlForm(
          userAppUrls,
          setUserAppUrls,
          'user_app',
          translations.appStoreUrls?.userApp || 'User App (Passenger App)'
        )}
        {renderUrlForm(
          driverAppUrls,
          setDriverAppUrls,
          'driver_app',
          translations.appStoreUrls?.driverApp || 'Driver App'
        )}
      </div>
    </div>
  );
};

