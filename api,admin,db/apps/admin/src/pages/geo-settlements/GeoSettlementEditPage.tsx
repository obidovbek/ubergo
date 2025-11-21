import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getGeoCityDistricts,
  getGeoSettlements,
  updateGeoSettlement,
  type GeoCityDistrict,
  type GeoSettlement,
} from '../../api/geo';
import { translations } from '../../utils/translations';
import {
  GeoSettlementForm,
  type GeoSettlementFormValues,
} from './GeoSettlementForm';
import '../geo-common/GeoEntityStyles.css';

export const GeoSettlementEditPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [cityDistricts, setCityDistricts] = useState<GeoCityDistrict[]>([]);
  const [settlement, setSettlement] = useState<GeoSettlement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !id) return;
      setLoading(true);
      setError(null);
      try {
        const [districtList, settlementList] = await Promise.all([
          getGeoCityDistricts(token, null, 1, 1000), // Get all districts for dropdown
          getGeoSettlements(token, null, 1, 1000), // Get all settlements to find the one we need
        ]);
        setCityDistricts(districtList.data);
        const found = settlementList.data.find((item: GeoSettlement) => item.id === Number(id)) || null;
        setSettlement(found);
        if (!found) {
          setError(translations.errors.geoSettlementsLoadFailed);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : translations.errors.geoSettlementsLoadFailed;
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, id]);

  const handleSubmit = async (values: GeoSettlementFormValues) => {
    if (!token || !id) return;
    setIsSubmitting(true);
    await updateGeoSettlement(token, Number(id), {
      name: values.name,
      city_district_id: Number(values.cityDistrictId),
      type: values.type || undefined,
      latitude: values.latitude ? Number(values.latitude) : undefined,
      longitude: values.longitude ? Number(values.longitude) : undefined,
    });
    setIsSubmitting(false);
    navigate('/geo/settlements');
  };

  const initialValues: GeoSettlementFormValues | undefined = settlement
    ? {
        name: settlement.name,
        cityDistrictId: String(settlement.city_district_id),
        type: settlement.type ?? '',
        latitude:
          settlement.latitude !== null && settlement.latitude !== undefined
            ? String(settlement.latitude)
            : '',
        longitude:
          settlement.longitude !== null && settlement.longitude !== undefined
            ? String(settlement.longitude)
            : '',
      }
    : undefined;

  return (
    <div className="geo-entity-page">
      <div className="page-header">
        <h1>{translations.geo.settlements.editTitle}</h1>
      </div>
      <div className="geo-card">
        {loading ? (
          <div className="geo-loading">{translations.common.loading}</div>
        ) : error ? (
          <div className="geo-error">{error}</div>
        ) : !settlement || cityDistricts.length === 0 ? (
          <div className="geo-empty">{translations.geo.tables.empty}</div>
        ) : (
          <GeoSettlementForm
            cityDistricts={cityDistricts}
            initialValues={initialValues}
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

export default GeoSettlementEditPage;

