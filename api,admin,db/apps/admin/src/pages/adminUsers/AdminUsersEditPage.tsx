/**
 * Admin Users Edit Page
 * Form to edit an existing admin user
 */

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import * as adminUsersApi from '../../api/adminUsers';
import { Button } from '../../components/Button';
import { isValidEmail } from '../../utils/validation';
import { translations } from '../../utils/translations';
import './AdminUsersEditPage.css';

export const AdminUsersEditPage = () => {
  const ROLE_OPTIONS = [
    { value: 'main_admin', label: translations.roles.mainAdmin },
    { value: 'dispatcher', label: translations.roles.dispatcher },
    { value: 'support', label: translations.roles.support },
    { value: 'manager', label: translations.roles.manager },
    { value: 'viewer', label: translations.roles.viewer },
  ];

  const STATUS_OPTIONS = [
    { value: 'active', label: translations.status.active },
    { value: 'inactive', label: translations.status.inactive },
    { value: 'suspended', label: translations.status.suspended },
  ];
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role_slugs: [] as string[],
    status: 'active' as 'active' | 'inactive' | 'suspended',
  });

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    full_name?: string;
  }>({});

  useEffect(() => {
    if (token && id) {
      loadAdminUser();
    }
  }, [token, id]);

  const loadAdminUser = async () => {
    if (!token || !id) return;

    try {
      setLoading(true);
      setError(null);
      const user = await adminUsersApi.getAdminUserById(token, id);
      setFormData({
        email: user.email,
        password: '', // Don't pre-fill password
        full_name: user.full_name,
        role_slugs: user.roles.map((r) => r.slug),
        status: user.status,
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

    if (!validate() || !token || !id) return;

    try {
      setSaving(true);
      setError(null);

      const updateData: adminUsersApi.UpdateAdminUserData = {
        email: formData.email,
        full_name: formData.full_name,
        role_slugs: formData.role_slugs,
        status: formData.status,
      };

      // Only include password if it's been changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      await adminUsersApi.updateAdminUser(token, id, updateData);

      navigate('/admin-users');
    } catch (err) {
      setError(err instanceof Error ? err.message : translations.errors.updateFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleToggle = (roleSlug: string) => {
    setFormData((prev) => ({
      ...prev,
      role_slugs: prev.role_slugs.includes(roleSlug)
        ? prev.role_slugs.filter((r) => r !== roleSlug)
        : [...prev.role_slugs, roleSlug],
    }));
  };

  if (loading) {
    return (
      <div className="admin-users-form-page">
        <div className="loading">{translations.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="admin-users-form-page">
      <div className="page-header">
        <h1>{translations.adminUsers.editTitle}</h1>
        <Button variant="outlined" onClick={() => navigate('/admin-users')}>
          {translations.adminUsers.backToList}
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="admin-users-form">
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

          <div className="form-group">
            <label htmlFor="status">{translations.common.status} *</label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'active' | 'inactive' | 'suspended',
                })
              }
              disabled={saving}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Rollar</div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>{translations.common.roles}</label>
            <div className="roles-checkbox-group">
              {ROLE_OPTIONS.map((role) => (
                <label key={role.value} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.role_slugs.includes(role.value)}
                    onChange={() => handleRoleToggle(role.value)}
                    disabled={saving}
                  />
                  <span>{role.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <Button variant="outlined" type="button" onClick={() => navigate('/admin-users')}>
            {translations.common.cancel}
          </Button>
          <Button type="submit" loading={saving}>
            {translations.adminUsers.updateButton}
          </Button>
        </div>
      </form>
    </div>
  );
};

