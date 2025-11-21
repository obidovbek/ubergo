import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { createGeoCountry } from '../../api/geo';
import { translations } from '../../utils/translations';
import { GeoCountryForm, type GeoCountryFormValues } from './GeoCountryForm';
import '../geo-common/GeoEntityStyles.css';

export const GeoCountryCreatePage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (values: GeoCountryFormValues) => {
    if (!token) return;
    setIsSubmitting(true);
    await createGeoCountry(token, {
      name: values.name,
      latitude: values.latitude ? Number(values.latitude) : undefined,
      longitude: values.longitude ? Number(values.longitude) : undefined,
    });
    setIsSubmitting(false);
    navigate('/geo/countries');
  };

  return (
    <div className="geo-entity-page">
      <div className="page-header">
        <h1>{translations.geo.countries.createTitle}</h1>
      </div>
      <div className="geo-card">
        <GeoCountryForm
          submitLabel={translations.common.save}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/geo/countries')}
        />
      </div>
    </div>
  );
};

export default GeoCountryCreatePage;

