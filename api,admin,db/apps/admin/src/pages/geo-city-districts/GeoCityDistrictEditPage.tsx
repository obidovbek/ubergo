import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getGeoCityDistricts,
  getGeoProvinces,
  updateGeoCityDistrict,
  type GeoCityDistrict,
  type GeoProvince,
} from '../../api/geo';
import { translations } from '../../utils/translations';
import {
  GeoCityDistrictForm,
  type GeoCityDistrictFormValues,
} from './GeoCityDistrictForm';
import '../geo-common/GeoEntityStyles.css';

export const GeoCityDistrictEditPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [provinces, setProvinces] = useState<GeoProvince[]>([]);
  const [district, setDistrict] = useState<GeoCityDistrict | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !id) return;
      setLoading(true);
      setError(null);
      try {
        const [provinceList, districtList] = await Promise.all([
          getGeoProvinces(token, null),
          getGeoCityDistricts(token, null),
        ]);
        setProvinces(provinceList);
        const found = districtList.find((item) => item.id === Number(id)) || null;
        setDistrict(found);
        if (!found) {
          setError(translations.errors.geoDistrictsLoadFailed);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : translations.errors.geoDistrictsLoadFailed;
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, id]);

  const handleSubmit = async (values: GeoCityDistrictFormValues) => {
    if (!token || !id) return;
    setIsSubmitting(true);
    await updateGeoCityDistrict(token, Number(id), {
      name: values.name,
      province_id: Number(values.provinceId),
      latitude: values.latitude ? Number(values.latitude) : undefined,
      longitude: values.longitude ? Number(values.longitude) : undefined,
    });
    setIsSubmitting(false);
    navigate('/geo/city-districts');
  };

  const initialValues: GeoCityDistrictFormValues | undefined = district
    ? {
        name: district.name,
        provinceId: String(district.province_id),
        latitude:
          district.latitude !== null && district.latitude !== undefined
            ? String(district.latitude)
            : '',
        longitude:
          district.longitude !== null && district.longitude !== undefined
            ? String(district.longitude)
            : '',
      }
    : undefined;

  return (
    <div className="geo-entity-page">
      <div className="page-header">
        <h1>{translations.geo.cityDistricts.editTitle}</h1>
      </div>
      <div className="geo-card">
        {loading ? (
          <div className="geo-loading">{translations.common.loading}</div>
        ) : error ? (
          <div className="geo-error">{error}</div>
        ) : !district || provinces.length === 0 ? (
          <div className="geo-empty">{translations.geo.tables.empty}</div>
        ) : (
          <GeoCityDistrictForm
            provinces={provinces}
            initialValues={initialValues}
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

export default GeoCityDistrictEditPage;

