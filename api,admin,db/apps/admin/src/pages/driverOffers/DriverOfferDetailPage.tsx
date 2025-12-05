/**
 * Driver Offer Detail Page
 * Admin page for viewing and moderating a single driver offer
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import * as driverOffersApi from '../../api/driverOffers';
import type { DriverOffer } from '../../api/driverOffers';
import { formatDate } from '../../utils/date';
import { handleApiError } from '../../utils/errorHandler';
import './DriverOfferDetailPage.css';

export const DriverOfferDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [offer, setOffer] = useState<DriverOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [autoPublish, setAutoPublish] = useState(true);

  useEffect(() => {
    if (id && token) {
      loadOffer();
    }
  }, [id, token]);

  const loadOffer = async () => {
    if (!token || !id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await driverOffersApi.getOfferById(token, id);
      setOffer(data.offer);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!offer || !token || !window.confirm(`Approve this offer${autoPublish ? ' and publish' : ''}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await driverOffersApi.approveOffer(token, offer.id, autoPublish);
      alert(`Offer ${autoPublish ? 'approved and published' : 'approved'} successfully!`);
      loadOffer();
    } catch (err) {
      alert(handleApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!offer || !token || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      await driverOffersApi.rejectOffer(token, offer.id, rejectionReason);
      alert('Offer rejected successfully!');
      setShowRejectModal(false);
      setRejectionReason('');
      loadOffer();
    } catch (err) {
      alert(handleApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: currency || 'UZS',
      minimumFractionDigits: 0,
    }).format(price);
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

  if (loading) {
    return <div className="loading">Loading offer details...</div>;
  }

  if (error || !offer) {
    return (
      <div className="error-container">
        <div className="error-message">{error || 'Offer not found'}</div>
        <button onClick={() => navigate('/driver-offers')} className="btn-back">
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="driver-offer-detail-page">
      <div className="page-header">
        <button onClick={() => navigate('/driver-offers')} className="btn-back">
          ← Back to List
        </button>
        <h1>Driver Offer Details</h1>
      </div>

      <div className="detail-container">
        {/* Status and Actions */}
        <div className="status-section">
          <div className="status-info">
            <span className="label">Status:</span>
            {getStatusBadge(offer.status)}
          </div>

          {offer.status === 'pending_review' && (
            <div className="action-buttons">
              <div className="auto-publish-toggle">
                <label>
                  <input
                    type="checkbox"
                    checked={autoPublish}
                    onChange={(e) => setAutoPublish(e.target.checked)}
                  />
                  Auto-publish after approval
                </label>
              </div>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="btn-approve"
              >
                {actionLoading ? 'Processing...' : autoPublish ? 'Approve & Publish' : 'Approve'}
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="btn-reject"
              >
                Reject
              </button>
            </div>
          )}
        </div>

        {/* Rejection Reason (if rejected) */}
        {offer.status === 'rejected' && offer.rejection_reason && (
          <div className="rejection-section">
            <h3>Rejection Reason</h3>
            <p>{offer.rejection_reason}</p>
            {offer.reviewer && (
              <p className="reviewer-info">
                Reviewed by: {offer.reviewer.username} on {formatDate(offer.reviewed_at!)}
              </p>
            )}
          </div>
        )}

        {/* Route Information */}
        <div className="info-section">
          <h2>Route Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">From:</span>
              <span className="value">📍 {offer.from_text}</span>
            </div>
            <div className="info-item">
              <span className="label">To:</span>
              <span className="value">📍 {offer.to_text}</span>
            </div>
            <div className="info-item">
              <span className="label">Departure:</span>
              <span className="value">{formatDate(offer.start_at)}</span>
            </div>
          </div>
        </div>

        {/* Pricing and Seats */}
        <div className="info-section">
          <h2>Pricing & Availability</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Price per Seat:</span>
              <span className="value price">{formatPrice(offer.price_per_seat, offer.currency)}</span>
            </div>
            <div className="info-item">
              <span className="label">Total Seats:</span>
              <span className="value">{offer.seats_total}</span>
            </div>
            <div className="info-item">
              <span className="label">Available Seats:</span>
              <span className="value">{offer.seats_free}</span>
            </div>
          </div>
        </div>

        {/* Note */}
        {offer.note && (
          <div className="info-section">
            <h2>Driver's Note</h2>
            <p className="note-text">{offer.note}</p>
          </div>
        )}

        {/* Driver Information */}
        <div className="info-section">
          <h2>Driver Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Name:</span>
              <span className="value">
                {offer.user?.display_name ||
                  `${offer.user?.first_name || ''} ${offer.user?.last_name || ''}`.trim() ||
                  'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Phone:</span>
              <span className="value">{offer.user?.phone_e164 || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">Email:</span>
              <span className="value">{offer.user?.email || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        {offer.vehicle && (
          <div className="info-section">
            <h2>Vehicle Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Make & Model:</span>
                <span className="value">
                  {offer.vehicle.make?.name} {offer.vehicle.model?.name}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Color:</span>
                <span className="value">{offer.vehicle.color?.name || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">License Plate:</span>
                <span className="value">{offer.vehicle.license_plate || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Year:</span>
                <span className="value">{offer.vehicle.year || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="info-section metadata">
          <div className="info-item">
            <span className="label">Created:</span>
            <span className="value">{formatDate(offer.created_at)}</span>
          </div>
          <div className="info-item">
            <span className="label">Updated:</span>
            <span className="value">{formatDate(offer.updated_at)}</span>
          </div>
          <div className="info-item">
            <span className="label">Offer ID:</span>
            <span className="value id-value">{offer.id}</span>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Reject Offer</h2>
            <p>Please provide a reason for rejecting this offer:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason (required)"
              rows={4}
              autoFocus
            />
            <div className="modal-actions">
              <button
                onClick={() => setShowRejectModal(false)}
                className="btn-cancel"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="btn-confirm-reject"
                disabled={actionLoading || !rejectionReason.trim()}
              >
                {actionLoading ? 'Processing...' : 'Reject Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

