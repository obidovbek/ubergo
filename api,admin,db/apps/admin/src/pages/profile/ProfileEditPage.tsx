/**
 * Profile Edit Page
 * Form to edit current user profile
 */

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getCurrentUser } from '../../api/auth';
import { updateAdminUser } from '../../api/adminUsers';
import { Button } from '../../components/Button';
import { isValidEmail } from '../../utils/validation';
import { translations } from '../../utils/translations';
import './ProfileEditPage.css';

export const ProfileEditPage = () => {
  const navigate = useNavigate();
  const { user: authUser, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    full_name?: string;
  }>({});

  useEffect(() => {
    if (token && authUser) {
      loadUser();
    }
  }, [token, authUser]);

  const loadUser = async () => {
    if (!token || !authUser) return;

    try {
      setLoading(true);
      setError(null);
      const user = await getCurrentUser(token);
      setFormData({
        email: user.email,
        password: '', // Don't pre-fill password
        full_name: user.full_name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : translations.errors.loadUserFailed);
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.email.trim()) {
      newErrors.email = translations.validation.emailRequired;
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = translations.validation.emailInvalid;
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = translations.validation.passwordMinLength;
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = translations.validation.fullNameRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (!token || !authUser) {
      setError('Token yoki foydalanuvchi topilmadi');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      await updateAdminUser(token, authUser.id, updateData);
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : translations.errors.updateUserFailed);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-edit-page">
        <div className="loading">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="profile-edit-page">
      <div className="page-header">
        <h1>{translations.adminUsers.editProfile}</h1>
        <Button variant="outlined" onClick={() => navigate('/profile')}>
          {translations.common.cancel}
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="profile-edit-form">
        <div className="form-section">
          <div className="form-section-title">Asosiy Ma'lumotlar</div>
          
          <div className="form-group">
            <label htmlFor="full_name">{translations.adminUsers.fullName} *</label>
            <input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => {
                setFormData({ ...formData, full_name: e.target.value });
                if (errors.full_name) setErrors({ ...errors, full_name: undefined });
              }}
              className={errors.full_name ? 'error' : ''}
              disabled={saving}
              placeholder="To'liq ismni kiriting"
            />
            {errors.full_name && <span className="error-text">{errors.full_name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">{translations.common.email} *</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              className={errors.email ? 'error' : ''}
              disabled={saving}
              placeholder="email@example.com"
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">{translations.adminUsers.passwordKeepCurrent}</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              className={errors.password ? 'error' : ''}
              disabled={saving}
              placeholder={translations.adminUsers.passwordPlaceholder}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>
        </div>

        <div className="form-actions">
          <Button variant="outlined" type="button" onClick={() => navigate('/profile')}>
            {translations.common.cancel}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? translations.common.saving : translations.common.save}
          </Button>
        </div>
      </form>
    </div>
  );
};

