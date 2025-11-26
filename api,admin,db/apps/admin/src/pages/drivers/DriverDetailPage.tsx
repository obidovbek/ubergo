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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  const handleStatusChange = async (newStatus: 'active' | 'blocked' | 'pending_delete') => {
    if (!token || !id || !driver) return;
    
    const statusText = {
      active: 'faollashtirish',
      blocked: 'bloklash',
      pending_delete: 'o\'chirish kutilmoqda holatiga o\'tkazish'
    }[newStatus];
    
    if (!confirm(`Bu haydovchini ${statusText}ni xohlaysizmi?`)) return;

    try {
      const updatedDriver = await driversApi.updateDriverStatus(token, id, newStatus);
      setDriver(updatedDriver);
      alert('Status muvaffaqiyatli yangilandi');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Status yangilashda xatolik');
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className={`status-badge status-${driver.status}`}>
                  {driver.status === 'active' ? 'Faol' : 
                   driver.status === 'blocked' ? 'Bloklangan' : 
                   'O\'chirish kutilmoqda'}
                </span>
                <select
                  value={driver.status}
                  onChange={(e) => handleStatusChange(e.target.value as 'active' | 'blocked' | 'pending_delete')}
                  className="status-select"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="active">Faol</option>
                  <option value="blocked">Bloklangan</option>
                  <option value="pending_delete">O'chirish kutilmoqda</option>
                </select>
              </div>
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
            {(
              profile.addressCountry ||
              profile.addressProvince ||
              profile.addressCityDistrict ||
              profile.addressAdministrativeArea ||
              profile.addressSettlement ||
              profile.addressNeighborhood ||
              profile.address_street
            ) && (
              <div className="address-section">
                <h3>Manzil</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Davlat</label>
                    <span>{profile.addressCountry?.name || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Viloyat</label>
                    <span>{profile.addressProvince?.name || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Shahar</label>
                    <span>{profile.addressCityDistrict?.name || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Ma'muriy hudud</label>
                    <span>{profile.addressAdministrativeArea?.name || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Turar joy turi</label>
                    <span>
                      {profile.addressSettlement
                        ? `${profile.addressSettlement.name}${
                            profile.addressSettlement.type ? ` (${profile.addressSettlement.type})` : ''
                          }`
                        : '-'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Mahalla</label>
                    <span>{profile.addressNeighborhood?.name || '-'}</span>
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
                      <img 
                        src={profile.photo_face_url} 
                        alt="Yuz" 
                        onClick={() => setSelectedImage(profile.photo_face_url || null)}
                      />
                    </div>
                  )}
                  {profile.photo_body_url && (
                    <div className="photo-item">
                      <label>Tana rasmi</label>
                      <img 
                        src={profile.photo_body_url} 
                        alt="Tana" 
                        onClick={() => setSelectedImage(profile.photo_body_url || null)}
                      />
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
                      <img 
                        src={profile.passport.passport_front_url} 
                        alt="Pasport old" 
                        onClick={() => setSelectedImage(profile.passport?.passport_front_url || null)}
                      />
                    </div>
                  )}
                  {profile.passport.passport_back_url && (
                    <div className="photo-item">
                      <label>Orqa tomoni</label>
                      <img 
                        src={profile.passport.passport_back_url} 
                        alt="Pasport orqa" 
                        onClick={() => setSelectedImage(profile.passport?.passport_back_url || null)}
                      />
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
                      <img 
                        src={profile.license.license_front_url} 
                        alt="Guvohnoma old" 
                        onClick={() => setSelectedImage(profile.license?.license_front_url || null)}
                      />
                    </div>
                  )}
                  {profile.license.license_back_url && (
                    <div className="photo-item">
                      <label>Orqa tomoni</label>
                      <img 
                        src={profile.license.license_back_url} 
                        alt="Guvohnoma orqa" 
                        onClick={() => setSelectedImage(profile.license?.license_back_url || null)}
                      />
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

            {/* Vehicle Tech Passport Photos */}
            {(profile.vehicle.tech_passport_front_url || profile.vehicle.tech_passport_back_url) && (
              <div className="photos-section">
                <h3>Texnik pasport rasmlari</h3>
                <div className="photos-grid">
                  {profile.vehicle.tech_passport_front_url && (
                    <div className="photo-item">
                      <label>Texnik pasport old tomoni</label>
                      <img 
                        src={profile.vehicle.tech_passport_front_url} 
                        alt="Texnik pasport old" 
                        onClick={() => setSelectedImage(profile.vehicle?.tech_passport_front_url || null)}
                      />
                    </div>
                  )}
                  {profile.vehicle.tech_passport_back_url && (
                    <div className="photo-item">
                      <label>Texnik pasport orqa tomoni</label>
                      <img 
                        src={profile.vehicle.tech_passport_back_url} 
                        alt="Texnik pasport orqa" 
                        onClick={() => setSelectedImage(profile.vehicle?.tech_passport_back_url || null)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vehicle Photos */}
            {(profile.vehicle.photo_front_url || profile.vehicle.photo_back_url || 
              profile.vehicle.photo_right_url || profile.vehicle.photo_left_url ||
              profile.vehicle.photo_angle_45_url || profile.vehicle.photo_interior_url) && (
              <div className="photos-section">
                <h3>Transport rasmlari</h3>
                <div className="photos-grid">
                  {profile.vehicle.photo_front_url && (
                    <div className="photo-item">
                      <label>Old tomoni</label>
                      <img 
                        src={profile.vehicle.photo_front_url} 
                        alt="Old" 
                        onClick={() => setSelectedImage(profile.vehicle?.photo_front_url || null)}
                      />
                    </div>
                  )}
                  {profile.vehicle.photo_back_url && (
                    <div className="photo-item">
                      <label>Orqa tomoni</label>
                      <img 
                        src={profile.vehicle.photo_back_url} 
                        alt="Orqa" 
                        onClick={() => setSelectedImage(profile.vehicle?.photo_back_url || null)}
                      />
                    </div>
                  )}
                  {profile.vehicle.photo_right_url && (
                    <div className="photo-item">
                      <label>O'ng tomoni</label>
                      <img 
                        src={profile.vehicle.photo_right_url} 
                        alt="O'ng" 
                        onClick={() => setSelectedImage(profile.vehicle?.photo_right_url || null)}
                      />
                    </div>
                  )}
                  {profile.vehicle.photo_left_url && (
                    <div className="photo-item">
                      <label>Chap tomoni</label>
                      <img 
                        src={profile.vehicle.photo_left_url} 
                        alt="Chap" 
                        onClick={() => setSelectedImage(profile.vehicle?.photo_left_url || null)}
                      />
                    </div>
                  )}
                  {profile.vehicle.photo_angle_45_url && (
                    <div className="photo-item">
                      <label>45° burchak ko'rinishi</label>
                      <img 
                        src={profile.vehicle.photo_angle_45_url} 
                        alt="45° burchak" 
                        onClick={() => setSelectedImage(profile.vehicle?.photo_angle_45_url || null)}
                      />
                    </div>
                  )}
                  {profile.vehicle.photo_interior_url && (
                    <div className="photo-item">
                      <label>Salon rasmi</label>
                      <img 
                        src={profile.vehicle.photo_interior_url} 
                        alt="Salon" 
                        onClick={() => setSelectedImage(profile.vehicle?.photo_interior_url || null)}
                      />
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

            {/* Taxi License Documents */}
            {(profile.taxiLicense.license_document_url || 
              profile.taxiLicense.license_sheet_document_url || 
              profile.taxiLicense.self_employment_document_url ||
              profile.taxiLicense.power_of_attorney_document_url ||
              profile.taxiLicense.insurance_document_url) && (
              <div className="photos-section">
                <h3>Taksi litsenziya hujjatlari</h3>
                <div className="photos-grid">
                  {profile.taxiLicense.license_document_url && (
                    <div className="photo-item">
                      <label>Litsenziya hujjati</label>
                      <img 
                        src={profile.taxiLicense.license_document_url} 
                        alt="Litsenziya hujjati" 
                        onClick={() => setSelectedImage(profile.taxiLicense?.license_document_url || null)}
                      />
                    </div>
                  )}
                  {profile.taxiLicense.license_sheet_document_url && (
                    <div className="photo-item">
                      <label>Litsenziya varaqasi hujjati</label>
                      <img 
                        src={profile.taxiLicense.license_sheet_document_url} 
                        alt="Litsenziya varaqasi" 
                        onClick={() => setSelectedImage(profile.taxiLicense?.license_sheet_document_url || null)}
                      />
                    </div>
                  )}
                  {profile.taxiLicense.self_employment_document_url && (
                    <div className="photo-item">
                      <label>O'zini o'zi band qilish hujjati</label>
                      <img 
                        src={profile.taxiLicense.self_employment_document_url} 
                        alt="O'zini o'zi band qilish" 
                        onClick={() => setSelectedImage(profile.taxiLicense?.self_employment_document_url || null)}
                      />
                    </div>
                  )}
                  {profile.taxiLicense.power_of_attorney_document_url && (
                    <div className="photo-item">
                      <label>Ishonchnoma hujjati</label>
                      <img 
                        src={profile.taxiLicense.power_of_attorney_document_url} 
                        alt="Ishonchnoma" 
                        onClick={() => setSelectedImage(profile.taxiLicense?.power_of_attorney_document_url || null)}
                      />
                    </div>
                  )}
                  {profile.taxiLicense.insurance_document_url && (
                    <div className="photo-item">
                      <label>Sugurta hujjati</label>
                      <img 
                        src={profile.taxiLicense.insurance_document_url} 
                        alt="Sugurta" 
                        onClick={() => setSelectedImage(profile.taxiLicense?.insurance_document_url || null)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
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

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div 
          className="image-lightbox"
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            cursor: 'pointer',
            padding: '20px'
          }}
        >
          <img 
            src={selectedImage} 
            alt="Kattalashtirilgan rasm"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '4px'
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setSelectedImage(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: '#fff',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

