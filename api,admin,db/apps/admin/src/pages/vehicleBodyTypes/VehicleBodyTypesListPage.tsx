import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import {
  getVehicleBodyTypes,
  deleteVehicleBodyType,
  type VehicleBodyType,
} from '../../api/vehicleBodyTypes';
import { translations } from '../../utils/translations';
import './VehicleBodyTypesListPage.css';

export const VehicleBodyTypesListPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [bodyTypes, setBodyTypes] = useState<VehicleBodyType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      fetchBodyTypes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, includeInactive]);

  const fetchBodyTypes = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getVehicleBodyTypes(token, includeInactive);
      setBodyTypes(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Vehicle body types yuklashda xatolik'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bodyType: VehicleBodyType) => {
    if (!token) return;
    const confirmed = confirm('Bu vehicle body type ni o\'chirishni xohlaysizmi?');
    if (!confirmed) return;

    try {
      await deleteVehicleBodyType(token, bodyType.id);
      fetchBodyTypes();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Vehicle body type o\'chirishda xatolik'
      );
    }
  };

  const filteredBodyTypes = useMemo(() => {
    if (includeInactive) {
      return bodyTypes;
    }
    return bodyTypes.filter((bodyType) => bodyType.is_active);
  }, [bodyTypes, includeInactive]);

  return (
    <div className="vehicle-body-types-page">
      <div className="page-header">
        <h1>Vehicle Body Types</h1>
        <Button onClick={() => navigate('/vehicle-body-types/create')}>
          Qo'shish
        </Button>
      </div>

      <div className="vehicle-body-types-controls">
        <label className="toggle-group">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
          />
          <span>Faol bo'lmaganlarni ko'rsatish</span>
        </label>
        <Button variant="outlined" onClick={fetchBodyTypes} loading={loading}>
          {translations.common.update}
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && filteredBodyTypes.length === 0 ? (
        <div className="loading">{translations.common.loading}</div>
      ) : (
        <div className="table-scroll">
          <div className="vehicle-body-types-table-container">
            <table className="vehicle-body-types-table">
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
                {filteredBodyTypes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      Ro'yxat bo'sh
                    </td>
                  </tr>
                ) : (
                  filteredBodyTypes.map((bodyType) => (
                    <tr key={bodyType.id}>
                      <td>{bodyType.name}</td>
                      <td>{bodyType.name_uz || '—'}</td>
                      <td>{bodyType.name_ru || '—'}</td>
                      <td>{bodyType.name_en || '—'}</td>
                      <td>{bodyType.sort_order}</td>
                      <td>
                        <span
                          className={`status-badge ${bodyType.is_active ? 'status-active' : 'status-inactive'}`}
                        >
                          {bodyType.is_active
                            ? translations.status.active
                            : translations.status.inactive}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/vehicle-body-types/${bodyType.id}/edit`)}
                          >
                            {translations.common.edit}
                          </Button>
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() => handleDelete(bodyType)}
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

