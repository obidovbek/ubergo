import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { translations } from '../../utils/translations';
import type { GeoCountry } from '../../api/geo';
import '../geo-common/GeoEntityStyles.css';

export interface GeoProvinceFormValues {
  name: string;
  countryId: string;
  latitude: string;
  longitude: string;
}

interface GeoProvinceFormProps {
  countries: GeoCountry[];
  initialValues?: GeoProvinceFormValues;
  onSubmit: (values: GeoProvinceFormValues) => Promise<void>;
  submitLabel: string;
  isSubmitting: boolean;
  onCancel?: () => void;
}

const defaultValues: GeoProvinceFormValues = {
  name: '',
  countryId: '',
  latitude: '',
  longitude: '',
};

export const GeoProvinceForm = ({
  countries,
  initialValues = defaultValues,
  onSubmit,
  submitLabel,
  isSubmitting,
  onCancel,
}: GeoProvinceFormProps) => {
  const [formValues, setFormValues] = useState<GeoProvinceFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormValues((prev) => ({
      ...prev,
      countryId: prev.countryId || (countries[0]?.id ? String(countries[0].id) : ''),
    }));
  }, [countries]);

  const handleChange = (
    field: keyof GeoProvinceFormValues
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

    if (!formValues.countryId) {
      setError(translations.geo.provinces.selectCountry);
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
        <span>{translations.geo.provinces.selectCountry}</span>
        <select value={formValues.countryId} onChange={handleChange('countryId')}>
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{translations.geo.provinces.name}</span>
        <input
          type="text"
          value={formValues.name}
          onChange={handleChange('name')}
          placeholder="Farg'ona viloyati"
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

export default GeoProvinceForm;

