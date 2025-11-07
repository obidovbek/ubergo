/**
 * Passenger Detail Page
 * Displays detailed information about a passenger
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import * as passengersApi from '../../api/passengers';
import type { Passenger } from '../../api/passengers';
import { Button } from '../../components/Button';
import { translations } from '../../utils/translations';
import './PassengerDetailPage.css';

export const PassengerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [passenger, setPassenger] = useState<Passenger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && id) {
      loadPassenger();
    }
  }, [token, id]);

  const loadPassenger = async () => {
    if (!token || !id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await passengersApi.getPassengerById(token, id);
      setPassenger(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yo\'lovchini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="passenger-detail-page">
        <div className="loading">{translations.common.loading}</div>
      </div>
    );
  }

  if (error || !passenger) {
    return (
      <div className="passenger-detail-page">
        <div className="error-message">{error || 'Yo\'lovchi topilmadi'}</div>
        <Button onClick={() => navigate('/passengers')}>Orqaga</Button>
      </div>
    );
  }

  return (
    <div className="passenger-detail-page">
      <div className="page-header">
        <h1>Yo'lovchi Ma'lumotlari</h1>
        <Button onClick={() => navigate('/passengers')}>Orqaga</Button>
      </div>

      <div className="detail-sections">
        <section className="detail-section">
          <h2>Asosiy Ma'lumotlar</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>ID</label>
              <span>{passenger.id}</span>
            </div>
            <div className="detail-item">
              <label>Ism</label>
              <span>{passenger.display_name || 
                     [passenger.first_name, passenger.father_name, passenger.last_name]
                       .filter(Boolean).join(' ') || 
                     'Noma\'lum'}</span>
              </div>
            <div className="detail-item">
              <label>Telefon</label>
              <span>{passenger.phone_e164 || '-'}</span>
            </div>
            <div className="detail-item">
              <label>Email</label>
              <span>{passenger.email || '-'}</span>
            </div>
            <div className="detail-item">
              <label>Jins</label>
              <span>{passenger.gender === 'male' ? 'Erkak' : 
                     passenger.gender === 'female' ? 'Ayol' : 
                     passenger.gender === 'other' ? 'Boshqa' : '-'}</span>
            </div>
            <div className="detail-item">
              <label>Tug'ilgan sana</label>
              <span>{passenger.birth_date ? 
                     new Date(passenger.birth_date).toLocaleDateString('uz-UZ') : '-'}</span>
            </div>
            <div className="detail-item">
              <label>Holat</label>
              <span className={`status-badge status-${passenger.status}`}>
                {passenger.status === 'active' ? 'Faol' : 
                 passenger.status === 'blocked' ? 'Bloklangan' : 
                 'O\'chirish kutilmoqda'}
              </span>
            </div>
            <div className="detail-item">
              <label>Tasdiqlangan</label>
              <span className={passenger.is_verified ? 'verified' : 'not-verified'}>
                {passenger.is_verified ? 'Ha' : 'Yo\'q'}
              </span>
            </div>
            <div className="detail-item">
              <label>Profil to'liq</label>
              <span className={passenger.profile_complete ? 'complete' : 'incomplete'}>
                {passenger.profile_complete ? 'Ha' : 'Yo\'q'}
              </span>
            </div>
            <div className="detail-item">
              <label>Ro'yxatdan o'tgan</label>
              <span>{new Date(passenger.created_at).toLocaleString('uz-UZ')}</span>
            </div>
            <div className="detail-item">
              <label>Oxirgi yangilanish</label>
              <span>{new Date(passenger.updated_at).toLocaleString('uz-UZ')}</span>
            </div>
          </div>
        </section>

        {passenger.phones && passenger.phones.length > 0 && (
          <section className="detail-section">
            <h2>Telefon Raqamlari</h2>
            <div className="phones-list">
              {passenger.phones.map((phone) => (
                <div key={phone.id} className="phone-item">
                  <span className="phone-label">{phone.label}</span>
                  <span className="phone-number">{phone.e164}</span>
                  <span className={phone.is_verified ? 'verified' : 'not-verified'}>
                    {phone.is_verified ? 'Tasdiqlangan' : 'Tasdiqlanmagan'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {passenger.identities && passenger.identities.length > 0 && (
          <section className="detail-section">
            <h2>SSO Hisoblar</h2>
            <div className="identities-list">
              {passenger.identities.map((identity) => (
                <div key={identity.id} className="identity-item">
                  <span className="identity-provider">{identity.provider}</span>
                  <span className="identity-uid">{identity.provider_uid}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {passenger.pushTokens && passenger.pushTokens.length > 0 && (
          <section className="detail-section">
            <h2>Push Tokenlar</h2>
            <div className="tokens-list">
              {passenger.pushTokens.map((token) => (
                <div key={token.id} className="token-item">
                  <span className="token-platform">{token.platform}</span>
                  <span className="token-app">{token.app}</span>
                  <span className="token-value">{token.token.substring(0, 20)}...</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

