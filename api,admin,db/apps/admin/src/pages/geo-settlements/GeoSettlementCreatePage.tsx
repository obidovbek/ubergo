import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  createGeoSettlement,
  getGeoCityDistricts,
  type GeoCityDistrict,
} from '../../api/geo';
import { translations } from '../../utils/translations';
import {
  GeoSettlementForm,
  type GeoSettlementFormValues,
} from './GeoSettlementForm';
import '../geo-common/GeoEntityStyles.css';

export const GeoSettlementCreatePage = () => {
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
        const data = await getGeoCityDistricts(token, null);
        setCityDistricts(data);
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

  const handleSubmit = async (values: GeoSettlementFormValues) => {
    if (!token) return;
    setIsSubmitting(true);
    await createGeoSettlement(token, {
      name: values.name,
      city_district_id: Number(values.cityDistrictId),
      type: values.type || undefined,
      latitude: values.latitude ? Number(values.latitude) : undefined,
      longitude: values.longitude ? Number(values.longitude) : undefined,
    });
    setIsSubmitting(false);
    navigate('/geo/settlements');
  };

  return (
    <div className="geo-entity-page">
      <div className="page-header">
        <h1>{translations.geo.settlements.createTitle}</h1>
      </div>
      <div className="geo-card">
        {loading ? (
          <div className="geo-loading">{translations.common.loading}</div>
        ) : error ? (
          <div className="geo-error">{error}</div>
        ) : cityDistricts.length === 0 ? (
          <div className="geo-empty">{translations.geo.tables.empty}</div>
        ) : (
          <GeoSettlementForm
            cityDistricts={cityDistricts}
            submitLabel={translations.common.save}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/geo/settlements')}
          />
        )}
      </div>
    </div>
  );
};

export default GeoSettlementCreatePage;

