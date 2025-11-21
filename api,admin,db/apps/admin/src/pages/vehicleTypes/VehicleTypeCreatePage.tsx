import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import {
  createVehicleType,
  type VehicleTypePayload,
} from '../../api/vehicleTypes';
import { translations } from '../../utils/translations';
import './VehicleTypeFormPage.css';

type VehicleTypeFormState = {
  name: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  sort_order: string;
  is_active: boolean;
};

type VehicleTypeFormErrors = Partial<Record<keyof Pick<VehicleTypeFormState, 'name'>, string>>;

export const VehicleTypeCreatePage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<VehicleTypeFormState>({
    name: '',
    name_uz: '',
    name_ru: '',
    name_en: '',
    sort_order: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<VehicleTypeFormErrors>({});

  const validate = (): boolean => {
    const errors: VehicleTypeFormErrors = {};

    if (!formState.name.trim()) {
      errors.name = 'Nomi majburiy';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = (): VehicleTypePayload => {
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
      await createVehicleType(token, payload);
      navigate('/vehicle-types');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vehicle type yaratishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vehicle-type-form-page">
      <div className="page-header">
        <h1>Vehicle Type Qo'shish</h1>
        <Button variant="outlined" onClick={() => navigate('/vehicle-types')}>
          Ro'yxatga qaytish
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form className="vehicle-type-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-section-title">Asosiy ma'lumotlar</div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="type-name">Nomi *</label>
              <input
                id="type-name"
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
                placeholder="light"
              />
              {formErrors.name && <span className="error-text">{formErrors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="type-name-uz">Nomi (UZ)</label>
              <input
                id="type-name-uz"
                type="text"
                value={formState.name_uz}
                onChange={(event) => setFormState({ ...formState, name_uz: event.target.value })}
                disabled={loading}
                placeholder="Yengil"
              />
            </div>

            <div className="form-group">
              <label htmlFor="type-name-ru">Nomi (RU)</label>
              <input
                id="type-name-ru"
                type="text"
                value={formState.name_ru}
                onChange={(event) => setFormState({ ...formState, name_ru: event.target.value })}
                disabled={loading}
                placeholder="Легковой"
              />
            </div>

            <div className="form-group">
              <label htmlFor="type-name-en">Nomi (EN)</label>
              <input
                id="type-name-en"
                type="text"
                value={formState.name_en}
                onChange={(event) => setFormState({ ...formState, name_en: event.target.value })}
                disabled={loading}
                placeholder="Light"
              />
            </div>

            <div className="form-group">
              <label htmlFor="type-sort-order">Tartib</label>
              <input
                id="type-sort-order"
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
            onClick={() => navigate('/vehicle-types')}
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

