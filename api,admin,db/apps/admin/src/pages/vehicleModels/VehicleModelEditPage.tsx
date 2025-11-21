import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import {
  getVehicleModelById,
  updateVehicleModel,
  type VehicleModelPayload,
} from '../../api/vehicleModels';
import { getVehicleMakes, type VehicleMake } from '../../api/vehicleMakes';
import { translations } from '../../utils/translations';
import './VehicleModelFormPage.css';

type VehicleModelFormState = {
  vehicle_make_id: string;
  name: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  sort_order: string;
  is_active: boolean;
};

type VehicleModelFormErrors = Partial<Record<keyof Pick<VehicleModelFormState, 'vehicle_make_id' | 'name'>, string>>;

export const VehicleModelEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<VehicleModelFormState | null>(null);
  const [formErrors, setFormErrors] = useState<VehicleModelFormErrors>({});

  useEffect(() => {
    if (token) {
      fetchMakes();
      if (id) {
        loadVehicleModel(id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  const fetchMakes = async () => {
    if (!token) return;

    try {
      const response = await getVehicleMakes(token, true);
      setMakes(response.filter(m => m.is_active));
    } catch (err) {
      console.error('Failed to load makes:', err);
    }
  };

  const loadVehicleModel = async (modelId: string) => {
    if (!token) return;

    try {
      setInitialLoading(true);
      setError(null);
      const model = await getVehicleModelById(token, modelId);
      setFormState({
        vehicle_make_id: model.vehicle_make_id,
        name: model.name,
        name_uz: model.name_uz || '',
        name_ru: model.name_ru || '',
        name_en: model.name_en || '',
        sort_order: model.sort_order?.toString() ?? '',
        is_active: model.is_active,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vehicle model yuklashda xatolik');
    } finally {
      setInitialLoading(false);
    }
  };

  const validate = (): boolean => {
    const errors: VehicleModelFormErrors = {};

    if (!formState) return false;

    if (!formState.vehicle_make_id.trim()) {
      errors.vehicle_make_id = 'Make majburiy';
    }

    if (!formState.name.trim()) {
      errors.name = 'Nomi majburiy';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = (): VehicleModelPayload => {
    if (!formState) {
      throw new Error('Form state is empty');
    }

    const sortOrder = formState.sort_order.trim() ? Number(formState.sort_order) : undefined;

    return {
      vehicle_make_id: formState.vehicle_make_id,
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
      await updateVehicleModel(token, id, payload);
      navigate('/vehicle-models');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vehicle model yangilashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading || !formState) {
    return <div className="loading">{translations.common.loading}</div>;
  }

  return (
    <div className="vehicle-model-form-page">
      <div className="page-header">
        <h1>Vehicle Model Tahrirlash</h1>
        <Button variant="outlined" onClick={() => navigate('/vehicle-models')}>
          Ro'yxatga qaytish
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form className="vehicle-model-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-section-title">Asosiy ma'lumotlar</div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="model-make">Make *</label>
              <select
                id="model-make"
                value={formState.vehicle_make_id}
                onChange={(event) => {
                  setFormState({ ...formState, vehicle_make_id: event.target.value });
                  if (formErrors.vehicle_make_id) {
                    setFormErrors({ ...formErrors, vehicle_make_id: undefined });
                  }
                }}
                className={formErrors.vehicle_make_id ? 'error' : ''}
                disabled={loading}
              >
                <option value="">Make tanlang</option>
                {makes.map((make) => (
                  <option key={make.id} value={make.id}>
                    {make.name}
                  </option>
                ))}
              </select>
              {formErrors.vehicle_make_id && <span className="error-text">{formErrors.vehicle_make_id}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="model-name">Nomi *</label>
              <input
                id="model-name"
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
              <label htmlFor="model-name-uz">Nomi (UZ)</label>
              <input
                id="model-name-uz"
                type="text"
                value={formState.name_uz}
                onChange={(event) => setFormState({ ...formState, name_uz: event.target.value })}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="model-name-ru">Nomi (RU)</label>
              <input
                id="model-name-ru"
                type="text"
                value={formState.name_ru}
                onChange={(event) => setFormState({ ...formState, name_ru: event.target.value })}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="model-name-en">Nomi (EN)</label>
              <input
                id="model-name-en"
                type="text"
                value={formState.name_en}
                onChange={(event) => setFormState({ ...formState, name_en: event.target.value })}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="model-sort-order">Tartib</label>
              <input
                id="model-sort-order"
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
            onClick={() => navigate('/vehicle-models')}
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

