import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ExcelUploadButton } from '../../components/ExcelUploadButton';
import { useAuth } from '../../hooks/useAuth';
import {
  deleteGeoCountry,
  getGeoCountries,
  bulkUploadGeoCountries,
  type GeoCountry,
} from '../../api/geo';
import { translations } from '../../utils/translations';
import { downloadExcelTemplate, type ExcelRow } from '../../utils/excelUpload';
import '../geo-common/GeoEntityStyles.css';

export const GeoCountriesListPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [countries, setCountries] = useState<GeoCountry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const fetchCountries = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getGeoCountries(token, page, pageSize);
      setCountries(response.data);
      setTotal(response.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : translations.errors.geoCountriesLoadFailed;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page]);

  const handleDelete = async (country: GeoCountry) => {
    if (!token) return;
    const confirmed = confirm(
      `${translations.common.delete}? ${country.name}`
    );
    if (!confirmed) return;

    try {
      await deleteGeoCountry(token, country.id);
      fetchCountries();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : translations.errors.geoDeleteFailed;
      alert(message);
    }
  };

  const handleBulkUpload = async (data: ExcelRow[]) => {
    if (!token) throw new Error('Not authenticated');
    
    const result = await bulkUploadGeoCountries(token, data);
    
    // Refresh the list after upload
    await fetchCountries();
    
    return result;
  };

  const handleDownloadTemplate = () => {
    downloadExcelTemplate(
      'geo_countries_template.xlsx',
      ['name', 'latitude', 'longitude'],
      [
        ['Uzbekistan', '41.377491', '64.585262'],
        ['Kazakhstan', '48.019573', '66.923684'],
        ['Kyrgyzstan', '41.204380', '74.766098'],
      ]
    );
  };

  return (
    <div className="geo-entity-page">
      <div className="page-header">
        <div>
          <h1>{translations.geo.countries.list}</h1>
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
            requiredColumns={['name']}
            buttonText="📤 Upload Excel"
            disabled={loading}
          />
          <Button onClick={() => navigate('/geo/countries/create')}>
            {translations.geo.countries.create}
          </Button>
        </div>
      </div>

      <div className="geo-card geo-table-card">
        <header>
          <h2>{translations.geo.countries.sectionTitle}</h2>
        </header>

        {error && <div className="geo-error">{error}</div>}

        <div className="geo-table-wrapper">
          {loading ? (
            <div className="geo-loading">{translations.common.loading}</div>
          ) : countries.length === 0 ? (
            <div className="geo-empty">{translations.geo.tables.empty}</div>
          ) : (
            <table className="geo-table">
              <thead>
                <tr>
                  <th>{translations.geo.tables.name}</th>
                  <th>{translations.geo.tables.latitude}</th>
                  <th>{translations.geo.tables.longitude}</th>
                  <th>{translations.geo.tables.actions}</th>
                </tr>
              </thead>
              <tbody>
                {countries.map((country) => (
                  <tr key={country.id}>
                    <td>{country.name}</td>
                    <td>{country.latitude ?? '—'}</td>
                    <td>{country.longitude ?? '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => navigate(`/geo/countries/${country.id}/edit`)}
                        >
                          {translations.common.edit}
                        </Button>
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => handleDelete(country)}
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

export default GeoCountriesListPage;

