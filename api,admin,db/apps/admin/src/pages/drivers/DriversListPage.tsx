/**
 * Drivers List Page
 * Displays a list of all registered drivers
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import * as driversApi from '../../api/drivers';
import type { Driver } from '../../api/drivers';
import { Button } from '../../components/Button';
import { translations } from '../../utils/translations';
import './DriversListPage.css';

export const DriversListPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [registrationStepFilter, setRegistrationStepFilter] = useState<string>('');

  useEffect(() => {
    if (token) {
      loadDrivers();
    }
  }, [token, page, statusFilter, registrationStepFilter]);

  const loadDrivers = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await driversApi.getDrivers(
        token,
        page,
        pageSize,
        {
          status: statusFilter || undefined,
          search: search || undefined,
          registrationStep: registrationStepFilter || undefined,
        }
      );
      setDrivers(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : translations.errors.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadDrivers();
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm('Bu haydovchini o\'chirishni xohlaysizmi?')) return;

    try {
      await driversApi.deleteDriver(token, id);
      loadDrivers();
    } catch (err) {
      alert(err instanceof Error ? err.message : translations.errors.deleteFailed);
    }
  };

  const getRegistrationStepLabel = (step?: string) => {
    switch (step) {
      case 'personal': return 'Shaxsiy ma\'lumotlar';
      case 'passport': return 'Pasport';
      case 'license': return 'Haydovchilik guvohnomasi';
      case 'vehicle': return 'Transport vositası';
      case 'taxi_license': return 'Taksi litsenziyasi';
      case 'complete': return 'To\'liq';
      default: return 'Boshlanmagan';
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading && drivers.length === 0) {
    return (
      <div className="drivers-page">
        <div className="page-header">
          <h1>Haydovchilar</h1>
        </div>
        <div className="loading">{translations.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="drivers-page">
      <div className="page-header">
        <h1>Haydovchilar</h1>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Qidirish (telefon, email, ism)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="status-filter"
        >
          <option value="">Barcha holatlar</option>
          <option value="active">Faol</option>
          <option value="blocked">Bloklangan</option>
          <option value="pending_delete">O'chirish kutilmoqda</option>
        </select>
        <select
          value={registrationStepFilter}
          onChange={(e) => {
            setRegistrationStepFilter(e.target.value);
            setPage(1);
          }}
          className="registration-filter"
        >
          <option value="">Barcha bosqichlar</option>
          <option value="personal">Shaxsiy ma'lumotlar</option>
          <option value="passport">Pasport</option>
          <option value="license">Haydovchilik guvohnomasi</option>
          <option value="vehicle">Transport vositası</option>
          <option value="taxi_license">Taksi litsenziyasi</option>
          <option value="complete">To'liq</option>
        </select>
        <Button onClick={handleSearch}>Qidirish</Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="drivers-table-container">
        <table className="drivers-table">
          <thead>
            <tr>
              <th>Ism</th>
              <th>Telefon</th>
              <th>Email</th>
              <th>Holat</th>
              <th>Ro'yxatdan o'tish bosqichi</th>
              <th>To'liq</th>
              <th>Transport</th>
              <th>Ro'yxatdan o'tgan</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-state">
                  Haydovchilar topilmadi
                </td>
              </tr>
            ) : (
              drivers.map((driver) => (
                <tr key={driver.id}>
                  <td>
                    {driver.display_name || 
                     [driver.first_name, driver.father_name, driver.last_name]
                       .filter(Boolean).join(' ') || 
                     driver.driverProfile?.first_name || 
                     'Noma\'lum'}
                  </td>
                  <td>{driver.phone_e164 || '-'}</td>
                  <td>{driver.email || driver.driverProfile?.email || '-'}</td>
                  <td>
                    <span className={`status-badge status-${driver.status}`}>
                      {driver.status === 'active' ? 'Faol' : 
                       driver.status === 'blocked' ? 'Bloklangan' : 
                       'O\'chirish kutilmoqda'}
                    </span>
                  </td>
                  <td>
                    <span className={`step-badge step-${driver.driverProfile?.registration_step || 'none'}`}>
                      {getRegistrationStepLabel(driver.driverProfile?.registration_step)}
                    </span>
                  </td>
                  <td>
                    <span className={driver.driverProfile?.is_complete ? 'complete' : 'incomplete'}>
                      {driver.driverProfile?.is_complete ? 'Ha' : 'Yo\'q'}
                    </span>
                  </td>
                  <td>
                    {driver.driverProfile?.vehicle ? (
                      <span className="has-vehicle">
                        {driver.driverProfile.vehicle.make} {driver.driverProfile.vehicle.model}
                        {driver.driverProfile.vehicle.license_plate && 
                         ` (${driver.driverProfile.vehicle.license_plate})`}
                      </span>
                    ) : (
                      <span className="no-vehicle">-</span>
                    )}
                  </td>
                  <td>
                    {new Date(driver.created_at).toLocaleDateString('uz-UZ')}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/drivers/${driver.id}`)}
                      >
                        {translations.common.edit}
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleDelete(driver.id)}
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

      {totalPages > 1 && (
        <div className="pagination">
          <Button
            variant="outlined"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            {translations.common.previous}
          </Button>
          <span className="page-info">
            {translations.common.page} {page} {translations.common.of} {totalPages}
          </span>
          <Button
            variant="outlined"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            {translations.common.next}
          </Button>
        </div>
      )}
    </div>
  );
};

