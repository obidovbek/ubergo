/**
 * Driver Detail Page
 * Displays detailed information about a driver with all related data
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import * as driversApi from '../../api/drivers';
import type { Driver } from '../../api/drivers';
import { Button } from '../../components/Button';
import { translations } from '../../utils/translations';
import './DriverDetailPage.css';

export const DriverDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && id) {
      loadDriver();
    }
  }, [token, id]);

  const loadDriver = async () => {
    if (!token || !id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await driversApi.getDriverById(token, id);
      setDriver(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Haydovchini yuklashda xatolik');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="driver-detail-page">
        <div className="loading">{translations.common.loading}</div>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="driver-detail-page">
        <div className="error-message">{error || 'Haydovchi topilmadi'}</div>
        <Button onClick={() => navigate('/drivers')}>Orqaga</Button>
      </div>
    );
  }

  const profile = driver.driverProfile;

  return (
    <div className="driver-detail-page">
      <div className="page-header">
        <h1>Haydovchi Ma'lumotlari</h1>
        <Button onClick={() => navigate('/drivers')}>Orqaga</Button>
      </div>

      <div className="detail-sections">
        {/* Basic User Information */}
        <section className="detail-section">
          <h2>Asosiy Ma'lumotlar</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>ID</label>
              <span>{driver.id}</span>
            </div>
            <div className="detail-item">
              <label>Ism</label>
              <span>{driver.display_name || 
                     [driver.first_name, driver.father_name, driver.last_name]
                       .filter(Boolean).join(' ') || 
                     profile?.first_name || 
                     'Noma\'lum'}</span>
            </div>
            <div className="detail-item">
              <label>Telefon</label>
              <span>{driver.phone_e164 || '-'}</span>
            </div>
            <div className="detail-item">
              <label>Email</label>
              <span>{driver.email || profile?.email || '-'}</span>
            </div>
            <div className="detail-item">
              <label>Jins</label>
              <span>{driver.gender === 'male' ? 'Erkak' : 
                     driver.gender === 'female' ? 'Ayol' : 
                     driver.gender === 'other' ? 'Boshqa' : '-'}</span>
            </div>
            <div className="detail-item">
              <label>Tug'ilgan sana</label>
              <span>{driver.birth_date || profile?.birth_date ? 
                     new Date(driver.birth_date || profile?.birth_date || '').toLocaleDateString('uz-UZ') : '-'}</span>
            </div>
            <div className="detail-item">
              <label>Holat</label>
              <span className={`status-badge status-${driver.status}`}>
                {driver.status === 'active' ? 'Faol' : 
                 driver.status === 'blocked' ? 'Bloklangan' : 
                 'O\'chirish kutilmoqda'}
              </span>
            </div>
            <div className="detail-item">
              <label>Ro'yxatdan o'tish bosqichi</label>
              <span className={`step-badge step-${profile?.registration_step || 'none'}`}>
                {getRegistrationStepLabel(profile?.registration_step)}
              </span>
            </div>
            <div className="detail-item">
              <label>To'liq</label>
              <span className={profile?.is_complete ? 'complete' : 'incomplete'}>
                {profile?.is_complete ? 'Ha' : 'Yo\'q'}
              </span>
            </div>
            <div className="detail-item">
              <label>Ro'yxatdan o'tgan</label>
              <span>{new Date(driver.created_at).toLocaleString('uz-UZ')}</span>
            </div>
          </div>
        </section>

        {/* Driver Profile - Personal Information */}
        {profile && (
          <section className="detail-section">
            <h2>Shaxsiy Ma'lumotlar</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Ism</label>
                <span>{profile.first_name || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Familiya</label>
                <span>{profile.last_name || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Otasining ismi</label>
                <span>{profile.father_name || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Jins</label>
                <span>{profile.gender === 'male' ? 'Erkak' : 
                       profile.gender === 'female' ? 'Ayol' : '-'}</span>
              </div>
              <div className="detail-item">
                <label>Tug'ilgan sana</label>
                <span>{profile.birth_date ? 
                       new Date(profile.birth_date).toLocaleDateString('uz-UZ') : '-'}</span>
              </div>
              <div className="detail-item">
                <label>Email</label>
                <span>{profile.email || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Transport egasi</label>
                <span>{profile.vehicle_owner_type === 'own' ? 'O\'zi' : 
                       profile.vehicle_owner_type === 'other_person' ? 'Boshqa shaxs' : 
                       profile.vehicle_owner_type === 'company' ? 'Kompaniya' : '-'}</span>
              </div>
              <div className="detail-item">
                <label>Transportdan foydalanish</label>
                <span>{profile.vehicle_usage_type === 'rent' ? 'Ijaraga' : 
                       profile.vehicle_usage_type === 'free_use' ? 'Bepul foydalanish' : '-'}</span>
              </div>
            </div>

            {/* Address */}
            {(profile.address_country || profile.address_region || profile.address_city) && (
              <div className="address-section">
                <h3>Manzil</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Davlat</label>
                    <span>{profile.address_country || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Viloyat</label>
                    <span>{profile.address_region || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Shahar</label>
                    <span>{profile.address_city || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Turar joy turi</label>
                    <span>{profile.address_settlement_type || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Mahalla</label>
                    <span>{profile.address_mahalla || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Ko'cha</label>
                    <span>{profile.address_street || '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Photos */}
            {(profile.photo_face_url || profile.photo_body_url) && (
              <div className="photos-section">
                <h3>Rasmlar</h3>
                <div className="photos-grid">
                  {profile.photo_face_url && (
                    <div className="photo-item">
                      <label>Yuz rasmi</label>
                      <img src={profile.photo_face_url} alt="Yuz" />
                    </div>
                  )}
                  {profile.photo_body_url && (
                    <div className="photo-item">
                      <label>Tana rasmi</label>
                      <img src={profile.photo_body_url} alt="Tana" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Passport Information */}
        {profile?.passport && (
          <section className="detail-section">
            <h2>Pasport Ma'lumotlari</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Ism</label>
                <span>{profile.passport.first_name || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Familiya</label>
                <span>{profile.passport.last_name || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Otasining ismi</label>
                <span>{profile.passport.father_name || '-'}</span>
              </div>
              <div className="detail-item">
                <label>ID karta raqami</label>
                <span>{profile.passport.id_card_number || '-'}</span>
              </div>
              <div className="detail-item">
                <label>PINFL</label>
                <span>{profile.passport.pinfl || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Berilgan sana</label>
                <span>{profile.passport.issue_date ? 
                       new Date(profile.passport.issue_date).toLocaleDateString('uz-UZ') : '-'}</span>
              </div>
              <div className="detail-item">
                <label>Amal qilish muddati</label>
                <span>{profile.passport.expiry_date ? 
                       new Date(profile.passport.expiry_date).toLocaleDateString('uz-UZ') : '-'}</span>
              </div>
              <div className="detail-item">
                <label>Fuqarolik</label>
                <span>{profile.passport.citizenship || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Tug'ilgan joy (Davlat)</label>
                <span>{profile.passport.birth_place_country || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Tug'ilgan joy (Viloyat)</label>
                <span>{profile.passport.birth_place_region || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Tug'ilgan joy (Shahar)</label>
                <span>{profile.passport.birth_place_city || '-'}</span>
              </div>
            </div>
            {(profile.passport.passport_front_url || profile.passport.passport_back_url) && (
              <div className="photos-section">
                <h3>Pasport rasmlari</h3>
                <div className="photos-grid">
                  {profile.passport.passport_front_url && (
                    <div className="photo-item">
                      <label>Old tomoni</label>
                      <img src={profile.passport.passport_front_url} alt="Pasport old" />
                    </div>
                  )}
                  {profile.passport.passport_back_url && (
                    <div className="photo-item">
                      <label>Orqa tomoni</label>
                      <img src={profile.passport.passport_back_url} alt="Pasport orqa" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Driver License */}
        {profile?.license && (
          <section className="detail-section">
            <h2>Haydovchilik Guvohnomasi</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Guvohnoma raqami</label>
                <span>{profile.license.license_number || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Berilgan sana</label>
                <span>{profile.license.issue_date ? 
                       new Date(profile.license.issue_date).toLocaleDateString('uz-UZ') : '-'}</span>
              </div>
              <div className="detail-item">
                <label>Kategoriya A</label>
                <span>{profile.license.category_a ? 
                       new Date(profile.license.category_a).toLocaleDateString('uz-UZ') : '-'}</span>
              </div>
              <div className="detail-item">
                <label>Kategoriya B</label>
                <span>{profile.license.category_b ? 
                       new Date(profile.license.category_b).toLocaleDateString('uz-UZ') : '-'}</span>
              </div>
              <div className="detail-item">
                <label>Kategoriya C</label>
                <span>{profile.license.category_c ? 
                       new Date(profile.license.category_c).toLocaleDateString('uz-UZ') : '-'}</span>
              </div>
              <div className="detail-item">
                <label>Kategoriya D</label>
                <span>{profile.license.category_d ? 
                       new Date(profile.license.category_d).toLocaleDateString('uz-UZ') : '-'}</span>
              </div>
            </div>
            {(profile.license.license_front_url || profile.license.license_back_url) && (
              <div className="photos-section">
                <h3>Guvohnoma rasmlari</h3>
                <div className="photos-grid">
                  {profile.license.license_front_url && (
                    <div className="photo-item">
                      <label>Old tomoni</label>
                      <img src={profile.license.license_front_url} alt="Guvohnoma old" />
                    </div>
                  )}
                  {profile.license.license_back_url && (
                    <div className="photo-item">
                      <label>Orqa tomoni</label>
                      <img src={profile.license.license_back_url} alt="Guvohnoma orqa" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Emergency Contacts */}
        {profile?.emergencyContacts && profile.emergencyContacts.length > 0 && (
          <section className="detail-section">
            <h2>Favqulodda Aloqa</h2>
            <div className="contacts-list">
              {profile.emergencyContacts.map((contact) => (
                <div key={contact.id} className="contact-item">
                  <div className="contact-info">
                    <span className="contact-relationship">{contact.relationship || 'Noma\'lum'}</span>
                    <span className="contact-phone">
                      {contact.phone_country_code && contact.phone_number
                        ? `${contact.phone_country_code} ${contact.phone_number}`
                        : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Vehicle Information */}
        {profile?.vehicle && (
          <section className="detail-section">
            <h2>Transport Vositası</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Transport turi</label>
                <span>{profile.vehicle.vehicle_type === 'light' ? 'Yengil' : 
                       profile.vehicle.vehicle_type === 'cargo' ? 'Yuk' : '-'}</span>
              </div>
              <div className="detail-item">
                <label>Kuzov turi</label>
                <span>{profile.vehicle.body_type || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Marka</label>
                <span>{profile.vehicle.make || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Model</label>
                <span>{profile.vehicle.model || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Rang</label>
                <span>{profile.vehicle.color || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Davlat raqami</label>
                <span>{profile.vehicle.license_plate || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Ishlab chiqarilgan yili</label>
                <span>{profile.vehicle.year || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Yuk ko'tarish (kg)</label>
                <span>{profile.vehicle.gross_weight || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Bo'sh og'irlik (kg)</label>
                <span>{profile.vehicle.unladen_weight || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Yoqilg'i turlari</label>
                <span>{profile.vehicle.fuel_types?.join(', ') || '-'}</span>
              </div>
              <div className="detail-item">
                <label>O'rindiqlar soni</label>
                <span>{profile.vehicle.seating_capacity || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Texnik pasport seriyasi</label>
                <span>{profile.vehicle.tech_passport_series || '-'}</span>
              </div>
            </div>

            {/* Vehicle Owner Information */}
            {(profile.vehicle.owner_first_name || profile.vehicle.company_name) && (
              <div className="owner-section">
                <h3>{profile.vehicle.company_name ? 'Kompaniya' : 'Egasi'} Ma'lumotlari</h3>
                <div className="detail-grid">
                  {profile.vehicle.company_name && (
                    <>
                      <div className="detail-item">
                        <label>Kompaniya nomi</label>
                        <span>{profile.vehicle.company_name}</span>
                      </div>
                      <div className="detail-item">
                        <label>INN</label>
                        <span>{profile.vehicle.company_tax_id || '-'}</span>
                      </div>
                    </>
                  )}
                  {profile.vehicle.owner_first_name && (
                    <>
                      <div className="detail-item">
                        <label>Ism</label>
                        <span>{profile.vehicle.owner_first_name}</span>
                      </div>
                      <div className="detail-item">
                        <label>Familiya</label>
                        <span>{profile.vehicle.owner_last_name || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Otasining ismi</label>
                        <span>{profile.vehicle.owner_father_name || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <label>PINFL</label>
                        <span>{profile.vehicle.owner_pinfl || '-'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Vehicle Photos */}
            {(profile.vehicle.photo_front_url || profile.vehicle.photo_back_url || 
              profile.vehicle.photo_right_url || profile.vehicle.photo_left_url) && (
              <div className="photos-section">
                <h3>Transport rasmlari</h3>
                <div className="photos-grid">
                  {profile.vehicle.photo_front_url && (
                    <div className="photo-item">
                      <label>Old</label>
                      <img src={profile.vehicle.photo_front_url} alt="Old" />
                    </div>
                  )}
                  {profile.vehicle.photo_back_url && (
                    <div className="photo-item">
                      <label>Orqa</label>
                      <img src={profile.vehicle.photo_back_url} alt="Orqa" />
                    </div>
                  )}
                  {profile.vehicle.photo_right_url && (
                    <div className="photo-item">
                      <label>O'ng</label>
                      <img src={profile.vehicle.photo_right_url} alt="O'ng" />
                    </div>
                  )}
                  {profile.vehicle.photo_left_url && (
                    <div className="photo-item">
                      <label>Chap</label>
                      <img src={profile.vehicle.photo_left_url} alt="Chap" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Taxi License */}
        {profile?.taxiLicense && (
          <section className="detail-section">
            <h2>Taksi Litsenziyasi</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Litsenziya raqami</label>
                <span>{profile.taxiLicense.license_number || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Berilgan sana</label>
                <span>{profile.taxiLicense.license_issue_date ? 
                       new Date(profile.taxiLicense.license_issue_date).toLocaleDateString('uz-UZ') : '-'}</span>
              </div>
              <div className="detail-item">
                <label>Ro'yxat raqami</label>
                <span>{profile.taxiLicense.license_registry_number || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Varaqa raqami</label>
                <span>{profile.taxiLicense.license_sheet_number || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Varaqa amal qilish (dan)</label>
                <span>{profile.taxiLicense.license_sheet_valid_from ? 
                       new Date(profile.taxiLicense.license_sheet_valid_from).toLocaleDateString('uz-UZ') : '-'}</span>
              </div>
              <div className="detail-item">
                <label>Varaqa amal qilish (gacha)</label>
                <span>{profile.taxiLicense.license_sheet_valid_until ? 
                       new Date(profile.taxiLicense.license_sheet_valid_until).toLocaleDateString('uz-UZ') : '-'}</span>
              </div>
              <div className="detail-item">
                <label>Yakka tartibdagi tadbirkorlik raqami</label>
                <span>{profile.taxiLicense.self_employment_number || '-'}</span>
              </div>
            </div>
          </section>
        )}

        {/* Phones */}
        {driver.phones && driver.phones.length > 0 && (
          <section className="detail-section">
            <h2>Telefon Raqamlari</h2>
            <div className="phones-list">
              {driver.phones.map((phone) => (
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

        {/* SSO Identities */}
        {driver.identities && driver.identities.length > 0 && (
          <section className="detail-section">
            <h2>SSO Hisoblar</h2>
            <div className="identities-list">
              {driver.identities.map((identity) => (
                <div key={identity.id} className="identity-item">
                  <span className="identity-provider">{identity.provider}</span>
                  <span className="identity-uid">{identity.provider_uid}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

