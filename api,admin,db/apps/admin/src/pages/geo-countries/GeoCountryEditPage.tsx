import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getGeoCountryById,
  updateGeoCountry,
  type GeoCountry,
} from '../../api/geo';
import { translations } from '../../utils/translations';
import { GeoCountryForm, type GeoCountryFormValues } from './GeoCountryForm';
import '../geo-common/GeoEntityStyles.css';

export const GeoCountryEditPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [country, setCountry] = useState<GeoCountry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountry = async () => {
      if (!token || !id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getGeoCountryById(token, Number(id));
        setCountry(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : translations.errors.geoCountriesLoadFailed;
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchCountry();
  }, [token, id]);

  const handleSubmit = async (values: GeoCountryFormValues) => {
    if (!token || !id) return;
    setIsSubmitting(true);
    await updateGeoCountry(token, Number(id), {
      name: values.name,
      latitude: values.latitude ? Number(values.latitude) : undefined,
      longitude: values.longitude ? Number(values.longitude) : undefined,
    });
    setIsSubmitting(false);
    navigate('/geo/countries');
  };

  const initialValues: GeoCountryFormValues | undefined = country
    ? {
        name: country.name,
        latitude: country.latitude !== null && country.latitude !== undefined ? String(country.latitude) : '',
        longitude:
          country.longitude !== null && country.longitude !== undefined
            ? String(country.longitude)
            : '',
      }
    : undefined;

  return (
    <div className="geo-entity-page">
      <div className="page-header">
        <h1>{translations.geo.countries.editTitle}</h1>
      </div>

      <div className="geo-card">
        {loading ? (
          <div className="geo-loading">{translations.common.loading}</div>
        ) : error ? (
          <div className="geo-error">{error}</div>
        ) : country ? (
          <GeoCountryForm
            initialValues={initialValues}
            submitLabel={translations.common.save}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/geo/countries')}
          />
        ) : (
          <div className="geo-empty">{translations.errors.geoCountriesLoadFailed}</div>
        )}
      </div>
    </div>
  );
};

export default GeoCountryEditPage;

