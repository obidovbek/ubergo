import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getGeoCityDistricts,
  getGeoNeighborhoods,
  updateGeoNeighborhood,
  type GeoCityDistrict,
  type GeoNeighborhood,
} from '../../api/geo';
import { translations } from '../../utils/translations';
import {
  GeoNeighborhoodForm,
  type GeoNeighborhoodFormValues,
} from './GeoNeighborhoodForm';
import '../geo-common/GeoEntityStyles.css';

export const GeoNeighborhoodEditPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [cityDistricts, setCityDistricts] = useState<GeoCityDistrict[]>([]);
  const [neighborhood, setNeighborhood] = useState<GeoNeighborhood | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !id) return;
      setLoading(true);
      setError(null);
      try {
        const [districtList, neighborhoodList] = await Promise.all([
          getGeoCityDistricts(token, null, 1, 1000), // Get all districts for dropdown
          getGeoNeighborhoods(token, null, 1, 1000), // Get all neighborhoods to find the one we need
        ]);
        setCityDistricts(districtList.data);
        const found = neighborhoodList.data.find((item: GeoNeighborhood) => item.id === Number(id)) || null;
        setNeighborhood(found);
        if (!found) {
          setError(translations.errors.geoNeighborhoodsLoadFailed);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : translations.errors.geoNeighborhoodsLoadFailed;
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, id]);

  const handleSubmit = async (values: GeoNeighborhoodFormValues) => {
    if (!token || !id) return;
    setIsSubmitting(true);
    await updateGeoNeighborhood(token, Number(id), {
      name: values.name,
      city_district_id: Number(values.cityDistrictId),
      latitude: values.latitude ? Number(values.latitude) : undefined,
      longitude: values.longitude ? Number(values.longitude) : undefined,
    });
    setIsSubmitting(false);
    navigate('/geo/neighborhoods');
  };

  const initialValues: GeoNeighborhoodFormValues | undefined = neighborhood
    ? {
        name: neighborhood.name,
        cityDistrictId: String(neighborhood.city_district_id),
        latitude:
          neighborhood.latitude !== null && neighborhood.latitude !== undefined
            ? String(neighborhood.latitude)
            : '',
        longitude:
          neighborhood.longitude !== null && neighborhood.longitude !== undefined
            ? String(neighborhood.longitude)
            : '',
      }
    : undefined;

  return (
    <div className="geo-entity-page">
      <div className="page-header">
        <h1>{translations.geo.neighborhoods.editTitle}</h1>
      </div>
      <div className="geo-card">
        {loading ? (
          <div className="geo-loading">{translations.common.loading}</div>
        ) : error ? (
          <div className="geo-error">{error}</div>
        ) : !neighborhood || cityDistricts.length === 0 ? (
          <div className="geo-empty">{translations.geo.tables.empty}</div>
        ) : (
          <GeoNeighborhoodForm
            cityDistricts={cityDistricts}
            initialValues={initialValues}
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

export default GeoNeighborhoodEditPage;

