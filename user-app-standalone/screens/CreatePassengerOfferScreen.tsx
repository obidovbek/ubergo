/**
 * Create Passenger Offer Screen
 * Screen for passengers to create ride requests
 * Redesigned with modern, clean UI with geo selection
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  createPassengerOffer,
  updatePassengerOffer,
  getPassengerOfferById,
  type CreatePassengerOfferData,
  type PassengerOffer,
  type PassengerOfferSalonScope,
  type PassengerOfferVehicleClass,
} from "../api/passengerOffers";
import { useTranslation } from "../hooks/useTranslation";
import * as GeoAPI from "../api/geo";
import {
  LocationCard,
  buildLocationText,
  emptyLocation,
  type LocationValue,
} from "../components/passengerOffer/LocationCard";
import {
  TimeWindowCard,
  combineDateTime,
} from "../components/passengerOffer/TimeWindowCard";
import { CheckRow } from "../components/passengerOffer/CheckRow";
import {
  SeatStepper,
  type SeatRowCounts,
} from "../components/passengerOffer/SeatStepper";
import {
  SpecialOrderPanel,
  emptySpecialOrder,
  hasAnySeatPrice,
  parseMoney,
  FREE_WAITING_MINUTES,
  type SpecialOrderValue,
} from "../components/passengerOffer/SpecialOrderPanel";
import { showToast } from "../utils/toast";
import { showConfirmDialog } from "../utils/confirmDialog";

type MainStackParamList = {
  Menu: undefined;
  /** T-040: an id turns this screen into an editor for that order. */
  CreatePassengerOffer: { offerId?: number } | undefined;
  MyPassengerOffers: undefined;
};

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type CreateRouteProp = RouteProp<MainStackParamList, "CreatePassengerOffer">;

/**
 * The API rejects non-urgent offers starting less than 30 minutes from now.
 * The client asks for a minute more so a form submitted right on the boundary
 * cannot pass here and then fail server-side with an untranslated 400.
 */
const MIN_ADVANCE_MS = 31 * 60 * 1000;

