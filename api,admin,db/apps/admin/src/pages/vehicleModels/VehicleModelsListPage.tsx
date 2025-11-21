import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import {
  getVehicleModels,
  deleteVehicleModel,
  type VehicleModel,
} from '../../api/vehicleModels';
import { getVehicleMakes, type VehicleMake } from '../../api/vehicleMakes';
import { translations } from '../../utils/translations';
import './VehicleModelsListPage.css';

export const VehicleModelsListPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState<boolean>(true);
  const [selectedMakeId, setSelectedMakeId] = useState<string>('');

  useEffect(() => {
    if (token) {
      fetchMakes();
      fetchModels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, includeInactive, selectedMakeId]);

  const fetchMakes = async () => {
    if (!token) return;

    try {
      const response = await getVehicleMakes(token, true);
      setMakes(response);
    } catch (err) {
      console.error('Failed to load makes:', err);
    }
  };

  const fetchModels = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getVehicleModels(token, includeInactive, selectedMakeId || undefined);
      setModels(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Vehicle models yuklashda xatolik'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (model: VehicleModel) => {
    if (!token) return;
    const confirmed = confirm('Bu vehicle model ni o\'chirishni xohlaysizmi?');
    if (!confirmed) return;

    try {
      await deleteVehicleModel(token, model.id);
      fetchModels();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Vehicle model o\'chirishda xatolik'
      );
    }
  };

  const filteredModels = useMemo(() => {
    if (includeInactive) {
      return models;
    }
    return models.filter((model) => model.is_active);
  }, [models, includeInactive]);

  return (
    <div className="vehicle-models-page">
      <div className="page-header">
        <h1>Vehicle Models</h1>
        <Button onClick={() => navigate('/vehicle-models/create')}>
          Qo'shish
        </Button>
      </div>

      <div className="vehicle-models-controls">
        <label className="toggle-group">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
          />
          <span>Faol bo'lmaganlarni ko'rsatish</span>
        </label>
        <select
          value={selectedMakeId}
          onChange={(e) => setSelectedMakeId(e.target.value)}
          className="make-filter"
        >
          <option value="">Barcha makes</option>
          {makes.map((make) => (
            <option key={make.id} value={make.id}>
              {make.name}
            </option>
          ))}
        </select>
        <Button variant="outlined" onClick={fetchModels} loading={loading}>
          {translations.common.update}
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && filteredModels.length === 0 ? (
        <div className="loading">{translations.common.loading}</div>
      ) : (
        <div className="table-scroll">
          <div className="vehicle-models-table-container">
            <table className="vehicle-models-table">
              <thead>
                <tr>
                  <th>Make</th>
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
                {filteredModels.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      Ro'yxat bo'sh
                    </td>
                  </tr>
                ) : (
                  filteredModels.map((model) => (
                    <tr key={model.id}>
                      <td>{model.make?.name || '—'}</td>
                      <td>{model.name}</td>
                      <td>{model.name_uz || '—'}</td>
                      <td>{model.name_ru || '—'}</td>
                      <td>{model.name_en || '—'}</td>
                      <td>{model.sort_order}</td>
                      <td>
                        <span
                          className={`status-badge ${model.is_active ? 'status-active' : 'status-inactive'}`}
                        >
                          {model.is_active
                            ? translations.status.active
                            : translations.status.inactive}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/vehicle-models/${model.id}/edit`)}
                          >
                            {translations.common.edit}
                          </Button>
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() => handleDelete(model)}
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

