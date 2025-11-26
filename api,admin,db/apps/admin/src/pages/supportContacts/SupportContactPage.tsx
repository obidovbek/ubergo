/**
 * Support Contact Settings Page
 * Admin page for managing support contact information
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import * as supportContactsApi from '../../api/supportContacts';
import type { SupportContact } from '../../api/supportContacts';
import { translations } from '../../utils/translations';
import './SupportContactPage.css';

export const SupportContactPage = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [userAppContact, setUserAppContact] = useState<SupportContact>({
    app_name: 'user_app',
    email: '',
    phone: '',
  });
  
  const [driverAppContact, setDriverAppContact] = useState<SupportContact>({
    app_name: 'driver_app',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (token) {
      loadSupportContacts();
    }
  }, [token]);

  const loadSupportContacts = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      
      const [userApp, driverApp] = await Promise.all([
        supportContactsApi.getSupportContact(token, 'user_app'),
        supportContactsApi.getSupportContact(token, 'driver_app'),
      ]);

      setUserAppContact({
        app_name: 'user_app',
        email: userApp.email || '',
        phone: userApp.phone || '',
      });

      setDriverAppContact({
        app_name: 'driver_app',
        email: driverApp.email || '',
        phone: driverApp.phone || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : translations.errors.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (appName: 'user_app' | 'driver_app') => {
    if (!token) return;

    const contact = appName === 'user_app' ? userAppContact : driverAppContact;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await supportContactsApi.updateSupportContact(token, appName, {
        email: contact.email || null,
        phone: contact.phone || null,
      });

      setSuccess(translations.supportContacts.updateSuccess || 'Support contact updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : translations.errors.updateFailed || 'Failed to update support contact');
    } finally {
      setSaving(false);
    }
  };

  const renderContactForm = (
    contact: SupportContact,
    setContact: (contact: SupportContact) => void,
    appName: 'user_app' | 'driver_app',
    appLabel: string
  ) => {
    return (
      <div className="support-contact-card">
        <h2 className="contact-card-title">{appLabel}</h2>
        <div className="contact-form">
          <div className="form-group">
            <label htmlFor={`${appName}-email`}>
              {translations.supportContacts.email || 'Email'}
            </label>
            <input
              id={`${appName}-email`}
              type="email"
              value={contact.email || ''}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              placeholder="support@ubexgo.uz"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor={`${appName}-phone`}>
              {translations.supportContacts.phone || 'Phone'}
            </label>
            <input
              id={`${appName}-phone`}
              type="tel"
              value={contact.phone || ''}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              placeholder="+998901234567"
              className="form-input"
            />
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
      <div className="support-contact-page">
        <div className="page-header">
          <h1>{translations.supportContacts.title || 'Support Contact Settings'}</h1>
        </div>
        <div className="loading">{translations.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="support-contact-page">
      <div className="page-header">
        <h1>{translations.supportContacts.title || 'Support Contact Settings'}</h1>
        <p className="page-description">
          {translations.supportContacts.description || 'Manage support contact information shown to blocked users'}
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="support-contacts-container">
        {renderContactForm(
          userAppContact,
          setUserAppContact,
          'user_app',
          translations.supportContacts.userApp || 'User App'
        )}
        {renderContactForm(
          driverAppContact,
          setDriverAppContact,
          'driver_app',
          translations.supportContacts.driverApp || 'Driver App'
        )}
      </div>
    </div>
  );
};

