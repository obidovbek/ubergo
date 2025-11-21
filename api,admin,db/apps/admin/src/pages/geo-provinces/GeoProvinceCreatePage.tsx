import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  createGeoProvince,
  getGeoCountries,
  type GeoCountry,
} from '../../api/geo';
import { translations } from '../../utils/translations';
import {
  GeoProvinceForm,
  type GeoProvinceFormValues,
} from './GeoProvinceForm';
import '../geo-common/GeoEntityStyles.css';

export const GeoProvinceCreatePage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [countries, setCountries] = useState<GeoCountry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getGeoCountries(token);
        setCountries(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : translations.errors.geoCountriesLoadFailed;
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, [token]);

  const handleSubmit = async (values: GeoProvinceFormValues) => {
    if (!token) return;
    setIsSubmitting(true);
    await createGeoProvince(token, {
      name: values.name,
      country_id: Number(values.countryId),
      latitude: values.latitude ? Number(values.latitude) : undefined,
      longitude: values.longitude ? Number(values.longitude) : undefined,
    });
    setIsSubmitting(false);
    navigate('/geo/provinces');
  };

  return (
    <div className="geo-entity-page">
      <div className="page-header">
        <h1>{translations.geo.provinces.createTitle}</h1>
      </div>
      <div className="geo-card">
        {loading ? (
          <div className="geo-loading">{translations.common.loading}</div>
        ) : error ? (
          <div className="geo-error">{error}</div>
        ) : countries.length === 0 ? (
          <div className="geo-empty">{translations.geo.tables.empty}</div>
        ) : (
          <GeoProvinceForm
            countries={countries}
            submitLabel={translations.common.save}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/geo/provinces')}
          />
        )}
      </div>
    </div>
  );
};

export default GeoProvinceCreatePage;

