import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import {
  getCountries,
  deleteCountry,
  type Country,
} from '../../api/countries';
import { translations } from '../../utils/translations';
import './CountriesListPage.css';

const PATTERN_LABELS: Record<string, string> = {
  uz: translations.countries.patterns.uz,
  ru: translations.countries.patterns.ru,
  generic: translations.countries.patterns.generic,
};

export const CountriesListPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      fetchCountries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, includeInactive]);

  const fetchCountries = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getCountries(token, includeInactive);
      setCountries(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : translations.errors.countriesLoadFailed
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (country: Country) => {
    if (!token) return;
    const confirmed = confirm(translations.countries.deleteConfirm);
    if (!confirmed) return;

    try {
      await deleteCountry(token, country.id);
      fetchCountries();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : translations.errors.countryDeleteFailed
      );
    }
  };

  const filteredCountries = useMemo(() => {
    if (includeInactive) {
      return countries;
    }
    return countries.filter((country) => country.is_active);
  }, [countries, includeInactive]);

  return (
    <div className="countries-page">
      <div className="page-header">
        <h1>{translations.countries.title}</h1>
        <Button onClick={() => navigate('/countries/create')}>
          {translations.countries.createButton}
        </Button>
      </div>

      <div className="countries-controls">
        <label className="toggle-group">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
          />
          <span>{translations.countries.isActive}</span>
        </label>
        <Button variant="outlined" onClick={fetchCountries} loading={loading}>
          {translations.common.update}
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && filteredCountries.length === 0 ? (
        <div className="loading">{translations.common.loading}</div>
      ) : (
        <div className="table-scroll">
          <div className="countries-table-container">
            <table className="countries-table">
              <thead>
                <tr>
                  <th>{translations.countries.name}</th>
                  <th>{translations.countries.code}</th>
                  <th>{translations.countries.flag}</th>
                  <th>{translations.countries.localLength}</th>
                  <th>{translations.countries.pattern}</th>
                  <th>{translations.countries.sortOrder}</th>
                  <th>{translations.countries.isActive}</th>
                  <th>{translations.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCountries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      {translations.countries.listEmpty}
                    </td>
                  </tr>
                ) : (
                  filteredCountries.map((country) => (
                    <tr key={country.id}>
                      <td>{country.name}</td>
                      <td>{country.code}</td>
                      <td className="flag-cell">{country.flag || '—'}</td>
                      <td>{country.local_length}</td>
                      <td>
                        <span className="pattern-badge">
                          {PATTERN_LABELS[country.pattern] || country.pattern}
                        </span>
                      </td>
                      <td>{country.sort_order}</td>
                      <td>
                        <span
                          className={`status-badge ${country.is_active ? 'status-active' : 'status-inactive'}`}
                        >
                          {country.is_active
                            ? translations.status.active
                            : translations.status.inactive}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/countries/${country.id}/edit`)}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};


