import { useState } from 'react';
import { Button } from '../../components/Button';
import { translations } from '../../utils/translations';
import '../geo-common/GeoEntityStyles.css';

export interface GeoCountryFormValues {
  name: string;
  latitude: string;
  longitude: string;
}

interface GeoCountryFormProps {
  initialValues?: GeoCountryFormValues;
  onSubmit: (values: GeoCountryFormValues) => Promise<void>;
  submitLabel: string;
  isSubmitting: boolean;
  onCancel?: () => void;
}

const defaultValues: GeoCountryFormValues = {
  name: '',
  latitude: '',
  longitude: '',
};

export const GeoCountryForm = ({
  initialValues = defaultValues,
  onSubmit,
  submitLabel,
  isSubmitting,
  onCancel,
}: GeoCountryFormProps) => {
  const [formValues, setFormValues] = useState<GeoCountryFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof GeoCountryFormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
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
        <span>{translations.geo.countries.name}</span>
        <input
          type="text"
          value={formValues.name}
          onChange={handleChange('name')}
          placeholder="O'zbekiston"
        />
      </label>
      <label>
        <span>{translations.geo.countries.latitude}</span>
        <input
          type="text"
          value={formValues.latitude}
          onChange={handleChange('latitude')}
          placeholder="41.2995"
        />
      </label>
      <label>
        <span>{translations.geo.countries.longitude}</span>
        <input
          type="text"
          value={formValues.longitude}
          onChange={handleChange('longitude')}
          placeholder="69.2401"
        />
      </label>

      <div className="geo-form-actions" style={{ gridColumn: '1 / -1' }}>
        {error && <div className="geo-error">{error}</div>}
        {onCancel && (
          <Button type="button" variant="outlined" onClick={onCancel} disabled={isSubmitting}>
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

export default GeoCountryForm;

