import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getGeoAdministrativeAreas,
  getGeoCityDistricts,
  updateGeoAdministrativeArea,
  type GeoAdministrativeArea,
  type GeoCityDistrict,
} from '../../api/geo';
import { translations } from '../../utils/translations';
import {
  GeoAdministrativeAreaForm,
  type GeoAdministrativeAreaFormValues,
} from './GeoAdministrativeAreaForm';
import '../geo-common/GeoEntityStyles.css';

export const GeoAdministrativeAreaEditPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [cityDistricts, setCityDistricts] = useState<GeoCityDistrict[]>([]);
  const [area, setArea] = useState<GeoAdministrativeArea | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !id) return;
      setLoading(true);
      setError(null);
      try {
        const [districtList, areaList] = await Promise.all([
          getGeoCityDistricts(token, null, 1, 1000), // Get all districts for dropdown
          getGeoAdministrativeAreas(token, null, 1, 1000), // Get all areas to find the one we need
        ]);
        setCityDistricts(districtList.data);
        const found = areaList.data.find((item: GeoAdministrativeArea) => item.id === Number(id)) || null;
        setArea(found);
        if (!found) {
          setError(translations.errors.geoAdministrativeAreasLoadFailed);
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : translations.errors.geoAdministrativeAreasLoadFailed;
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, id]);

  const handleSubmit = async (values: GeoAdministrativeAreaFormValues) => {
    if (!token || !id) return;
    setIsSubmitting(true);
    await updateGeoAdministrativeArea(token, Number(id), {
      name: values.name,
      city_district_id: Number(values.cityDistrictId),
      latitude: values.latitude ? Number(values.latitude) : undefined,
      longitude: values.longitude ? Number(values.longitude) : undefined,
    });
    setIsSubmitting(false);
    navigate('/geo/administrative-areas');
  };

  const initialValues: GeoAdministrativeAreaFormValues | undefined = area
    ? {
        name: area.name,
        cityDistrictId: String(area.city_district_id),
        latitude:
          area.latitude !== null && area.latitude !== undefined ? String(area.latitude) : '',
        longitude:
          area.longitude !== null && area.longitude !== undefined
            ? String(area.longitude)
            : '',
      }
    : undefined;

  return (
    <div className="geo-entity-page">
      <div className="page-header">
        <h1>{translations.geo.administrativeAreas.editTitle}</h1>
      </div>
      <div className="geo-card">
        {loading ? (
          <div className="geo-loading">{translations.common.loading}</div>
        ) : error ? (
          <div className="geo-error">{error}</div>
        ) : !area || cityDistricts.length === 0 ? (
          <div className="geo-empty">{translations.geo.tables.empty}</div>
        ) : (
          <GeoAdministrativeAreaForm
            cityDistricts={cityDistricts}
            initialValues={initialValues}
            submitLabel={translations.common.save}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/geo/administrative-areas')}
          />
        )}
      </div>
    </div>
  );
};

export default GeoAdministrativeAreaEditPage;