export const CreatePassengerOfferScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CreateRouteProp>();
  const { t } = useTranslation();

  // T-040: one screen, two modes. `offerId` present = editing that order.
  const offerId = route.params?.offerId;
  const isEdit = offerId !== undefined;
  const [isPreparing, setIsPreparing] = useState(isEdit);
  /**
   * The order as it was loaded. Used to answer "did the passenger actually
   * re-pick this location?" — see `handleSubmit`, where the answer decides
   * whether `from_text`/`to_text` are sent at all.
   */
  const [loadedOffer, setLoadedOffer] = useState<PassengerOffer | null>(null);

  // Country is fixed to Uzbekistan and never shown (OR-004 precedent)
  const [countryId, setCountryId] = useState<number | null>(null);

  // Route — the two cards of K_buyurtma001Yangi.png
  const [fromLocation, setFromLocation] =
    useState<LocationValue>(emptyLocation);
  const [toLocation, setToLocation] = useState<LocationValue>(emptyLocation);

  // Departure: hoziroq, or a date + a from–until window
  const [isUrgent, setIsUrgent] = useState(false);
  const [departDate, setDepartDate] = useState<Date>(
    new Date(Date.now() + 60 * 60 * 1000),
  );
  const [departFrom, setDepartFrom] = useState<Date | null>(
    new Date(Date.now() + 60 * 60 * 1000),
  );
  const [departUntil, setDepartUntil] = useState<Date | null>(null);

  // Arrival ("...gacha yetib borish kerak") — fully optional
  const [arriveDate, setArriveDate] = useState<Date | null>(null);
  const [arriveUntil, setArriveUntil] = useState<Date | null>(null);

  /*
   * Payment — T-031: three independent flags, not one enum.
   *
   * Cash and card may BOTH be on; "Do'stimga" is a separate point on top of
   * them (owner, 2026-08-13). At least one of cash/card is required — a friend
   * paying still pays somehow, and the driver needs to know which.
   */
  const [paymentCash, setPaymentCash] = useState(false);
  const [paymentCard, setPaymentCard] = useState(false);
  const [paidByFriend, setPaidByFriend] = useState(false);
  const [payerPhone, setPayerPhone] = useState("+998 ");

  // Vehicle class — one deselectable radio group of five
  const [vehicleClass, setVehicleClass] =
    useState<PassengerOfferVehicleClass | null>(null);

  // Seats: a sedan, as drawn — 1 front seat, 3 back seats
  const [frontCounts, setFrontCounts] = useState<SeatRowCounts>({
    male: 0,
    female: 0,
  });
  const [backCounts, setBackCounts] = useState<SeatRowCounts>({
    male: 0,
    female: 0,
  });
  const [seatPositionAny, setSeatPositionAny] = useState(false);
  const [salonScope, setSalonScope] = useState<PassengerOfferSalonScope | null>(
    null,
  );

  const [womanInCar, setWomanInCar] = useState(false);
  const [largeBaggage, setLargeBaggage] = useState(false);
  const [roofRackNeeded, setRoofRackNeeded] = useState(false);
  const [trailer, setTrailer] = useState(false);
  const [pets, setPets] = useState(false);
  const [roadPickup, setRoadPickup] = useState(false);
  const [roadPickupNote, setRoadPickupNote] = useState("");
  const [note, setNote] = useState("");

  // Special order — collapsed by default, posts to the same endpoint
  const [specialExpanded, setSpecialExpanded] = useState(false);
  const [specialOrder, setSpecialOrder] =
    useState<SpecialOrderValue>(emptySpecialOrder);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // A salon booking takes every seat, so the per-seat picker is meaningless
  const seatsLocked = salonScope !== null;
  const totalSeats =
    frontCounts.male + frontCounts.female + backCounts.male + backCounts.female;

  /** Radios are deselectable: tapping the active one clears the group. */
  const toggleSalonScope = (scope: PassengerOfferSalonScope) => {
    setSalonScope((current) => (current === scope ? null : scope));
  };

  const toggleVehicleClass = (option: PassengerOfferVehicleClass) => {
    setVehicleClass((current) => (current === option ? null : option));
  };

  // Resolve Uzbekistan once; the country itself is never shown (OR-004).
  useEffect(() => {
    let cancelled = false;

    GeoAPI.fetchGeoCountries()
      .then((countries) => {
        if (cancelled) return;
        const uzbekistan = countries.find((country) =>
          country.name.toLowerCase().includes("zbekistan"),
        );
        setCountryId(uzbekistan?.id ?? countries[0]?.id ?? null);
      })
      .catch((error) => {
        console.error("Failed to load countries:", error);
        showToast.error(t("common.error"), t("passengerOffers.errorLoad"));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * T-040 — rebuild a `LocationValue` from the ids the API stores.
   *
   * ⚠️ Each level is fetched from its PARENT's id and matched by id, so this is
   * three requests per side, not a scan. (The driver app's `parseLocationText`
   * fans out country×province fetches to do the same job — logged in T-026 as a
   * thing not to copy.)
   *
   * ⚠️ **The mahalla cannot come back.** It has no id column (T-029) — it exists
   * only inside the stored `from_text`. It is left null here, and `handleSubmit`
   * compensates by not resending the text unless the passenger re-picks the
   * location, which keeps the stored string (mahalla included) intact.
   */
  const hydrateLocation = async (
    countryIdValue: number | null,
    provinceId?: number | null,
    cityId?: number | null,
    settlementId?: number | null,
    landmark?: string | null,
  ): Promise<LocationValue> => {
    const value: LocationValue = { ...emptyLocation, landmark: landmark ?? "" };
    if (!countryIdValue || !provinceId) return value;

    const provinces = await GeoAPI.fetchGeoProvinces(countryIdValue);
    value.province = provinces.find((p) => p.id === provinceId) ?? null;
    if (!value.province || !cityId) return value;

    const cities = await GeoAPI.fetchGeoCityDistricts(provinceId);
    value.cityDistrict = cities.find((c) => c.id === cityId) ?? null;
    if (!value.cityDistrict || !settlementId) return value;

    const settlements = await GeoAPI.fetchGeoSettlements(cityId);
    value.settlement = settlements.find((s) => s.id === settlementId) ?? null;
    return value;
  };

  /**
   * T-040 — load the order being edited and hydrate all 25 pieces of state.
   *
   * Waits for `countryId` because the geo cascade starts from it. Runs once per
   * order: `loadedOffer` guards against a re-run overwriting the passenger's
   * in-progress edits.
   */
  useEffect(() => {
    if (!isEdit || !countryId || loadedOffer) return;
    let cancelled = false;

    (async () => {
      try {
        const offer = await getPassengerOfferById(offerId!);
        if (cancelled) return;

        const [from, to] = await Promise.all([
          hydrateLocation(
            countryId,
            offer.from_province_id,
            offer.from_city_id,
            offer.from_settlement_id,
            offer.from_landmark,
          ),
          hydrateLocation(
            countryId,
            offer.to_province_id,
            offer.to_city_id,
            offer.to_settlement_id,
            offer.to_landmark,
          ),
        ]);
        if (cancelled) return;

        setFromLocation(from);
        setToLocation(to);

        const startAt = new Date(offer.start_at);
        setIsUrgent(!!offer.is_urgent);
        setDepartDate(startAt);
        setDepartFrom(startAt);
        setDepartUntil(offer.depart_until ? new Date(offer.depart_until) : null);
        setArriveDate(offer.arrive_until ? new Date(offer.arrive_until) : null);
        setArriveUntil(offer.arrive_until ? new Date(offer.arrive_until) : null);

        /*
         * T-031 — prefer the flags, but fall back to the deprecated
         * `payment_type` for offers created before the split (and for any row
         * the migration has not touched). Reading the flags alone would show
         * an older order as having no payment method at all.
         */
        setPaymentCash(offer.payment_cash ?? offer.payment_type === "cash");
        setPaymentCard(
          offer.payment_card ?? offer.payment_type === "click_payme",
        );
        setPaidByFriend(
          offer.paid_by_friend ?? offer.payment_type === "friend_pays",
        );
        if (offer.payer_phone) setPayerPhone(offer.payer_phone);
        setVehicleClass(offer.vehicle_class ?? null);

        const counts = offer.seat_counts;
        setFrontCounts({
          male: counts?.front_male ?? 0,
          female: counts?.front_female ?? 0,
        });
        setBackCounts({
          male: counts?.back_male ?? 0,
          female: counts?.back_female ?? 0,
        });
        setSeatPositionAny(!!offer.seat_position_any);
        setSalonScope(offer.salon_scope ?? null);

        setWomanInCar(!!offer.woman_in_car);
        setLargeBaggage(!!offer.large_baggage);
        setRoofRackNeeded(!!offer.roof_rack_needed);
        setTrailer(!!offer.trailer);
        setPets(!!offer.pets);
        setRoadPickup(!!offer.road_pickup);
        setRoadPickupNote(offer.road_pickup_note ?? "");
        setNote(offer.note ?? "");

        const special = offer.special_order;
        if (special) {
          setSpecialExpanded(true);
          setSpecialOrder({
            priceFront: special.price_front != null ? String(special.price_front) : "",
            priceBack: special.price_back != null ? String(special.price_back) : "",
            priceBackSalon:
              special.price_back_salon != null ? String(special.price_back_salon) : "",
            priceWholeSalon:
              special.price_whole_salon != null ? String(special.price_whole_salon) : "",
            reviewDriverOffers: !!special.review_driver_offers,
            fixedPrice: !!special.fixed_price,
            waitingFeePerMin:
              special.waiting_fee_per_min != null
                ? String(special.waiting_fee_per_min)
                : "",
          });
        }

        setLoadedOffer(offer);
      } catch (error: any) {
        if (cancelled) return;
        console.error("Failed to load the offer for editing:", error);
        // A dialog, NOT a toast: the OK button leaves the screen. There is
        // nothing to edit, so the user must not be left on an empty form.
        // `ConfirmDialog` renders one button when `cancelText` is omitted.
        showConfirmDialog({
          title: t("common.error"),
          message: error?.message || t("passengerOffers.errorLoad"),
          confirmText: t("common.ok"),
          onConfirm: () => navigation.goBack(),
          onCancel: () => {},
        });
      } finally {
        if (!cancelled) setIsPreparing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEdit, offerId, countryId, loadedOffer]);

  /**
   * The earliest departure the form will accept — the floor for both wheels.
   *
   * ⚠️ Computed on every render rather than memoised on mount. A create form
   * can sit open for an hour, and a floor frozen at mount would go on offering
   * times that are now in the past — the exact defect this closes, just later.
   */
  const departFloor = new Date(Date.now() + MIN_ADVANCE_MS);

  /**
   * The earliest arrival the form will accept: the departure itself.
   *
   * `validateForm` rejects `arrive_until < start_at`, so this makes the wheels
   * offer exactly what the form accepts — the same contract the departure card
   * already has.
   *
   * ⚠️ It tracks the CHOSEN departure, not the clock. For a trip next week,
   * "arrive tomorrow" is as wrong as "arrive yesterday", and a floor of `now`
   * would happily allow it.
   *
   * ⚠️ When "hoziroq" is ticked the departure is `now`, so the arrival floor
   * follows it rather than sitting at a stale picked time.
   */
  const arrivalFloor = isUrgent
    ? new Date()
    : departFrom
      ? combineDateTime(departDate, departFrom)
      : departFloor;

  /** Departure moment: "now" when urgent, otherwise the day + window start. */
  const getStartAtDate = (): Date => {
    if (isUrgent) return new Date();
    return combineDateTime(departDate, departFrom ?? departDate);
  };

  /** End of the departure window — only when the passenger set one. */
  const getDepartUntilDate = (): Date | null => {
    if (isUrgent || !departUntil) return null;
    return combineDateTime(departDate, departUntil);
  };

  /** "…gacha yetib borish kerak" — needs both a day and a time. */
  const getArriveUntilDate = (): Date | null => {
    if (!arriveDate || !arriveUntil) return null;
    return combineDateTime(arriveDate, arriveUntil);
  };

  const validateForm = (withSpecialOrder: boolean): boolean => {
    const newErrors: Record<string, string> = {};

    // Province + city/district are required; settlement and landmark are not
    // (many districts have no settlements at all).
    if (!fromLocation.province || !fromLocation.cityDistrict) {
      newErrors.from_text = t("passengerOffers.errorFromLocation");
    }
    if (!toLocation.province || !toLocation.cityDistrict) {
      newErrors.to_text = t("passengerOffers.errorToLocation");
    }

    const startAtDate = getStartAtDate();

    if (!isUrgent) {
      if (!departFrom) {
        newErrors.start_at = t("passengerOffers.errorTime");
      } else if (startAtDate < new Date(Date.now() + MIN_ADVANCE_MS)) {
        newErrors.start_at = t("passengerOffers.errorTime");
      }

      const departUntilDate = getDepartUntilDate();
      if (departUntilDate && departUntilDate < startAtDate) {
        newErrors.start_at = t("passengerOffers.errorDepartureTime");
      }
    }

    const arriveUntilDate = getArriveUntilDate();
    if (arriveUntilDate && arriveUntilDate < startAtDate) {
      newErrors.arrive_until = t("passengerOffers.errorArrivalTime");
    }

    // Either single seats or a whole-salon booking — the API needs one of them
    if (!salonScope && totalSeats === 0) {
      newErrors.seats = t("passengerOffers.errorSeatsRequired");
    }

    /*
     * T-031: at least one real payment method. "Do'stimga" alone is not
     * enough — a friend still pays in cash or by card.
     *
     * ⚠️ These are two SEPARATE ifs, not if/else. The flags are independent, so
     * "Do'stimga ticked, no method, no phone" is a real state and must report
     * both problems; chaining them would hide the phone error behind the
     * method error and make the form refuse twice in a row.
     */
    if (!paymentCash && !paymentCard) {
      newErrors.payment_type = t("passengerOffers.errorPaymentRequired");
    }
    if (paidByFriend && payerPhone.replace(/\D/g, "").length < 7) {
      newErrors.payer_phone = t("passengerOffers.errorPayerPhone");
    }

    // The API rejects a special order without a single seat price
    if (withSpecialOrder && !hasAnySeatPrice(specialOrder)) {
      newErrors.special_order = t("passengerOffers.errorSpecialPrice");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // The offending fields are already marked inline by `setErrors`, so this
      // only needs to draw the eye — a toast, not a box to dismiss.
      showToast.error(
        t("common.error"),
        Object.values(newErrors)[0] || t("passengerOffers.errorAllFields"),
      );
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (withSpecialOrder = false) => {
    if (!validateForm(withSpecialOrder)) {
      return;
    }

    setIsLoading(true);

    try {
      const departUntilDate = getDepartUntilDate();
      const arriveUntilDate = getArriveUntilDate();

      // Most precise geo level the passenger picked, for the map later on
      const fromPoint = fromLocation.settlement ?? fromLocation.cityDistrict;
      const toPoint = toLocation.settlement ?? toLocation.cityDistrict;

      /**
       * T-040 — did the passenger actually re-pick this location?
       *
       * ⚠️ This is the mahalla guard. `buildLocationText` composes the text from
       * province + district + settlement + **mahalla**, but the mahalla has no id
       * column (T-029), so `hydrateLocation` cannot restore it. Rebuilding the
       * text from what the form holds would therefore delete it silently. When
       * the ids still match what was loaded, the text is left out of the PATCH
       * entirely and the stored string survives untouched.
       */
      const sameGeo = (
        loaded: PassengerOffer,
        side: "from" | "to",
        value: LocationValue,
      ): boolean =>
        (loaded[`${side}_province_id`] ?? null) === (value.province?.id ?? null) &&
        (loaded[`${side}_city_id`] ?? null) === (value.cityDistrict?.id ?? null) &&
        (loaded[`${side}_settlement_id`] ?? null) === (value.settlement?.id ?? null);

      const keepFromText = !!loadedOffer && sameGeo(loadedOffer, "from", fromLocation);
      const keepToText = !!loadedOffer && sameGeo(loadedOffer, "to", toLocation);

      const offerData: CreatePassengerOfferData = {
        from_text: buildLocationText(fromLocation),
        from_lat: fromPoint?.latitude || undefined,
        from_lng: fromPoint?.longitude || undefined,
        from_country_id: countryId || undefined,
        from_province_id: fromLocation.province?.id || undefined,
        from_city_id: fromLocation.cityDistrict?.id || undefined,
        from_settlement_id: fromLocation.settlement?.id || undefined,
        from_landmark: fromLocation.landmark.trim() || undefined,
        to_text: buildLocationText(toLocation),
        to_lat: toPoint?.latitude || undefined,
        to_lng: toPoint?.longitude || undefined,
        to_country_id: countryId || undefined,
        to_province_id: toLocation.province?.id || undefined,
        to_city_id: toLocation.cityDistrict?.id || undefined,
        to_settlement_id: toLocation.settlement?.id || undefined,
        to_landmark: toLocation.landmark.trim() || undefined,
        start_at: getStartAtDate().toISOString(),
        depart_until: departUntilDate?.toISOString(),
        arrive_until: arriveUntilDate?.toISOString(),
        is_urgent: isUrgent,
        // seats_needed and max_price_per_seat are deliberately absent: the API
        // derives the seat count, and this form collects no price at all.
        // T-031 — the flags are the source of truth. The server keeps the
        // deprecated `payment_type` in step itself, so it is not sent here.
        payment_cash: paymentCash,
        payment_card: paymentCard,
        paid_by_friend: paidByFriend,
        payer_phone: paidByFriend ? payerPhone.trim() : undefined,
        seat_counts: salonScope
          ? undefined
          : {
              front_male: frontCounts.male,
              front_female: frontCounts.female,
              back_male: backCounts.male,
              back_female: backCounts.female,
            },
        seat_position_any: seatPositionAny,
        salon_scope: salonScope ?? undefined,
        vehicle_class: vehicleClass ?? undefined,
        currency: "UZS",
        // Kept in sync for the older list screens that still read front_seat.
        // The whole salon includes the front seat; the back salon does not.
        front_seat: salonScope
          ? salonScope === "whole_salon"
          : frontCounts.male + frontCounts.female > 0,
        pets: pets,
        large_baggage: largeBaggage,
        woman_in_car: womanInCar,
        roof_rack_needed: roofRackNeeded,
        trailer: trailer,
        road_pickup: roadPickup,
        road_pickup_note: roadPickup
          ? roadPickupNote.trim() || undefined
          : undefined,
        note: note.trim() || undefined,
        // Stored as typed; no money moves anywhere yet (owner decision, T-006)
        special_order: withSpecialOrder
          ? {
              price_front: parseMoney(specialOrder.priceFront),
              price_back: parseMoney(specialOrder.priceBack),
              price_back_salon: parseMoney(specialOrder.priceBackSalon),
              price_whole_salon: parseMoney(specialOrder.priceWholeSalon),
              review_driver_offers: specialOrder.reviewDriverOffers,
              fixed_price: specialOrder.fixedPrice,
              waiting_fee_per_min: parseMoney(specialOrder.waitingFeePerMin),
              free_waiting_min: FREE_WAITING_MINUTES,
            }
          : undefined,
      };

      if (isEdit) {
        // Keep the stored text when the location was not re-picked — see the
        // mahalla note above.
        // `UpdatePassengerOfferData` is the partial form of the create payload,
        // so the two text fields can simply be left out — no `delete` on a type
        // that declares them required.
        const { from_text, to_text, ...rest } = offerData;
        await updatePassengerOffer(offerId!, {
          ...rest,
          ...(keepFromText ? {} : { from_text }),
          ...(keepToText ? {} : { to_text }),
        });
      } else {
        await createPassengerOffer(offerData);
      }

      // A dialog, NOT a toast: OK is what returns the user to their list. A
      // toast would leave them staring at the form they just submitted,
      // unsure whether it worked.
      showConfirmDialog({
        title: t("passengerOffers.success"),
        message: isEdit
          ? t("passengerOffers.updateSuccessMessage")
          : t("passengerOffers.successMessage"),
        confirmText: t("common.ok"),
        /*
          T-077 — a NEW request hands the passenger straight to the drivers
          already going that way. Until now this was `goBack()`, which dropped
          them on the menu with no idea whether anyone was driving their route.

          ⚠️ EDIT mode deliberately still goes back: the passenger arrived from
          their own orders list, and sending them to a search screen instead
          would lose the place they were editing from.
          ⚠️ It hangs off the dialog's OK, not a toast — a toast has no button,
          so the navigation would simply never happen (T-057's rule).
        */
        onConfirm: () => {
          if (isEdit) {
            navigation.goBack();
            return;
          }
          (navigation as any).navigate("SearchOffers", {
            fromProvince: fromLocation.province,
            fromCity: fromLocation.cityDistrict,
            toProvince: toLocation.province,
            toCity: toLocation.cityDistrict,
          });
        },
        onCancel: () => {},
      });
    } catch (error: any) {
      console.error(
        isEdit ? "Error updating passenger offer:" : "Error creating passenger offer:",
        error,
      );
      showToast.error(
        isEdit ? t("passengerOffers.errorUpdate") : t("passengerOffers.errorCreate"),
        // The server's 400s are already translated (including "this order can no
        // longer be edited" and the ≥30-minutes rule), so show them verbatim.
        error.message ||
          (isEdit
            ? t("passengerOffers.errorUpdateMessage")
            : t("passengerOffers.errorCreateMessage")),
      );
    } finally {
      setIsLoading(false);
    }
  };

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
        <Text style={styles.headerTitle}>
          {isEdit
            ? t("passengerOffers.editRideRequest")
            : t("passengerOffers.createRideRequest")}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* T-040: while the order is being fetched and the geo cascade resolved,
          the form would otherwise show its create-mode defaults — a passenger
          would see "now + 1 hour" and empty locations for a second and could
          start typing into a form about to be overwritten. */}
      {isPreparing ? (
        <View style={styles.preparingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
      <>
      {/* This screen had NO KeyboardAvoidingView, so the keyboard simply covered
          whatever was near the bottom — the road-pickup note, the additional
          info and the special-order fields could not be reached or read while
          typing (OR-012 items 2-4). `keyboardShouldPersistTaps` lets a tap on a
          checkbox register on the first press instead of only dismissing the
          keyboard. */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 48 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Route + times — inline, exactly as drawn on K_buyurtma001Yangi.png */}
          <View style={styles.routeCard}>
            <LocationCard
              label={t("passengerOffers.fromLabel")}
              countryId={countryId}
              value={fromLocation}
              onChange={setFromLocation}
              accent="start"
              error={errors.from_text}
            />

            <TimeWindowCard
              variant="departure"
              date={departDate}
              onDateChange={setDepartDate}
              fromTime={departFrom}
              onFromTimeChange={setDepartFrom}
              untilTime={departUntil}
              onUntilTimeChange={setDepartUntil}
              urgent={isUrgent}
              onUrgentChange={setIsUrgent}
              /*
                The wheels must offer exactly what `validateForm` accepts, so
                the same MIN_ADVANCE_MS is the floor. Without it the picker
                offered hours already gone and the refusal only arrived at
                submit, after the whole form was filled (the T-069 complaint,
                which fixed the date wheel and left the time wheels open).
              */
              minimumDate={departFloor}
              error={errors.start_at}
            />

            <LocationCard
              label={t("passengerOffers.toLabel")}
              countryId={countryId}
              value={toLocation}
              onChange={setToLocation}
              accent="end"
              error={errors.to_text}
            />

            <TimeWindowCard
              variant="arrival"
              date={arriveDate}
              onDateChange={setArriveDate}
              untilTime={arriveUntil}
              onUntilTimeChange={setArriveUntil}
              /*
                You cannot arrive before you leave. `validateForm` has always
                refused it (`errorArrivalTime`), but the wheels still OFFERED
                those dates and times, so the refusal only arrived at submit —
                the owner hit this on 2026-08-13 with an arrival of 12.08
                against a departure on 13.08.

                ⚠️ The floor is the DEPARTURE moment, not "now": for a trip next
                week, arriving tomorrow is just as wrong as arriving yesterday.
              */
              minimumDate={arrivalFloor}
              error={errors.arrive_until}
            />
          </View>

          {/* Payment ("To'lov turi") — single choice, the Figma draws checkboxes */}
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>
              {t("passengerOffers.paymentTitle")}
            </Text>

            {/*
              T-031 — three INDEPENDENT toggles (owner, 2026-08-13).
              They used to share one `paymentType` value, so they behaved as a
              radio group: ticking "Do'stimga" silently cleared "Naqd", and
              cash + card could never both be on.
            */}
            <View style={styles.inlineRow}>
              <CheckRow
                label={t("passengerOffers.paymentCash")}
                checked={paymentCash}
                onPress={() => setPaymentCash(!paymentCash)}
              />
              <CheckRow
                label={t("passengerOffers.paymentClickPayme")}
                checked={paymentCard}
                onPress={() => setPaymentCard(!paymentCard)}
              />
            </View>

            {/*
              "Do'stimga" is its own point, not a payment method — a friend
              still pays in cash or by card, so it sits apart from the two
              above and does not clear them.
            */}
            <CheckRow
              label={t("passengerOffers.paymentFriend")}
              checked={paidByFriend}
              onPress={() => setPaidByFriend(!paidByFriend)}
            />

            {/* The friend may well be abroad — the number is typed in full */}
            {paidByFriend && (
              <TextInput
                style={[
                  styles.plainInput,
                  !!errors.payer_phone && styles.inputError,
                ]}
                value={payerPhone}
                onChangeText={setPayerPhone}
                placeholder={t("passengerOffers.payerPhonePlaceholder")}
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={20}
              />
            )}

            {!!errors.payment_type && (
              <Text style={styles.errorText}>{errors.payment_type}</Text>
            )}
            {!!errors.payer_phone && (
              <Text style={styles.errorText}>{errors.payer_phone}</Text>
            )}
          </View>

          {/* Vehicle class — one deselectable group of five */}
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>
              {t("passengerOffers.vehicleClass")}
            </Text>

            <View style={styles.inlineRow}>
              <CheckRow
                label={t("passengerOffers.classStandard")}
                shape="radio"
                checked={vehicleClass === "standard"}
                onPress={() => toggleVehicleClass("standard")}
              />
              <CheckRow
                label={t("passengerOffers.classComfort")}
                shape="radio"
                checked={vehicleClass === "comfort"}
                onPress={() => toggleVehicleClass("comfort")}
              />
              <CheckRow
                label={t("passengerOffers.classBusiness")}
                shape="radio"
                checked={vehicleClass === "business"}
                onPress={() => toggleVehicleClass("business")}
              />
            </View>

            <CheckRow
              label={t("passengerOffers.classEconom")}
              shape="radio"
              checked={vehicleClass === "econom"}
              onPress={() => toggleVehicleClass("econom")}
            />
            <CheckRow
              label={t("passengerOffers.classTourist")}
              shape="radio"
              checked={vehicleClass === "tourist"}
              onPress={() => toggleVehicleClass("tourist")}
            />
          </View>

          {/* Seats */}
          <View style={styles.detailsCard}>
            <View style={styles.seatsHeader}>
              <Text style={styles.cardTitle}>
                {t("passengerOffers.seatsTitle")}
              </Text>
              {totalSeats > 0 && !seatsLocked && (
                <View style={styles.seatTotalBadge}>
                  <Text style={styles.seatTotalText}>{totalSeats}</Text>
                </View>
              )}
            </View>

            <SeatStepper
              label={t("passengerOffers.seatRowFront")}
              counts={frontCounts}
              capacity={1}
              disabled={seatsLocked}
              onChange={setFrontCounts}
            />
            <SeatStepper
              label={t("passengerOffers.seatRowBack")}
              counts={backCounts}
              capacity={3}
              disabled={seatsLocked}
              onChange={setBackCounts}
            />

            <CheckRow
              label={t("passengerOffers.seatPositionAny")}
              checked={seatPositionAny}
              onPress={() => setSeatPositionAny(!seatPositionAny)}
              disabled={seatsLocked}
            />

            <View style={styles.inlineRow}>
              <CheckRow
                label={t("passengerOffers.salonWhole")}
                shape="radio"
                checked={salonScope === "whole_salon"}
                onPress={() => toggleSalonScope("whole_salon")}
              />
              <CheckRow
                label={t("passengerOffers.salonBackFull")}
                shape="radio"
                checked={salonScope === "back_salon_full"}
                onPress={() => toggleSalonScope("back_salon_full")}
              />
            </View>

            <CheckRow
              label={t("passengerOffers.womanInCar")}
              checked={womanInCar}
              onPress={() => setWomanInCar(!womanInCar)}
            />

            {!!errors.seats && (
              <Text style={styles.errorText}>{errors.seats}</Text>
            )}
          </View>

          {/* Baggage, animals, pitak */}
          <View style={styles.detailsCard}>
            <CheckRow
              label={t("passengerOffers.baggage")}
              checked={largeBaggage}
              onPress={() => setLargeBaggage(!largeBaggage)}
            />

            <View style={styles.inlineRow}>
              <CheckRow
                label={t("passengerOffers.roofRack")}
                checked={roofRackNeeded}
                onPress={() => setRoofRackNeeded(!roofRackNeeded)}
              />
              <CheckRow
                label={t("passengerOffers.trailer")}
                checked={trailer}
                onPress={() => setTrailer(!trailer)}
              />
            </View>

            <CheckRow
              label={t("passengerOffers.animals")}
              checked={pets}
              onPress={() => setPets(!pets)}
            />

            <CheckRow
              label={t("passengerOffers.roadPickup")}
              checked={roadPickup}
              onPress={() => setRoadPickup(!roadPickup)}
              emphasis="danger"
            />

            {roadPickup && (
              <TextInput
                style={styles.noteInput}
                value={roadPickupNote}
                onChangeText={setRoadPickupNote}
                placeholder={t("passengerOffers.roadPickupPlaceholder")}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            )}
          </View>

          {/* Qo'shimcha ma'lumot */}
          <View style={styles.detailsCard}>
            <Text style={[styles.cardTitle, styles.cardTitleDanger]}>
              {t("passengerOffers.additionalInfo")}
            </Text>
            <TextInput
              style={styles.noteInput}
              placeholder={t("passengerOffers.additionalInfoPlaceholder")}
              placeholderTextColor="#9CA3AF"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Both buttons scroll with the form, as drawn — the green one first,
            then the special order below it */}
          <View style={styles.submitWrapper}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                isLoading && styles.submitButtonDisabled,
              ]}
              onPress={() => handleSubmit(false)}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>
                    {isEdit
                      ? t("passengerOffers.saveChanges")
                      : t("passengerOffers.submitOrder")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <SpecialOrderPanel
            expanded={specialExpanded}
            onToggle={() => setSpecialExpanded(!specialExpanded)}
            value={specialOrder}
            onChange={setSpecialOrder}
            onSubmit={() => handleSubmit(true)}
            disabled={isLoading}
            error={errors.special_order}
          />

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
      </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  preparingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 16 : 16,
    paddingBottom: 16,
    backgroundColor: "#F9FAFB",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 40,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  // Room under the last card so the keyboard never sits on top of the field
  // being typed into, even at the very bottom of the form.
  scrollContent: {
    paddingBottom: 24,
  },
  routeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  // T-018 — sections of the Figma order screen
  cardTitleDanger: {
    color: "#DC2626",
  },
  // Wraps instead of overflowing: the labels differ a lot in length per language
  inlineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 16,
  },
  plainInput: {
    marginTop: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    fontSize: 15,
    color: "#111827",
  },
  seatsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  seatTotalBadge: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  seatTotalText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  submitWrapper: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  inputError: {
    borderColor: "#EF4444",
    borderWidth: 2,
  },
  errorText: {
    fontSize: 13,
    color: "#EF4444",
    marginTop: 6,
    fontWeight: "600",
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  noteInput: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F9FAFB",
    minHeight: 100,
    fontWeight: "500",
  },
  bottomSpacing: {
    height: 100,
  },
  submitButton: {
    flexDirection: "row",
    backgroundColor: "#10B981",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
