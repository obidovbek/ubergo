import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import {
  getVehicleTypeById,
  updateVehicleType,
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

export const VehicleTypeEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<VehicleTypeFormState | null>(null);
  const [formErrors, setFormErrors] = useState<VehicleTypeFormErrors>({});

  useEffect(() => {
    if (token && id) {
      loadVehicleType(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  const loadVehicleType = async (typeId: string) => {
    if (!token) return;

    try {
      setInitialLoading(true);
      setError(null);
      const type = await getVehicleTypeById(token, typeId);
      setFormState({
        name: type.name,
        name_uz: type.name_uz || '',
        name_ru: type.name_ru || '',
        name_en: type.name_en || '',
        sort_order: type.sort_order?.toString() ?? '',
        is_active: type.is_active,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vehicle type yuklashda xatolik');
    } finally {
      setInitialLoading(false);
    }
  };

  const validate = (): boolean => {
    const errors: VehicleTypeFormErrors = {};

    if (!formState) return false;

    if (!formState.name.trim()) {
      errors.name = 'Nomi majburiy';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = (): VehicleTypePayload => {
    if (!formState) {
      throw new Error('Form state is empty');
    }

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
    if (!token || !id || !formState) return;

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload = buildPayload();
      await updateVehicleType(token, id, payload);
      navigate('/vehicle-types');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vehicle type yangilashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading || !formState) {
    return <div className="loading">{translations.common.loading}</div>;
  }

  return (
    <div className="vehicle-type-form-page">
      <div className="page-header">
        <h1>Vehicle Type Tahrirlash</h1>
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
              />
              <span className="info-text">Ro'yxat tartibi (ixtiyoriy)</span>
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
            Yangilash
          </Button>
        </div>
      </form>
    </div>
  );
};

