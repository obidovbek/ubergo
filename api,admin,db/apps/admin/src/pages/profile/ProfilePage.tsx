/**
 * Profile Page
 * Displays and edits current user profile information
 */

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateAdminUser } from '../../api/adminUsers';
import { Button } from '../../components/Button';
import { isValidEmail } from '../../utils/validation';
import { translations } from '../../utils/translations';
import './ProfilePage.css';

export const ProfilePage = () => {
  const { user, token, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    full_name: user?.full_name || '',
  });

  // Update formData when user changes
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        email: user.email || '',
        password: '',
        full_name: user.full_name || '',
      });
    }
  }, [user, isEditing]);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    full_name?: string;
  }>({});

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

  const handleEdit = () => {
    if (user) {
      setFormData({
        email: user.email,
        password: '',
        full_name: user.full_name,
      });
      setErrors({});
      setError(null);
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    setError(null);
    if (user) {
      setFormData({
        email: user.email,
        password: '',
        full_name: user.full_name,
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (!token || !user) {
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

      const updatedUser = await updateAdminUser(token, user.id, updateData);
      updateUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : translations.errors.updateUserFailed);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="error-message">Foydalanuvchi topilmadi</div>
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    return translations.status[status as keyof typeof translations.status] || status;
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>{translations.adminUsers.profile}</h1>
        {!isEditing ? (
          <Button onClick={handleEdit}>
            {translations.common.edit}
          </Button>
        ) : (
          <Button variant="outlined" onClick={handleCancel} disabled={saving}>
            {translations.common.cancel}
          </Button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {!isEditing ? (
        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-section">
              <h2 className="section-title">Asosiy Ma'lumotlar</h2>
              
              <div className="profile-field">
                <label>{translations.adminUsers.fullName}</label>
                <div className="field-value">{user.full_name}</div>
              </div>

              <div className="profile-field">
                <label>{translations.common.email}</label>
                <div className="field-value">{user.email}</div>
              </div>

              <div className="profile-field">
                <label>{translations.common.status}</label>
                <div className="field-value">
                  <span className={`status-badge status-${user.status}`}>
                    {getStatusLabel(user.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h2 className="section-title">{translations.common.roles}</h2>
              <div className="roles-list">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((role) => (
                    <div key={role.id} className="role-item">
                      <span className="role-name">{role.name}</span>
                      {role.description && (
                        <span className="role-description">{role.description}</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-roles">Rollar mavjud emas</div>
                )}
              </div>
            </div>

            {user.last_login_at && (
              <div className="profile-section">
                <h2 className="section-title">Oxirgi Kirish</h2>
                <div className="profile-field">
                  <div className="field-value">
                    {new Date(user.last_login_at).toLocaleString('uz-UZ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
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
            <Button variant="outlined" type="button" onClick={handleCancel} disabled={saving}>
              {translations.common.cancel}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? translations.common.saving : translations.common.save}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
