/**
 * Driver Offers List Page
 * Admin page for moderating driver offers
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import * as driverOffersApi from '../../api/driverOffers';
import type { DriverOffer, DriverOfferStatistics } from '../../api/driverOffers';
import { formatDate } from '../../utils/date';
import { handleApiError } from '../../utils/errorHandler';
import './DriverOffersListPage.css';

export const DriverOffersListPage = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [offers, setOffers] = useState<DriverOffer[]>([]);
  const [statistics, setStatistics] = useState<DriverOfferStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending_review');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (token) {
      loadOffers();
      loadStatistics();
    }
  }, [token, statusFilter, pagination.offset]);

  const loadOffers = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const data = await driverOffersApi.getOffers(token, {
        status: statusFilter,
        search: searchQuery || undefined,
        limit: pagination.limit,
        offset: pagination.offset,
      });
      setOffers(data.offers || []);
      setTotal(data.total || 0);
    } catch (err) {
      const isAuthError = await handleApiError(err, logout, navigate);
      if (isAuthError) {
        return; // Redirect handled, don't show error
      }
      setError(err instanceof Error ? err.message : 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    if (!token) return;

    try {
      const stats = await driverOffersApi.getStatistics(token);
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, offset: 0 });
    loadOffers();
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPagination({ ...pagination, offset: 0 });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'status-draft' },
      pending_review: { label: 'Pending Review', className: 'status-pending' },
      approved: { label: 'Approved', className: 'status-approved' },
      published: { label: 'Published', className: 'status-published' },
      rejected: { label: 'Rejected', className: 'status-rejected' },
      archived: { label: 'Archived', className: 'status-archived' },
    };
    const statusInfo = statusMap[status] || { label: status, className: '' };
    return <span className={`status-badge ${statusInfo.className}`}>{statusInfo.label}</span>;
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: currency || 'UZS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="driver-offers-list-page">
      <div className="page-header">
        <h1>Driver Offers Moderation</h1>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="statistics-cards">
          <div className="stat-card">
            <div className="stat-label">Total Offers</div>
            <div className="stat-value">{statistics.total}</div>
          </div>
          <div
            className="stat-card clickable"
            onClick={() => handleStatusFilterChange('pending_review')}
          >
            <div className="stat-label">Pending Review</div>
            <div className="stat-value stat-pending">{statistics.pending_review}</div>
          </div>
          <div
            className="stat-card clickable"
            onClick={() => handleStatusFilterChange('approved')}
          >
            <div className="stat-label">Approved</div>
            <div className="stat-value stat-approved">{statistics.approved}</div>
          </div>
          <div
            className="stat-card clickable"
            onClick={() => handleStatusFilterChange('published')}
          >
            <div className="stat-label">Published</div>
            <div className="stat-value stat-published">{statistics.published}</div>
          </div>
          <div
            className="stat-card clickable"
            onClick={() => handleStatusFilterChange('rejected')}
          >
            <div className="stat-label">Rejected</div>
            <div className="stat-value stat-rejected">{statistics.rejected}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => handleStatusFilterChange(e.target.value)}>
            <option value="">All</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
            <option value="archived">Archived</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div className="filter-group">
          <input
            type="text"
            placeholder="Search by location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="btn-search">
            Search
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Offers Table */}
      {loading ? (
        <div className="loading">Loading offers...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="offers-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Driver</th>
                  <th>Route</th>
                  <th>Departure</th>
                  <th>Seats</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {offers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="no-data">
                      No offers found
                    </td>
                  </tr>
                ) : (
                  offers.map((offer) => (
                    <tr key={offer.id}>
                      <td className="id-cell">{offer.id.substring(0, 8)}...</td>
                      <td>
                        <div className="driver-info">
                          <div className="driver-name">
                            {offer.user?.display_name ||
                              `${offer.user?.first_name || ''} ${offer.user?.last_name || ''}`.trim() ||
                              'N/A'}
                          </div>
                          <div className="driver-phone">{offer.user?.phone_e164}</div>
                        </div>
                      </td>
                      <td>
                        <div className="route-info">
                          <div className="route-from">📍 {offer.from_text}</div>
                          <div className="route-to">📍 {offer.to_text}</div>
                        </div>
                      </td>
                      <td>{formatDate(offer.start_at)}</td>
                      <td>
                        {offer.seats_free}/{offer.seats_total}
                      </td>
                      <td>{formatPrice(offer.price_per_seat, offer.currency)}</td>
                      <td>{getStatusBadge(offer.status)}</td>
                      <td>{formatDate(offer.created_at)}</td>
                      <td>
                        <button
                          className="btn-view"
                          onClick={() => navigate(`/driver-offers/${offer.id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > pagination.limit && (
            <div className="pagination">
              <button
                disabled={pagination.offset === 0}
                onClick={() =>
                  setPagination({ ...pagination, offset: pagination.offset - pagination.limit })
                }
              >
                Previous
              </button>
              <span>
                Page {Math.floor(pagination.offset / pagination.limit) + 1} of{' '}
                {Math.ceil(total / pagination.limit)}
              </span>
              <button
                disabled={pagination.offset + pagination.limit >= total}
                onClick={() =>
                  setPagination({ ...pagination, offset: pagination.offset + pagination.limit })
                }
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

