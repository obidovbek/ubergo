import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  createGeoNeighborhood,
  getGeoCityDistricts,
  type GeoCityDistrict,
} from '../../api/geo';
import { translations } from '../../utils/translations';
import {
  GeoNeighborhoodForm,
  type GeoNeighborhoodFormValues,
} from './GeoNeighborhoodForm';
import '../geo-common/GeoEntityStyles.css';

export const GeoNeighborhoodCreatePage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [cityDistricts, setCityDistricts] = useState<GeoCityDistrict[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const response = await getGeoCityDistricts(token, null, 1, 1000); // Get all districts for dropdown
        setCityDistricts(response.data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : translations.errors.geoDistrictsLoadFailed;
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchDistricts();
  }, [token]);

  const handleSubmit = async (values: GeoNeighborhoodFormValues) => {
    if (!token) return;
    setIsSubmitting(true);
    await createGeoNeighborhood(token, {
      name: values.name,
      city_district_id: Number(values.cityDistrictId),
      latitude: values.latitude ? Number(values.latitude) : undefined,
      longitude: values.longitude ? Number(values.longitude) : undefined,
    });
    setIsSubmitting(false);
    navigate('/geo/neighborhoods');
  };

  return (
    <div className="geo-entity-page">
      <div className="page-header">
        <h1>{translations.geo.neighborhoods.createTitle}</h1>
      </div>
      <div className="geo-card">
        {loading ? (
          <div className="geo-loading">{translations.common.loading}</div>
        ) : error ? (
          <div className="geo-error">{error}</div>
        ) : cityDistricts.length === 0 ? (
          <div className="geo-empty">{translations.geo.tables.empty}</div>
        ) : (
          <GeoNeighborhoodForm
            cityDistricts={cityDistricts}
            submitLabel={translations.common.save}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/geo/neighborhoods')}
          />
        )}
      </div>
    </div>
  );
};

export default GeoNeighborhoodCreatePage;

