import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import {
  getVehicleTypes,
  deleteVehicleType,
  type VehicleType,
} from '../../api/vehicleTypes';
import { translations } from '../../utils/translations';
import './VehicleTypesListPage.css';

export const VehicleTypesListPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [types, setTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      fetchTypes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, includeInactive]);

  const fetchTypes = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getVehicleTypes(token, includeInactive);
      setTypes(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Vehicle types yuklashda xatolik'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: VehicleType) => {
    if (!token) return;
    const confirmed = confirm('Bu vehicle type ni o\'chirishni xohlaysizmi?');
    if (!confirmed) return;

    try {
      await deleteVehicleType(token, type.id);
      fetchTypes();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Vehicle type o\'chirishda xatolik'
      );
    }
  };

  const filteredTypes = useMemo(() => {
    if (includeInactive) {
      return types;
    }
    return types.filter((type) => type.is_active);
  }, [types, includeInactive]);

  return (
    <div className="vehicle-types-page">
      <div className="page-header">
        <h1>Vehicle Types</h1>
        <Button onClick={() => navigate('/vehicle-types/create')}>
          Qo'shish
        </Button>
      </div>

      <div className="vehicle-types-controls">
        <label className="toggle-group">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
          />
          <span>Faol bo'lmaganlarni ko'rsatish</span>
        </label>
        <Button variant="outlined" onClick={fetchTypes} loading={loading}>
          {translations.common.update}
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && filteredTypes.length === 0 ? (
        <div className="loading">{translations.common.loading}</div>
      ) : (
        <div className="table-scroll">
          <div className="vehicle-types-table-container">
            <table className="vehicle-types-table">
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
                {filteredTypes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      Ro'yxat bo'sh
                    </td>
                  </tr>
                ) : (
                  filteredTypes.map((type) => (
                    <tr key={type.id}>
                      <td>{type.name}</td>
                      <td>{type.name_uz || '—'}</td>
                      <td>{type.name_ru || '—'}</td>
                      <td>{type.name_en || '—'}</td>
                      <td>{type.sort_order}</td>
                      <td>
                        <span
                          className={`status-badge ${type.is_active ? 'status-active' : 'status-inactive'}`}
                        >
                          {type.is_active
                            ? translations.status.active
                            : translations.status.inactive}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/vehicle-types/${type.id}/edit`)}
                          >
                            {translations.common.edit}
                          </Button>
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() => handleDelete(type)}
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

