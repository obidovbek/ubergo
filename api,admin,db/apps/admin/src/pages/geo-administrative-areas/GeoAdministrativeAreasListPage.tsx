import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ExcelUploadButton } from '../../components/ExcelUploadButton';
import { useAuth } from '../../hooks/useAuth';
import {
  deleteGeoAdministrativeArea,
  getGeoAdministrativeAreas,
  getGeoCityDistricts,
  getGeoCountries,
  getGeoProvinces,
  bulkUploadGeoAdministrativeAreas,
  type GeoAdministrativeArea,
  type GeoCityDistrict,
  type GeoCountry,
  type GeoProvince,
} from '../../api/geo';
import { translations } from '../../utils/translations';
import { downloadExcelTemplate } from '../../utils/excelUpload';
import '../geo-common/GeoEntityStyles.css';

export const GeoAdministrativeAreasListPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [countries, setCountries] = useState<GeoCountry[]>([]);
  const [provinces, setProvinces] = useState<GeoProvince[]>([]);
  const [cityDistricts, setCityDistricts] = useState<GeoCityDistrict[]>([]);
  const [areas, setAreas] = useState<GeoAdministrativeArea[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [countryList, provinceList, districtList, areaList] = await Promise.all([
        getGeoCountries(token, 1, 1000),
        getGeoProvinces(token, null, 1, 1000),
        getGeoCityDistricts(token, null, 1, 1000),
        getGeoAdministrativeAreas(token, null, page, pageSize),
      ]);

      setCountries(countryList.data);
      setProvinces(provinceList.data);
      setCityDistricts(districtList.data);
      setAreas(areaList.data);
      setTotal(areaList.total);
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

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page]);

  const handleDelete = async (area: GeoAdministrativeArea) => {
    if (!token) return;
    const confirmed = confirm(
      `${translations.common.delete}? ${area.name}`
    );
    if (!confirmed) return;

    try {
      await deleteGeoAdministrativeArea(token, area.id);
      fetchData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : translations.errors.geoDeleteFailed;
      alert(message);
    }
  };

  const cityDistrictMap = useMemo(() => {
    const map = new Map<number, GeoCityDistrict>();
    cityDistricts.forEach((district) => map.set(district.id, district));
    return map;
  }, [cityDistricts]);

  const provinceMap = useMemo(() => {
    const map = new Map<number, GeoProvince>();
    provinces.forEach((province) => map.set(province.id, province));
    return map;
  }, [provinces]);

  const countryMap = useMemo(() => {
    const map = new Map<number, GeoCountry>();
    countries.forEach((country) => map.set(country.id, country));
    return map;
  }, [countries]);

  const provinceName = (districtId: number) => {
    const district = cityDistrictMap.get(districtId);
    if (!district) return '—';
    return provinceMap.get(district.province_id)?.name ?? '—';
  };

  const countryName = (districtId: number) => {
    const district = cityDistrictMap.get(districtId);
    if (!district) return '—';
    const province = provinceMap.get(district.province_id);
    if (!province) return '—';
    return countryMap.get(province.country_id)?.name ?? '—';
  };

  const cityDistrictName = (districtId: number) =>
    cityDistrictMap.get(districtId)?.name ?? '—';

  const handleBulkUpload = async (data: any[]) => {
    if (!token) throw new Error('Not authenticated');
    
    const result = await bulkUploadGeoAdministrativeAreas(token, data);
    
    // Refresh the list after upload
    await fetchData();
    
    return result;
  };

  const handleDownloadTemplate = () => {
    downloadExcelTemplate(
      'geo_administrative_areas_template.xlsx',
      ['name', 'city_district_name', 'province_name', 'country_name', 'latitude', 'longitude'],
      [
        ['Chilanzar', 'Tashkent City', 'Tashkent', 'Uzbekistan', '41.275200', '69.203100'],
        ['Yunusabad', 'Tashkent City', 'Tashkent', 'Uzbekistan', '41.333300', '69.288900'],
        ['Mirzo-Ulugbek', 'Tashkent City', 'Tashkent', 'Uzbekistan', '41.344400', '69.334400'],
      ]
    );
  };

  return (
    <div className="geo-entity-page">
      <div className="page-header">
        <div>
          <h1>{translations.geo.administrativeAreas.list}</h1>
          <p className="page-description">{translations.geo.description}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleDownloadTemplate}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            📥 Download Template
          </button>
          <ExcelUploadButton
            onUpload={handleBulkUpload}
            requiredColumns={['name', 'city_district_name']}
            buttonText="📤 Upload Excel"
            disabled={loading}
          />
          <Button onClick={() => navigate('/geo/administrative-areas/create')}>
            {translations.geo.administrativeAreas.create}
          </Button>
        </div>
      </div>

      <div className="geo-card geo-table-card">
        <header>
          <h2>{translations.geo.administrativeAreas.sectionTitle}</h2>
        </header>

        {error && <div className="geo-error">{error}</div>}

        <div className="geo-table-wrapper">
          {loading ? (
            <div className="geo-loading">{translations.common.loading}</div>
          ) : areas.length === 0 ? (
            <div className="geo-empty">{translations.geo.tables.empty}</div>
          ) : (
            <table className="geo-table">
              <thead>
                <tr>
                  <th>{translations.geo.tables.name}</th>
                  <th>{translations.geo.cityDistricts.sectionTitle}</th>
                  <th>{translations.geo.provinces.sectionTitle}</th>
                  <th>{translations.geo.countries.sectionTitle}</th>
                  <th>{translations.geo.tables.latitude}</th>
                  <th>{translations.geo.tables.longitude}</th>
                  <th>{translations.geo.tables.actions}</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((area) => (
                  <tr key={area.id}>
                    <td>{area.name}</td>
                    <td>{cityDistrictName(area.city_district_id)}</td>
                    <td>{provinceName(area.city_district_id)}</td>
                    <td>{countryName(area.city_district_id)}</td>
                    <td>{area.latitude ?? '—'}</td>
                    <td>{area.longitude ?? '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() =>
                            navigate(`/geo/administrative-areas/${area.id}/edit`)
                          }
                        >
                          {translations.common.edit}
                        </Button>
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => handleDelete(area)}
                        >
                          {translations.common.delete}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {total > pageSize && (
          <div className="geo-pagination" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
            <Button
              variant="outlined"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              {translations.common.previous || 'Previous'}
            </Button>
            <span style={{ fontSize: '14px' }}>
              {translations.common.page || 'Page'} {page} {translations.common.of || 'of'} {Math.ceil(total / pageSize)}
            </span>
            <Button
              variant="outlined"
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() => setPage(page + 1)}
            >
              {translations.common.next || 'Next'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeoAdministrativeAreasListPage;

