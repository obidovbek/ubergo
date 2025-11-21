import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import {
  getVehicleColorById,
  updateVehicleColor,
  type VehicleColorPayload,
} from '../../api/vehicleColors';
import { translations } from '../../utils/translations';
import './VehicleColorFormPage.css';

type VehicleColorFormState = {
  name: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  hex_code: string;
  sort_order: string;
  is_active: boolean;
};

type VehicleColorFormErrors = Partial<Record<keyof Pick<VehicleColorFormState, 'name'>, string>>;

export const VehicleColorEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<VehicleColorFormState | null>(null);
  const [formErrors, setFormErrors] = useState<VehicleColorFormErrors>({});

  useEffect(() => {
    if (token && id) {
      loadVehicleColor(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  const loadVehicleColor = async (colorId: string) => {
    if (!token) return;

    try {
      setInitialLoading(true);
      setError(null);
      const color = await getVehicleColorById(token, colorId);
      setFormState({
        name: color.name,
        name_uz: color.name_uz || '',
        name_ru: color.name_ru || '',
        name_en: color.name_en || '',
        hex_code: color.hex_code || '',
        sort_order: color.sort_order?.toString() ?? '',
        is_active: color.is_active,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vehicle color yuklashda xatolik');
    } finally {
      setInitialLoading(false);
    }
  };

  const validate = (): boolean => {
    const errors: VehicleColorFormErrors = {};

    if (!formState) return false;

    if (!formState.name.trim()) {
      errors.name = 'Nomi majburiy';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = (): VehicleColorPayload => {
    if (!formState) {
      throw new Error('Form state is empty');
    }

    const sortOrder = formState.sort_order.trim() ? Number(formState.sort_order) : undefined;

    return {
      name: formState.name.trim(),
      name_uz: formState.name_uz.trim() || undefined,
      name_ru: formState.name_ru.trim() || undefined,
      name_en: formState.name_en.trim() || undefined,
      hex_code: formState.hex_code.trim() || undefined,
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
      await updateVehicleColor(token, id, payload);
      navigate('/vehicle-colors');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vehicle color yangilashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading || !formState) {
    return <div className="loading">{translations.common.loading}</div>;
  }

  return (
    <div className="vehicle-color-form-page">
      <div className="page-header">
        <h1>Vehicle Color Tahrirlash</h1>
        <Button variant="outlined" onClick={() => navigate('/vehicle-colors')}>
          Ro'yxatga qaytish
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form className="vehicle-color-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-section-title">Asosiy ma'lumotlar</div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="color-name">Nomi *</label>
              <input
                id="color-name"
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
              <label htmlFor="color-name-uz">Nomi (UZ)</label>
              <input
                id="color-name-uz"
                type="text"
                value={formState.name_uz}
                onChange={(event) => setFormState({ ...formState, name_uz: event.target.value })}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="color-name-ru">Nomi (RU)</label>
              <input
                id="color-name-ru"
                type="text"
                value={formState.name_ru}
                onChange={(event) => setFormState({ ...formState, name_ru: event.target.value })}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="color-name-en">Nomi (EN)</label>
              <input
                id="color-name-en"
                type="text"
                value={formState.name_en}
                onChange={(event) => setFormState({ ...formState, name_en: event.target.value })}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="color-hex-code">Hex Code</label>
              <div className="hex-input-group">
                <input
                  id="color-hex-code"
                  type="text"
                  value={formState.hex_code}
                  onChange={(event) => setFormState({ ...formState, hex_code: event.target.value })}
                  disabled={loading}
                  placeholder="#FFFFFF"
                  maxLength={7}
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
                {formState.hex_code && /^#[0-9A-Fa-f]{6}$/.test(formState.hex_code) && (
                  <span
                    className="color-preview-swatch"
                    style={{ backgroundColor: formState.hex_code }}
                  />
                )}
              </div>
              <span className="info-text">Rang hex kodi (#RRGGBB formatida, ixtiyoriy)</span>
            </div>

            <div className="form-group">
              <label htmlFor="color-sort-order">Tartib</label>
              <input
                id="color-sort-order"
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
            onClick={() => navigate('/vehicle-colors')}
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

