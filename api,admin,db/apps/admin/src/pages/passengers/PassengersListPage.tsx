/**
 * Passengers List Page
 * Displays a list of all registered passengers
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import * as passengersApi from '../../api/passengers';
import type { Passenger } from '../../api/passengers';
import { Button } from '../../components/Button';
import { translations } from '../../utils/translations';
import './PassengersListPage.css';

export const PassengersListPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    if (token) {
      loadPassengers();
    }
  }, [token, page, statusFilter]);

  const loadPassengers = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await passengersApi.getPassengers(
        token,
        page,
        pageSize,
        {
          status: statusFilter || undefined,
          search: search || undefined,
        }
      );
      setPassengers(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : translations.errors.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadPassengers();
  };

  const handleStatusChange = async (id: string, newStatus: 'active' | 'blocked' | 'pending_delete') => {
    if (!token) return;
    
    const statusText = {
      active: 'faollashtirish',
      blocked: 'bloklash',
      pending_delete: 'o\'chirish kutilmoqda holatiga o\'tkazish'
    }[newStatus];
    
    if (!confirm(`Bu yo'lovchini ${statusText}ni xohlaysizmi?`)) return;

    try {
      await passengersApi.updatePassengerStatus(token, id, newStatus);
      loadPassengers();
    } catch (err) {
      alert(err instanceof Error ? err.message : translations.errors.updateFailed || 'Status yangilashda xatolik');
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm('Bu yo\'lovchini o\'chirishni xohlaysizmi?')) return;

    try {
      await passengersApi.deletePassenger(token, id);
      loadPassengers();
    } catch (err) {
      alert(err instanceof Error ? err.message : translations.errors.deleteFailed);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading && passengers.length === 0) {
    return (
      <div className="passengers-page">
        <div className="page-header">
          <h1>Yo'lovchilar</h1>
        </div>
        <div className="loading">{translations.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="passengers-page">
      <div className="page-header">
        <h1>Yo'lovchilar</h1>
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
        <Button onClick={handleSearch}>Qidirish</Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="passengers-table-container">
        <table className="passengers-table">
          <thead>
            <tr>
              <th>Ism</th>
              <th>Telefon</th>
              <th>Email</th>
              <th>Holat</th>
              <th>Tasdiqlangan</th>
              <th>Profil to'liq</th>
              <th>Ro'yxatdan o'tgan</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {passengers.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">
                  Yo'lovchilar topilmadi
                </td>
              </tr>
            ) : (
              passengers.map((passenger) => (
                <tr key={passenger.id}>
                  <td>
                    {passenger.display_name || 
                     [passenger.first_name, passenger.father_name, passenger.last_name]
                       .filter(Boolean).join(' ') || 
                     'Noma\'lum'}
                  </td>
                  <td>{passenger.phone_e164 || '-'}</td>
                  <td>{passenger.email || '-'}</td>
                  <td>
                    <span className={`status-badge status-${passenger.status}`}>
                      {passenger.status === 'active' ? 'Faol' : 
                       passenger.status === 'blocked' ? 'Bloklangan' : 
                       'O\'chirish kutilmoqda'}
                    </span>
                  </td>
                  <td>
                    <span className={passenger.is_verified ? 'verified' : 'not-verified'}>
                      {passenger.is_verified ? 'Ha' : 'Yo\'q'}
                    </span>
                  </td>
                  <td>
                    <span className={passenger.profile_complete ? 'complete' : 'incomplete'}>
                      {passenger.profile_complete ? 'Ha' : 'Yo\'q'}
                    </span>
                  </td>
                  <td>
                    {new Date(passenger.created_at).toLocaleDateString('uz-UZ')}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <select
                        value={passenger.status}
                        onChange={(e) => handleStatusChange(passenger.id, e.target.value as 'active' | 'blocked' | 'pending_delete')}
                        className="status-select"
                        style={{ marginRight: '8px', padding: '4px 8px' }}
                      >
                        <option value="active">Faol</option>
                        <option value="blocked">Bloklangan</option>
                        <option value="pending_delete">O'chirish kutilmoqda</option>
                      </select>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/passengers/${passenger.id}`)}
                      >
                        {translations.common.edit}
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleDelete(passenger.id)}
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

