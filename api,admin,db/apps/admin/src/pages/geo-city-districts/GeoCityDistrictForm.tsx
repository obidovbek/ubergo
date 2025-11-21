import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { translations } from '../../utils/translations';
import type { GeoProvince } from '../../api/geo';
import '../geo-common/GeoEntityStyles.css';

export interface GeoCityDistrictFormValues {
  name: string;
  provinceId: string;
  latitude: string;
  longitude: string;
}

interface GeoCityDistrictFormProps {
  provinces: GeoProvince[];
  initialValues?: GeoCityDistrictFormValues;
  onSubmit: (values: GeoCityDistrictFormValues) => Promise<void>;
  submitLabel: string;
  isSubmitting: boolean;
  onCancel?: () => void;
}

const defaultValues: GeoCityDistrictFormValues = {
  name: '',
  provinceId: '',
  latitude: '',
  longitude: '',
};

export const GeoCityDistrictForm = ({
  provinces,
  initialValues = defaultValues,
  onSubmit,
  submitLabel,
  isSubmitting,
  onCancel,
}: GeoCityDistrictFormProps) => {
  const [formValues, setFormValues] = useState<GeoCityDistrictFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormValues((prev) => ({
      ...prev,
      provinceId: prev.provinceId || (provinces[0]?.id ? String(provinces[0].id) : ''),
    }));
  }, [provinces]);

  const handleChange = (
    field: keyof GeoCityDistrictFormValues
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target.value;
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!formValues.name.trim()) {
      setError(translations.validation.countryNameRequired);
      return;
    }

    if (!formValues.provinceId) {
      setError(translations.geo.cityDistricts.selectProvince);
      return;
    }

    try {
      await onSubmit({
        ...formValues,
        name: formValues.name.trim(),
        latitude: formValues.latitude.trim(),
        longitude: formValues.longitude.trim(),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : translations.errors.geoCreateFailed;
      setError(message);
    }
  };

  return (
    <form className="geo-form" onSubmit={handleSubmit}>
      <label>
        <span>{translations.geo.cityDistricts.selectProvince}</span>
        <select value={formValues.provinceId} onChange={handleChange('provinceId')}>
          {provinces.map((province) => (
            <option key={province.id} value={province.id}>
              {province.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{translations.geo.cityDistricts.name}</span>
        <input
          type="text"
          value={formValues.name}
          onChange={handleChange('name')}
          placeholder="Andijon shahri"
        />
      </label>
      <label>
        <span>{translations.geo.countries.latitude}</span>
        <input
          type="text"
          value={formValues.latitude}
          onChange={handleChange('latitude')}
        />
      </label>
      <label>
        <span>{translations.geo.countries.longitude}</span>
        <input
          type="text"
          value={formValues.longitude}
          onChange={handleChange('longitude')}
        />
      </label>

      <div className="geo-form-actions" style={{ gridColumn: '1 / -1' }}>
        {error && <div className="geo-error">{error}</div>}
        {onCancel && (
          <Button
            type="button"
            variant="outlined"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {translations.common.cancel}
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default GeoCityDistrictForm;

