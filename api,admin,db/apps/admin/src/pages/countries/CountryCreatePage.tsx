import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import {
  createCountry,
  type CountryPayload,
  type CountryPattern,
} from '../../api/countries';
import { translations } from '../../utils/translations';
import './CountryFormPage.css';

type CountryFormState = {
  name: string;
  code: string;
  flag: string;
  local_length: string;
  pattern: CountryPattern;
  sort_order: string;
  is_active: boolean;
};

type CountryFormErrors = Partial<Record<keyof Pick<CountryFormState, 'name' | 'code' | 'local_length' | 'pattern'>, string>>;

const PATTERN_OPTIONS: { value: CountryPattern; label: string }[] = [
  { value: 'uz', label: translations.countries.patterns.uz },
  { value: 'ru', label: translations.countries.patterns.ru },
  { value: 'generic', label: translations.countries.patterns.generic },
];

export const CountryCreatePage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<CountryFormState>({
    name: '',
    code: '',
    flag: '',
    local_length: '',
    pattern: 'generic',
    sort_order: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<CountryFormErrors>({});

  const validate = (): boolean => {
    const errors: CountryFormErrors = {};

    if (!formState.name.trim()) {
      errors.name = translations.validation.countryNameRequired;
    }

    if (!formState.code.trim()) {
      errors.code = translations.validation.countryCodeRequired;
    }

    if (!formState.local_length.trim()) {
      errors.local_length = translations.validation.countryLocalLengthRequired;
    } else if (Number(formState.local_length) < 1) {
      errors.local_length = translations.validation.countryLocalLengthMin;
    }

    if (!formState.pattern) {
      errors.pattern = translations.validation.countryPatternRequired;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = (): CountryPayload => {
    const localLength = Number(formState.local_length);
    const sortOrder = formState.sort_order.trim() ? Number(formState.sort_order) : undefined;

    return {
      name: formState.name.trim(),
      code: formState.code.trim(),
      flag: formState.flag.trim() ? formState.flag.trim() : undefined,
      local_length: isNaN(localLength) ? 0 : localLength,
      pattern: formState.pattern,
      sort_order: sortOrder,
      is_active: formState.is_active,
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload = buildPayload();
      await createCountry(token, payload);
      navigate('/countries');
    } catch (err) {
      setError(err instanceof Error ? err.message : translations.errors.countryCreateFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="country-form-page">
      <div className="page-header">
        <h1>{translations.countries.createTitle}</h1>
        <Button variant="outlined" onClick={() => navigate('/countries')}>
          {translations.countries.backToList}
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form className="country-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-section-title">Asosiy ma'lumotlar</div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="country-name">{translations.countries.name} *</label>
              <input
                id="country-name"
                type="text"
                value={formState.name}
                onChange={(event) => {
                  setFormState({ ...formState, name: event.target.value });
                  if (formErrors.name) {
                    setFormErrors({ ...formErrors, name: undefined });
                  }
                }}
                className={formErrors.name ? 'error' : ''}
                disabled={loading}
                placeholder="O'zbekiston"
              />
              {formErrors.name && <span className="error-text">{formErrors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="country-code">{translations.countries.code} *</label>
              <input
                id="country-code"
                type="text"
                value={formState.code}
                onChange={(event) => {
                  setFormState({ ...formState, code: event.target.value });
                  if (formErrors.code) {
                    setFormErrors({ ...formErrors, code: undefined });
                  }
                }}
                className={formErrors.code ? 'error' : ''}
                disabled={loading}
                placeholder="+998"
              />
              {formErrors.code && <span className="error-text">{formErrors.code}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="country-flag">{translations.countries.flag}</label>
              <input
                id="country-flag"
                type="text"
                value={formState.flag}
                onChange={(event) => setFormState({ ...formState, flag: event.target.value })}
                disabled={loading}
                placeholder="🇺🇿"
                maxLength={8}
              />
              <span className="info-text">Emoji yoki qisqa matn kiriting</span>
            </div>

            <div className="form-group">
              <label htmlFor="country-local-length">{translations.countries.localLength} *</label>
              <input
                id="country-local-length"
                type="number"
                min={1}
                value={formState.local_length}
                onChange={(event) => {
                  setFormState({ ...formState, local_length: event.target.value });
                  if (formErrors.local_length) {
                    setFormErrors({ ...formErrors, local_length: undefined });
                  }
                }}
                className={formErrors.local_length ? 'error' : ''}
                disabled={loading}
                placeholder="9"
              />
              {formErrors.local_length && (
                <span className="error-text">{formErrors.local_length}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="country-pattern">{translations.countries.pattern} *</label>
              <select
                id="country-pattern"
                value={formState.pattern}
                onChange={(event) => {
                  setFormState({
                    ...formState,
                    pattern: event.target.value as CountryPattern,
                  });
                  if (formErrors.pattern) {
                    setFormErrors({ ...formErrors, pattern: undefined });
                  }
                }}
                className={formErrors.pattern ? 'error' : ''}
                disabled={loading}
              >
                {PATTERN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.pattern && <span className="error-text">{formErrors.pattern}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="country-sort-order">{translations.countries.sortOrder}</label>
              <input
                id="country-sort-order"
                type="number"
                value={formState.sort_order}
                onChange={(event) => setFormState({ ...formState, sort_order: event.target.value })}
                disabled={loading}
                placeholder="0"
              />
              <span className="info-text">Ro'yxatda ko'rsatilish tartibi (ixtiyoriy)</span>
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-group">
              <input
                type="checkbox"
                checked={formState.is_active}
                onChange={(event) =>
                  setFormState({ ...formState, is_active: event.target.checked })
                }
                disabled={loading}
              />
              <span>{translations.countries.isActive}</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <Button
            type="button"
            variant="outlined"
            onClick={() => navigate('/countries')}
            disabled={loading}
          >
            {translations.common.cancel}
          </Button>
          <Button type="submit" loading={loading}>
            {translations.countries.createButton}
          </Button>
        </div>
      </form>
    </div>
  );
};


