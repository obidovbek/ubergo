import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ExcelUploadButton } from '../../components/ExcelUploadButton';
import { useAuth } from '../../hooks/useAuth';
import {
  deleteGeoProvince,
  getGeoCountries,
  getGeoProvinces,
  bulkUploadGeoProvinces,
  type GeoCountry,
  type GeoProvince,
} from '../../api/geo';
import { translations } from '../../utils/translations';
import { downloadExcelTemplate } from '../../utils/excelUpload';
import '../geo-common/GeoEntityStyles.css';

export const GeoProvincesListPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [countries, setCountries] = useState<GeoCountry[]>([]);
  const [provinces, setProvinces] = useState<GeoProvince[]>([]);
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
      const [countryList, provinceList] = await Promise.all([
        getGeoCountries(token, 1, 1000), // Get all countries for dropdown
        getGeoProvinces(token, null, page, pageSize),
      ]);
      setCountries(countryList.data);
      setProvinces(provinceList.data);
      setTotal(provinceList.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : translations.errors.geoProvincesLoadFailed;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page]);

  const handleDelete = async (province: GeoProvince) => {
    if (!token) return;
    const confirmed = confirm(
      `${translations.common.delete}? ${province.name}`
    );
    if (!confirmed) return;

    try {
      await deleteGeoProvince(token, province.id);
      fetchData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : translations.errors.geoDeleteFailed;
      alert(message);
    }
  };

  const countryNameById = (id: number) =>
    countries.find((country) => country.id === id)?.name || '—';

  const handleBulkUpload = async (data: any[]) => {
    if (!token) throw new Error('Not authenticated');
    
    const result = await bulkUploadGeoProvinces(token, data);
    
    // Refresh the list after upload
    await fetchData();
    
    return result;
  };

  const handleDownloadTemplate = () => {
    downloadExcelTemplate(
      'geo_provinces_template.xlsx',
      ['name', 'country_name', 'latitude', 'longitude'],
      [
        ['Tashkent', 'Uzbekistan', '41.311151', '69.279737'],
        ['Samarkand', 'Uzbekistan', '39.654300', '66.975500'],
        ['Bukhara', 'Uzbekistan', '39.775200', '64.428600'],
      ]
    );
  };

  return (
    <div className="geo-entity-page">
      <div className="page-header">
        <div>
          <h1>{translations.geo.provinces.list}</h1>
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
            requiredColumns={['name', 'country_name']}
            buttonText="📤 Upload Excel"
            disabled={loading}
          />
          <Button onClick={() => navigate('/geo/provinces/create')}>
            {translations.geo.provinces.create}
          </Button>
        </div>
      </div>

      <div className="geo-card geo-table-card">
        <header>
          <h2>{translations.geo.provinces.sectionTitle}</h2>
        </header>

        {error && <div className="geo-error">{error}</div>}

        <div className="geo-table-wrapper">
          {loading ? (
            <div className="geo-loading">{translations.common.loading}</div>
          ) : provinces.length === 0 ? (
            <div className="geo-empty">{translations.geo.tables.empty}</div>
          ) : (
            <table className="geo-table">
              <thead>
                <tr>
                  <th>{translations.geo.tables.name}</th>
                  <th>{translations.geo.tables.parent}</th>
                  <th>{translations.geo.tables.latitude}</th>
                  <th>{translations.geo.tables.longitude}</th>
                  <th>{translations.geo.tables.actions}</th>
                </tr>
              </thead>
              <tbody>
                {provinces.map((province) => (
                  <tr key={province.id}>
                    <td>{province.name}</td>
                    <td>{countryNameById(province.country_id)}</td>
                    <td>{province.latitude ?? '—'}</td>
                    <td>{province.longitude ?? '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => navigate(`/geo/provinces/${province.id}/edit`)}
                        >
                          {translations.common.edit}
                        </Button>
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => handleDelete(province)}
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

export default GeoProvincesListPage;

