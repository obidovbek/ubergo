import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { translations } from '../../utils/translations';
import type { GeoCityDistrict } from '../../api/geo';
import '../geo-common/GeoEntityStyles.css';

export interface GeoAdministrativeAreaFormValues {
  name: string;
  cityDistrictId: string;
  latitude: string;
  longitude: string;
}

interface GeoAdministrativeAreaFormProps {
  cityDistricts: GeoCityDistrict[];
  onSubmit: (values: GeoAdministrativeAreaFormValues) => Promise<void>;
  submitLabel: string;
  isSubmitting: boolean;
  onCancel?: () => void;
  initialValues?: GeoAdministrativeAreaFormValues;
}

const defaultValues: GeoAdministrativeAreaFormValues = {
  name: '',
  cityDistrictId: '',
  latitude: '',
  longitude: '',
};

export const GeoAdministrativeAreaForm = ({
  cityDistricts,
  onSubmit,
  submitLabel,
  isSubmitting,
  onCancel,
  initialValues = defaultValues,
}: GeoAdministrativeAreaFormProps) => {
  const [formValues, setFormValues] = useState<GeoAdministrativeAreaFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormValues((prev) => ({
      ...prev,
      cityDistrictId:
        prev.cityDistrictId || (cityDistricts[0]?.id ? String(cityDistricts[0].id) : ''),
    }));
  }, [cityDistricts]);

  const handleChange = (
    field: keyof GeoAdministrativeAreaFormValues
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

    if (!formValues.cityDistrictId) {
      setError(translations.geo.cityDistricts.sectionTitle);
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
        <span>{translations.geo.cityDistricts.sectionTitle}</span>
        <select value={formValues.cityDistrictId} onChange={handleChange('cityDistrictId')}>
          {cityDistricts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{translations.geo.administrativeAreas.name}</span>
        <input
          type="text"
          value={formValues.name}
          onChange={handleChange('name')}
          placeholder="Olmazor MFY"
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

export default GeoAdministrativeAreaForm;

