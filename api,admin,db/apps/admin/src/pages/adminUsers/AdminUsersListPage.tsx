/**
 * Admin Users List Page
 * Displays a list of all admin users
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import * as adminUsersApi from '../../api/adminUsers';
import type { AdminUser } from '../../api/adminUsers';
import { Button } from '../../components/Button';
import { translations } from '../../utils/translations';
import { handleApiError } from '../../utils/errorHandler';
import './AdminUsersListPage.css';

export const AdminUsersListPage = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (token) {
      loadAdminUsers();
    }
  }, [token, page]);

  const loadAdminUsers = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await adminUsersApi.getAdminUsers(token, page, pageSize);
      setAdminUsers(response.adminUsers);
      setTotal(response.total);
    } catch (err) {
      // Handle authentication errors by redirecting to login
      const isAuthError = await handleApiError(err, logout, navigate);
      if (isAuthError) {
        return; // Redirect handled, don't show error
      }
      setError(err instanceof Error ? err.message : translations.errors.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm(translations.adminUsers.deleteConfirm)) return;

    try {
      await adminUsersApi.deleteAdminUser(token, id);
      loadAdminUsers();
    } catch (err) {
      // Handle authentication errors by redirecting to login
      const isAuthError = await handleApiError(err, logout, navigate);
      if (isAuthError) {
        return; // Redirect handled, don't show error
      }
      alert(err instanceof Error ? err.message : translations.errors.deleteFailed);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading && adminUsers.length === 0) {
    return (
      <div className="admin-users-page">
        <div className="page-header">
          <h1>{translations.adminUsers.title}</h1>
        </div>
        <div className="loading">{translations.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="admin-users-page">
      <div className="page-header">
        <h1>{translations.adminUsers.title}</h1>
        <Button onClick={() => navigate('/admin-users/create')}>
          {translations.adminUsers.createButton}
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="admin-users-table-container">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>{translations.common.name}</th>
              <th>{translations.common.email}</th>
              <th>{translations.common.roles}</th>
              <th>{translations.common.status}</th>
              <th>{translations.adminUsers.lastLogin}</th>
              <th>{translations.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  {translations.adminUsers.noUsersFound}
                </td>
              </tr>
            ) : (
              adminUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.full_name}</td>
                  <td>{user.email}</td>
                  <td>
                    <div className="roles-list">
                      {user.roles.map((role) => (
                        <span key={role.id} className="role-badge">
                          {role.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${user.status}`}>
                      {translations.status[user.status as keyof typeof translations.status] || user.status}
                    </span>
                  </td>
                  <td>
                    {user.last_login_at
                      ? new Date(user.last_login_at).toLocaleDateString('uz-UZ')
                      : translations.common.never}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/admin-users/${user.id}/edit`)}
                      >
                        {translations.common.edit}
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleDelete(user.id)}
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

