import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import {
  getVehicleColors,
  deleteVehicleColor,
  type VehicleColor,
} from '../../api/vehicleColors';
import { translations } from '../../utils/translations';
import './VehicleColorsListPage.css';

export const VehicleColorsListPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [colors, setColors] = useState<VehicleColor[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      fetchColors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, includeInactive]);

  const fetchColors = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getVehicleColors(token, includeInactive);
      setColors(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Vehicle colors yuklashda xatolik'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (color: VehicleColor) => {
    if (!token) return;
    const confirmed = confirm('Bu vehicle color ni o\'chirishni xohlaysizmi?');
    if (!confirmed) return;

    try {
      await deleteVehicleColor(token, color.id);
      fetchColors();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Vehicle color o\'chirishda xatolik'
      );
    }
  };

  const filteredColors = useMemo(() => {
    if (includeInactive) {
      return colors;
    }
    return colors.filter((color) => color.is_active);
  }, [colors, includeInactive]);

  return (
    <div className="vehicle-colors-page">
      <div className="page-header">
        <h1>Vehicle Colors</h1>
        <Button onClick={() => navigate('/vehicle-colors/create')}>
          Qo'shish
        </Button>
      </div>

      <div className="vehicle-colors-controls">
        <label className="toggle-group">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
          />
          <span>Faol bo'lmaganlarni ko'rsatish</span>
        </label>
        <Button variant="outlined" onClick={fetchColors} loading={loading}>
          {translations.common.update}
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && filteredColors.length === 0 ? (
        <div className="loading">{translations.common.loading}</div>
      ) : (
        <div className="table-scroll">
          <div className="vehicle-colors-table-container">
            <table className="vehicle-colors-table">
              <thead>
                <tr>
                  <th>Nomi</th>
                  <th>Nomi (UZ)</th>
                  <th>Nomi (RU)</th>
                  <th>Nomi (EN)</th>
                  <th>Hex Code</th>
                  <th>Tartib</th>
                  <th>Holati</th>
                  <th>{translations.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredColors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      Ro'yxat bo'sh
                    </td>
                  </tr>
                ) : (
                  filteredColors.map((color) => (
                    <tr key={color.id}>
                      <td>{color.name}</td>
                      <td>{color.name_uz || '—'}</td>
                      <td>{color.name_ru || '—'}</td>
                      <td>{color.name_en || '—'}</td>
                      <td>
                        {color.hex_code ? (
                          <div className="color-preview">
                            <span
                              className="color-swatch"
                              style={{ backgroundColor: color.hex_code }}
                            />
                            <span>{color.hex_code}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{color.sort_order}</td>
                      <td>
                        <span
                          className={`status-badge ${color.is_active ? 'status-active' : 'status-inactive'}`}
                        >
                          {color.is_active
                            ? translations.status.active
                            : translations.status.inactive}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/vehicle-colors/${color.id}/edit`)}
                          >
                            {translations.common.edit}
                          </Button>
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() => handleDelete(color)}
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

