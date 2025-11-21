import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import {
  getVehicleMakes,
  deleteVehicleMake,
  type VehicleMake,
} from '../../api/vehicleMakes';
import { translations } from '../../utils/translations';
import './VehicleMakesListPage.css';

export const VehicleMakesListPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      fetchMakes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, includeInactive]);

  const fetchMakes = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getVehicleMakes(token, includeInactive);
      setMakes(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Vehicle makes yuklashda xatolik'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (make: VehicleMake) => {
    if (!token) return;
    const confirmed = confirm('Bu vehicle make ni o\'chirishni xohlaysizmi?');
    if (!confirmed) return;

    try {
      await deleteVehicleMake(token, make.id);
      fetchMakes();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Vehicle make o\'chirishda xatolik'
      );
    }
  };

  const filteredMakes = useMemo(() => {
    if (includeInactive) {
      return makes;
    }
    return makes.filter((make) => make.is_active);
  }, [makes, includeInactive]);

  return (
    <div className="vehicle-makes-page">
      <div className="page-header">
        <h1>Vehicle Makes</h1>
        <Button onClick={() => navigate('/vehicle-makes/create')}>
          Qo'shish
        </Button>
      </div>

      <div className="vehicle-makes-controls">
        <label className="toggle-group">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
          />
          <span>Faol bo'lmaganlarni ko'rsatish</span>
        </label>
        <Button variant="outlined" onClick={fetchMakes} loading={loading}>
          {translations.common.update}
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && filteredMakes.length === 0 ? (
        <div className="loading">{translations.common.loading}</div>
      ) : (
        <div className="table-scroll">
          <div className="vehicle-makes-table-container">
            <table className="vehicle-makes-table">
              <thead>
                <tr>
                  <th>Nomi</th>
                  <th>Nomi (UZ)</th>
                  <th>Nomi (RU)</th>
                  <th>Nomi (EN)</th>
                  <th>Tartib</th>
                  <th>Holati</th>
                  <th>{translations.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredMakes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      Ro'yxat bo'sh
                    </td>
                  </tr>
                ) : (
                  filteredMakes.map((make) => (
                    <tr key={make.id}>
                      <td>{make.name}</td>
                      <td>{make.name_uz || '—'}</td>
                      <td>{make.name_ru || '—'}</td>
                      <td>{make.name_en || '—'}</td>
                      <td>{make.sort_order}</td>
                      <td>
                        <span
                          className={`status-badge ${make.is_active ? 'status-active' : 'status-inactive'}`}
                        >
                          {make.is_active
                            ? translations.status.active
                            : translations.status.inactive}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/vehicle-makes/${make.id}/edit`)}
                          >
                            {translations.common.edit}
                          </Button>
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() => handleDelete(make)}
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

