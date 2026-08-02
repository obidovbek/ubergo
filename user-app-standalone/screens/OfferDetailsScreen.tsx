/**
 * Offer Details Screen
 * Shows detailed information about an offer and allows joining
 * Redesigned with modern, clean UI
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as OffersAPI from '../api/offers';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { formatNumberWithSpaces } from '../utils/format';
import { formatDate } from '../utils/date';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showToast } from '../utils/toast';
import { showConfirmDialog } from '../utils/confirmDialog';
import { getErrorMessage } from '../utils/errorHandler';

export default function OfferDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const insets = useSafeAreaInsets();
  const { offerId } = route.params as { offerId: number };

  const [offer, setOffer] = useState<OffersAPI.DriverOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [seatsRequested, setSeatsRequested] = useState(1);
  const [message, setMessage] = useState('');
  
  // Additional booking options
  const [wantFrontSeat, setWantFrontSeat] = useState(false);
  const [haveLargeBaggage, setHaveLargeBaggage] = useState(false);
  const [havePets, setHavePets] = useState(false);

  useEffect(() => {
    loadOffer();
  }, [offerId]);

  const loadOffer = async () => {
    try {
      setLoading(true);
      const data = await OffersAPI.getOfferDetails(offerId);
      // Defensive: an empty offer used to reach the render as `null` and draw a blank
      // screen with no way back. Routing it through the catch below gives the passenger
      // a toast and a goBack() instead. (The API answering an unavailable offer with
      // HTTP 200 + offer:null is fixed server-side too — this is the second layer.)
      if (!data) {
        throw new Error(t('errors.notFound'));
      }
      setOffer(data);
    } catch (error: any) {
      const errorMsg = getErrorMessage(error, t, 'errors.loadFailed');
      showToast.error(t('common.error'), errorMsg);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!token) {
      showToast.error(t('offerDetails.loginRequired'), t('offerDetails.loginRequiredMessage'));
      return;
    }

    if (!offer) return;

    if (seatsRequested > offer.seats_free) {
      const message = t('offerDetails.onlySeatsAvailable').replace('{count}', offer.seats_free.toString());
      showToast.error(t('common.error'), message);
      return;
    }

    // Build custom message with options
    let fullMessage = message;
    const options = [];
    if (wantFrontSeat) options.push(`🪑 ${t('offerDetails.preferFrontSeat')}`);
    if (haveLargeBaggage) options.push(`🧳 ${t('offerDetails.haveLargeBaggage')}`);
    if (havePets) options.push(`🐕 ${t('offerDetails.travelingWithPet')}`);
    
    if (options.length > 0) {
      const optionsText = options.join(', ');
      fullMessage = fullMessage 
        ? `${fullMessage}\n\n${optionsText}` 
        : optionsText;
    }

    // Calculate price for confirmation
    // Front seat premium only applies to 1 seat (there's only one front seat)
    let confirmTotalPrice: number;
    if (wantFrontSeat && offer.front_price_per_seat) {
      // Front seat selected: 1 front seat + (seatsRequested - 1) regular seats
      const frontSeatPremium = offer.front_price_per_seat - offer.price_per_seat;
      confirmTotalPrice = (offer.price_per_seat * seatsRequested) + frontSeatPremium;
    } else {
      // No front seat: regular price for all seats
      confirmTotalPrice = offer.price_per_seat * seatsRequested;
    }
    
    let priceInfo: string;
    if (wantFrontSeat && offer.front_price_per_seat) {
      const frontSeatPremium = offer.front_price_per_seat - offer.price_per_seat;
      if (seatsRequested === 1) {
        priceInfo = `${formatNumberWithSpaces(offer.front_price_per_seat)} ${offer.currency} ${t('offerDetails.frontSeatPerSeat') || 'oldingi o\'rin uchun'}`;
      } else {
        priceInfo = `${formatNumberWithSpaces(offer.price_per_seat)} ${offer.currency} × ${seatsRequested} + ${formatNumberWithSpaces(frontSeatPremium)} ${offer.currency} (oldingi o'rin)`;
      }
    } else {
      priceInfo = `${formatNumberWithSpaces(offer.price_per_seat)} ${offer.currency} ${t('searchOffers.perSeat')}`;
    }
    
    const seatsText = seatsRequested === 1 ? t('searchOffers.seat') : t('searchOffers.seats');
    let confirmMessage = t('offerDetails.confirmJoinMessage');
    confirmMessage = confirmMessage.replace('{seats}', seatsRequested.toString());
    confirmMessage = confirmMessage.replace('{price}', formatNumberWithSpaces(confirmTotalPrice));
    confirmMessage = confirmMessage.replace('{currency}', offer.currency);
    confirmMessage = confirmMessage.replace('{plural}', seatsRequested > 1 ? 's' : '');
    
    showConfirmDialog({
      title: t('offerDetails.confirmJoin'),
      message: `${confirmMessage}\n\n${priceInfo}`,
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        try {
          setJoining(true);
          await OffersAPI.joinOffer(token, offerId, {
            seats_requested: seatsRequested,
            is_front_seat: wantFrontSeat, // Front seat can be selected with multiple seats
            message: fullMessage || undefined,
          });
          showToast.success(
            t('offerDetails.joinSuccess'),
            t('offerDetails.joinSuccessMessage')
          );
          setTimeout(() => {
            navigation.goBack();
            (navigation as any).navigate('MyBookings');
          }, 1500);
        } catch (error: any) {
          const errorMsg = getErrorMessage(error, t, 'errors.unknown');
          showToast.error(t('common.error'), errorMsg);
        } finally {
          setJoining(false);
        }
      },
      onCancel: () => {},
    });
  };

  const formatOfferDate = (dateString: string) => {
    return formatDate(dateString, 'long', currentLanguage);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>{t('offerDetails.loadingDetails')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!offer) {
    return null;
  }

  // Calculate total price based on front seat selection
  // Front seat premium only applies to 1 seat (there's only one front seat)
  let totalPrice: number;
  if (wantFrontSeat && offer.front_price_per_seat) {
    // Front seat selected: 1 front seat + (seatsRequested - 1) regular seats
    const frontSeatPremium = offer.front_price_per_seat - offer.price_per_seat;
    totalPrice = (offer.price_per_seat * seatsRequested) + frontSeatPremium;
  } else {
    // No front seat: regular price for all seats
    totalPrice = offer.price_per_seat * seatsRequested;
  }
  
  // Check if front seat pricing is available
  // Prices come back from the API as DECIMAL strings (pg returns numeric as a string),
  // so `>` between them was lexicographic: "12000.00" > "5000.00" evaluated to FALSE.
  // That hid the front-seat price banner, the premium and the breakdown for the common
  // case (front price with more digits than the base) while the server charged the
  // premium anyway — OfferPassengerService decides on truthiness, not on this test.
  const hasFrontSeatPricing =
    offer.front_price_per_seat != null &&
    Number(offer.front_price_per_seat) > Number(offer.price_per_seat);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('offerDetails.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Route Card */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.routeDot} />
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>{t('offerDetails.from')}</Text>
              <Text style={styles.routeText}>{offer.from_text}</Text>
            </View>
          </View>
          
          <View style={styles.routeConnector}>
            <View style={styles.routeLine} />
            <View style={styles.routeArrowContainer}>
              <Ionicons name="arrow-down" size={20} color="#10B981" />
            </View>
          </View>
          
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: '#3B82F6' }]} />
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>{t('offerDetails.to')}</Text>
              <Text style={styles.routeText}>{offer.to_text}</Text>
            </View>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <View style={[styles.infoIconContainer, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="calendar" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.infoLabel}>{t('offerDetails.departure')}</Text>
            <Text style={styles.infoValue}>{formatOfferDate(offer.start_at)}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <View style={[styles.infoIconContainer, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="people" size={24} color="#10B981" />
            </View>
            <Text style={styles.infoLabel}>{t('offerDetails.available')}</Text>
            <Text style={styles.infoValue}>
              {offer.seats_free}/{offer.seats_total}
            </Text>
          </View>
        </View>

        {/* Price Card */}
        <View style={styles.priceCard}>
          <View style={styles.priceIconContainer}>
            <Ionicons name="cash" size={24} color="#10B981" />
          </View>
          <View style={styles.priceContent}>
            <Text style={styles.priceLabel}>{t('offerDetails.pricePerSeat')}</Text>
            <Text style={styles.priceValue}>
              {formatNumberWithSpaces(offer.price_per_seat)} {offer.currency}
            </Text>
            {hasFrontSeatPricing && (
              <View style={styles.frontSeatPriceInfo}>
                <Ionicons name="information-circle-outline" size={14} color="#3B82F6" />
                <Text style={styles.frontSeatPriceText}>
                  {t('offerDetails.frontSeatInfo').replace('{price}', formatNumberWithSpaces(offer.front_price_per_seat!)).replace('{currency}', offer.currency)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Driver & Vehicle Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>{t('offerDetails.driverVehicle')}</Text>
          
          <View style={styles.detailItem}>
            <View style={[styles.detailIconBox, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="person" size={20} color="#3B82F6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('offerDetails.driver')}</Text>
              <Text style={styles.detailText}>
                {offer.driver?.name || t('offerDetails.unknownDriver')}
              </Text>
              
              {/* Driver Rating - Always Show */}
              {offer.driver && (
                <View style={styles.ratingContainer}>
                  <View style={styles.ratingStarsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={
                          star <= Math.round(offer.driver?.rating || 0)
                            ? 'star'
                            : 'star-outline'
                        }
                        size={16}
                        color="#F59E0B"
                        style={styles.ratingStarIcon}
                      />
                    ))}
                  </View>
                  <Text style={styles.ratingText}>
                    {offer.driver.rating ? offer.driver.rating.toFixed(1) : '0.0'}
                  </Text>
                  {offer.driver.rating_count ? (
                    <Text style={styles.ratingCount}>
                      ({offer.driver.rating_count} {offer.driver.rating_count === 1 ? t('offerDetails.review') : t('offerDetails.reviews')})
                    </Text>
                  ) : (
                    <Text style={styles.ratingCountNew}>{t('offerDetails.newDriver')}</Text>
                  )}
                </View>
              )}
            </View>
          </View>
          
          {offer.vehicle && (
            <View style={styles.detailItem}>
              <View style={[styles.detailIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="car-sport" size={20} color="#F59E0B" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('offerDetails.vehicle')}</Text>
                <Text style={styles.detailText}>
                  {offer.vehicle.make} {offer.vehicle.model}
                  {offer.vehicle.year ? ` (${offer.vehicle.year})` : ''}
                </Text>
                {(offer.vehicle.color || offer.vehicle.license_plate) && (
                  <Text style={styles.detailSubtext}>
                    {offer.vehicle.color}
                    {offer.vehicle.license_plate ? ` • ${offer.vehicle.license_plate}` : ''}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Note from Driver */}
        {offer.note && (
          <View style={styles.noteCard}>
            <View style={styles.noteHeader}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#10B981" />
              <Text style={styles.noteTitle}>{t('offerDetails.noteFromDriver')}</Text>
            </View>
            <Text style={styles.noteText}>{offer.note}</Text>
          </View>
        )}

        {/* Seat Selection Card */}
        <View style={styles.seatCard}>
          <Text style={styles.cardTitle}>{t('offerDetails.selectSeats')}</Text>
          
          <View style={styles.seatSelector}>
            <TouchableOpacity
              style={[styles.seatButton, seatsRequested <= 1 && styles.seatButtonDisabled]}
              onPress={() => setSeatsRequested(Math.max(1, seatsRequested - 1))}
              disabled={seatsRequested <= 1}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="remove-circle" 
                size={40} 
                color={seatsRequested <= 1 ? '#D1D5DB' : '#10B981'} 
              />
            </TouchableOpacity>
            
            <View style={styles.seatCountContainer}>
              <Text style={styles.seatCount}>{seatsRequested}</Text>
              <Text style={styles.seatCountLabel}>
                {seatsRequested === 1 ? t('searchOffers.seat') : t('searchOffers.seats')}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.seatButton,
                seatsRequested >= offer.seats_free && styles.seatButtonDisabled,
              ]}
              onPress={() => setSeatsRequested(Math.min(offer.seats_free, seatsRequested + 1))}
              disabled={seatsRequested >= offer.seats_free}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add-circle"
                size={40}
                color={seatsRequested >= offer.seats_free ? '#D1D5DB' : '#10B981'}
              />
            </TouchableOpacity>
          </View>

          {/* Booking Options */}
          <View style={styles.optionsContainer}>
            <Text style={styles.optionsTitle}>{t('offerDetails.preferences')}</Text>
            
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => setWantFrontSeat(!wantFrontSeat)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="car-sport" size={20} color="#3B82F6" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionText}>
                    {t('offerDetails.preferFrontSeat')}
                    {seatsRequested > 1 && ' (faqat 1 o\'rin uchun qo\'shimcha narx)'}
                  </Text>
                  {hasFrontSeatPricing && (
                    <Text style={styles.optionPriceText}>
                      {t('offerDetails.frontSeatPremium').replace('{premium}', formatNumberWithSpaces(offer.front_price_per_seat! - offer.price_per_seat)).replace('{currency}', offer.currency)}
                    </Text>
                  )}
                </View>
              </View>
              <View style={[styles.checkbox, wantFrontSeat && styles.checkboxActive]}>
                {wantFrontSeat && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => setHaveLargeBaggage(!haveLargeBaggage)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="briefcase" size={20} color="#F59E0B" />
                </View>
                <Text style={styles.optionText}>{t('offerDetails.haveLargeBaggage')}</Text>
              </View>
              <View style={[styles.checkbox, haveLargeBaggage && styles.checkboxActive]}>
                {haveLargeBaggage && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => setHavePets(!havePets)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="paw" size={20} color="#EF4444" />
                </View>
                <Text style={styles.optionText}>{t('offerDetails.travelingWithPet')}</Text>
              </View>
              <View style={[styles.checkbox, havePets && styles.checkboxActive]}>
                {havePets && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
              </View>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.messageInput}
            placeholder={t('offerDetails.messagePlaceholder')}
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
        <View style={styles.footerContent}>
          {wantFrontSeat && hasFrontSeatPricing && (
            <View style={styles.priceBreakdown}>
              {seatsRequested === 1 ? (
                // Single seat with front seat: show front seat price only
                <View style={styles.priceBreakdownRow}>
                  <Text style={styles.priceBreakdownLabel}>
                    {t('offerDetails.frontSeatPerSeat') || 'Oldingi o\'rin'}
                  </Text>
                  <Text style={styles.priceBreakdownValue}>
                    {formatNumberWithSpaces(offer.front_price_per_seat!)} {offer.currency}
                  </Text>
                </View>
              ) : (
                // Multiple seats with front seat: show breakdown
                <>
                  <View style={styles.priceBreakdownRow}>
                    <Text style={styles.priceBreakdownLabel}>
                      {t('offerDetails.priceBreakdownBase')?.replace('{seats}', seatsRequested.toString()).replace('{price}', formatNumberWithSpaces(offer.price_per_seat)).replace('{currency}', offer.currency) || `${seatsRequested} o'rin × ${formatNumberWithSpaces(offer.price_per_seat)} ${offer.currency}`}
                    </Text>
                    <Text style={styles.priceBreakdownValue}>
                      {formatNumberWithSpaces(offer.price_per_seat * seatsRequested)} {offer.currency}
                    </Text>
                  </View>
                  <View style={styles.priceBreakdownRow}>
                    <Text style={styles.priceBreakdownLabel}>
                      {t('offerDetails.priceBreakdownPremium')?.replace('{seats}', '1').replace('{premium}', formatNumberWithSpaces(offer.front_price_per_seat! - offer.price_per_seat)).replace('{currency}', offer.currency) || `1 oldingi o'rin qo'shimcha: +${formatNumberWithSpaces(offer.front_price_per_seat! - offer.price_per_seat)} ${offer.currency}`}
                    </Text>
                    <Text style={styles.priceBreakdownValue}>
                      {formatNumberWithSpaces(offer.front_price_per_seat! - offer.price_per_seat)} {offer.currency}
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>{t('offerDetails.totalPrice')}</Text>
            <Text style={styles.totalPrice}>
              {formatNumberWithSpaces(totalPrice)} {offer.currency}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.joinButton, joining && styles.joinButtonDisabled]}
            onPress={handleJoin}
            disabled={joining}
            activeOpacity={0.8}
          >
            {joining ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                <Text style={styles.joinButtonText}>{t('offerDetails.requestToJoin')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    paddingBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    marginRight: 16,
  },
  routeContent: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  routeText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 24,
  },
  routeConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    marginVertical: 12,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  routeArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
    textAlign: 'center',
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  priceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  priceContent: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  frontSeatPriceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
    backgroundColor: '#DBEAFE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  frontSeatPriceText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
    paddingTop: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    lineHeight: 22,
  },
  detailSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  ratingStarsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingStarIcon: {
    marginRight: 0,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D97706',
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
    marginLeft: 6,
  },
  ratingCountNew: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  noteCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  noteText: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    fontWeight: '500',
  },
  seatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  seatSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  seatButton: {
    padding: 8,
  },
  seatButtonDisabled: {
    opacity: 0.4,
  },
  seatCountContainer: {
    alignItems: 'center',
    marginHorizontal: 40,
  },
  seatCount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
  },
  seatCountLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 4,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionPriceText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 2,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  messageInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    minHeight: 100,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 100,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  footerContent: {
    gap: 16,
  },
  priceBreakdown: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priceBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceBreakdownLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  priceBreakdownValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10B981',
  },
  joinButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  joinButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

