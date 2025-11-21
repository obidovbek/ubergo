/**
 * Login Page
 * User authentication page - Mantis Design Style
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isValidEmail } from '../../utils/validation';
import { EyeIcon, EyeOffIcon } from '../../components/icons';
import './LoginPage.css';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();
  
  const [email, setEmail] = useState('admin@ubexgo.com');
  const [password, setPassword] = useState('UbexGo@2025');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email talab qilinadi';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Noto\'g\'ri email formati';
    }

    if (!password) {
      newErrors.password = 'Parol talab qilinadi';
    } else if (password.length < 6) {
      newErrors.password = 'Parol kamida 6 belgidan iborat bo\'lishi kerak';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      await login({ email, password });
      navigate('/admin-users');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-background-shapes"></div>
      </div>
      
      <div className="login-header">
        <div className="login-logo">
          <div className="logo-diamond">
            <div className="logo-diamond-outer"></div>
            <div className="logo-diamond-inner"></div>
          </div>
          <span className="logo-text">UbexGo</span>
        </div>
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-card-header">
            <h1 className="login-title">Kirish</h1>
            <a href="#" className="login-link">Hisobingiz yo'qmi?</a>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email manzil</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                placeholder="info@codedthemes.com"
                className={errors.email ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Parol</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  className={errors.password ? 'error' : ''}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="checkbox-input"
                />
                <span>Meni eslab qol</span>
              </label>
              <a href="#" className="forgot-password-link">Parolni unutdingizmi?</a>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'Kirilmoqda...' : 'Kirish'}
            </button>
          </form>
        </div>
      </div>

      <div className="login-footer">
        <span>Boshqa kirish ko'rinishlarini ko'ring</span>
      </div>
    </div>
  );
};

