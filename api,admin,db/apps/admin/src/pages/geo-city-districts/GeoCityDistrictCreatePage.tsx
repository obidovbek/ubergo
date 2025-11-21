import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  createGeoCityDistrict,
  getGeoProvinces,
  type GeoProvince,
} from '../../api/geo';
import { translations } from '../../utils/translations';
import {
  GeoCityDistrictForm,
  type GeoCityDistrictFormValues,
} from './GeoCityDistrictForm';
import '../geo-common/GeoEntityStyles.css';

export const GeoCityDistrictCreatePage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [provinces, setProvinces] = useState<GeoProvince[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProvinces = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getGeoProvinces(token, null);
        setProvinces(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : translations.errors.geoProvincesLoadFailed;
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProvinces();
  }, [token]);

  const handleSubmit = async (values: GeoCityDistrictFormValues) => {
    if (!token) return;
    setIsSubmitting(true);
    await createGeoCityDistrict(token, {
      name: values.name,
      province_id: Number(values.provinceId),
      latitude: values.latitude ? Number(values.latitude) : undefined,
      longitude: values.longitude ? Number(values.longitude) : undefined,
    });
    setIsSubmitting(false);
    navigate('/geo/city-districts');
  };

  return (
    <div className="geo-entity-page">
      <div className="page-header">
        <h1>{translations.geo.cityDistricts.createTitle}</h1>
      </div>
      <div className="geo-card">
        {loading ? (
          <div className="geo-loading">{translations.common.loading}</div>
        ) : error ? (
          <div className="geo-error">{error}</div>
        ) : provinces.length === 0 ? (
          <div className="geo-empty">{translations.geo.tables.empty}</div>
        ) : (
          <GeoCityDistrictForm
            provinces={provinces}
            submitLabel={translations.common.save}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/geo/city-districts')}
          />
        )}
      </div>
    </div>
  );
};

export default GeoCityDistrictCreatePage;

