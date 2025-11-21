import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import {
  createVehicleBodyType,
  type VehicleBodyTypePayload,
} from '../../api/vehicleBodyTypes';
import { translations } from '../../utils/translations';
import './VehicleBodyTypeFormPage.css';

type VehicleBodyTypeFormState = {
  name: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  sort_order: string;
  is_active: boolean;
};

type VehicleBodyTypeFormErrors = Partial<Record<keyof Pick<VehicleBodyTypeFormState, 'name'>, string>>;

export const VehicleBodyTypeCreatePage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<VehicleBodyTypeFormState>({
    name: '',
    name_uz: '',
    name_ru: '',
    name_en: '',
    sort_order: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<VehicleBodyTypeFormErrors>({});

  const validate = (): boolean => {
    const errors: VehicleBodyTypeFormErrors = {};

    if (!formState.name.trim()) {
      errors.name = 'Nomi majburiy';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = (): VehicleBodyTypePayload => {
    const sortOrder = formState.sort_order.trim() ? Number(formState.sort_order) : undefined;

    return {
      name: formState.name.trim(),
      name_uz: formState.name_uz.trim() || undefined,
      name_ru: formState.name_ru.trim() || undefined,
      name_en: formState.name_en.trim() || undefined,
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
      await createVehicleBodyType(token, payload);
      navigate('/vehicle-body-types');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vehicle body type yaratishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vehicle-body-type-form-page">
      <div className="page-header">
        <h1>Vehicle Body Type Qo'shish</h1>
        <Button variant="outlined" onClick={() => navigate('/vehicle-body-types')}>
          Ro'yxatga qaytish
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form className="vehicle-body-type-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-section-title">Asosiy ma'lumotlar</div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="body-type-name">Nomi *</label>
              <input
                id="body-type-name"
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
                placeholder="Sedan"
              />
              {formErrors.name && <span className="error-text">{formErrors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="body-type-name-uz">Nomi (UZ)</label>
              <input
                id="body-type-name-uz"
                type="text"
                value={formState.name_uz}
                onChange={(event) => setFormState({ ...formState, name_uz: event.target.value })}
                disabled={loading}
                placeholder="Sedan"
              />
            </div>

            <div className="form-group">
              <label htmlFor="body-type-name-ru">Nomi (RU)</label>
              <input
                id="body-type-name-ru"
                type="text"
                value={formState.name_ru}
                onChange={(event) => setFormState({ ...formState, name_ru: event.target.value })}
                disabled={loading}
                placeholder="Седан"
              />
            </div>

            <div className="form-group">
              <label htmlFor="body-type-name-en">Nomi (EN)</label>
              <input
                id="body-type-name-en"
                type="text"
                value={formState.name_en}
                onChange={(event) => setFormState({ ...formState, name_en: event.target.value })}
                disabled={loading}
                placeholder="Sedan"
              />
            </div>

            <div className="form-group">
              <label htmlFor="body-type-sort-order">Tartib</label>
              <input
                id="body-type-sort-order"
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
              <span>Faol</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <Button
            type="button"
            variant="outlined"
            onClick={() => navigate('/vehicle-body-types')}
            disabled={loading}
          >
            {translations.common.cancel}
          </Button>
          <Button type="submit" loading={loading}>
            Qo'shish
          </Button>
        </div>
      </form>
    </div>
  );
};

