import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getGeoCountries,
  getGeoProvinceById,
  updateGeoProvince,
  type GeoCountry,
  type GeoProvince,
} from '../../api/geo';
import { translations } from '../../utils/translations';
import {
  GeoProvinceForm,
  type GeoProvinceFormValues,
} from './GeoProvinceForm';
import '../geo-common/GeoEntityStyles.css';

export const GeoProvinceEditPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [countries, setCountries] = useState<GeoCountry[]>([]);
  const [province, setProvince] = useState<GeoProvince | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !id) return;
      setLoading(true);
      setError(null);
      try {
        const [countryList, provinceData] = await Promise.all([
          getGeoCountries(token),
          getGeoProvinceById(token, Number(id)),
        ]);
        setCountries(countryList);
        setProvince(provinceData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : translations.errors.geoProvincesLoadFailed;
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, id]);

  const handleSubmit = async (values: GeoProvinceFormValues) => {
    if (!token || !id) return;
    setIsSubmitting(true);
    await updateGeoProvince(token, Number(id), {
      name: values.name,
      country_id: Number(values.countryId),
      latitude: values.latitude ? Number(values.latitude) : undefined,
      longitude: values.longitude ? Number(values.longitude) : undefined,
    });
    setIsSubmitting(false);
    navigate('/geo/provinces');
  };

  const initialValues: GeoProvinceFormValues | undefined = province
    ? {
        name: province.name,
        countryId: String(province.country_id),
        latitude:
          province.latitude !== null && province.latitude !== undefined
            ? String(province.latitude)
            : '',
        longitude:
          province.longitude !== null && province.longitude !== undefined
            ? String(province.longitude)
            : '',
      }
    : undefined;

  return (
    <div className="geo-entity-page">
      <div className="page-header">
        <h1>{translations.geo.provinces.editTitle}</h1>
      </div>
      <div className="geo-card">
        {loading ? (
          <div className="geo-loading">{translations.common.loading}</div>
        ) : error ? (
          <div className="geo-error">{error}</div>
        ) : !province || countries.length === 0 ? (
          <div className="geo-empty">{translations.geo.tables.empty}</div>
        ) : (
          <GeoProvinceForm
            countries={countries}
            initialValues={initialValues}
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

export default GeoProvinceEditPage;

