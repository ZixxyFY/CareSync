// src/screens/Booking/ScheduleRide.tsx
/**
 * @file ScheduleRide.tsx
 * @description Transport scheduling screen — allows users to arrange rides
 * to/from medical appointments and view their booking history.
 *
 * Data Flow: UI → useTransport() → TransportContext → transportService → Supabase
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { useTransport } from '../../context/TransportContext';
import { TransportBooking } from '../../services/transportService';

type RideType = 'Standard' | 'Wheelchair' | 'Ambulance';

const RIDE_TYPES: {
  label: string;
  value: RideType;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}[] = [
  {
    label: 'Standard',
    value: 'Standard',
    icon: 'car-outline',
    description: 'Regular vehicle for ambulatory patients',
  },
  {
    label: 'Wheelchair',
    value: 'Wheelchair',
    icon: 'accessibility-outline',
    description: 'Wheelchair-accessible transport',
  },
  {
    label: 'Ambulance',
    value: 'Ambulance',
    icon: 'medkit-outline',
    description: 'Medical supervision en route',
  },
];

const STATUS_CONFIG: Record<
  TransportBooking['status'],
  { bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  Scheduled: { bg: '#DBEAFE', text: COLORS.primary, icon: 'time-outline' },
  Completed: { bg: '#E2E8F0', text: COLORS.textLight, icon: 'checkmark-circle-outline' },
  Cancelled: { bg: '#FEE2E2', text: COLORS.error, icon: 'close-circle-outline' },
};

// ---------------------------------------------------------------------------
// RIDE CARD SUB-COMPONENT
// ---------------------------------------------------------------------------

interface RideCardProps {
  item: TransportBooking;
  onCancel: (id: string, rideType: string) => void;
}

const RideCard = React.memo(({ item, onCancel }: RideCardProps) => {
  const statusConf = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.Scheduled;
  const createdDate = new Date(item.created_at);
  const rideIcon = RIDE_TYPES.find((r) => r.value === item.ride_type)?.icon ?? 'car-outline';

  return (
    <View style={rideStyles.card}>
      <View style={rideStyles.cardHeader}>
        <View style={rideStyles.rideTypePill}>
          <Ionicons name={rideIcon} size={14} color={COLORS.primary} />
          <Text style={rideStyles.rideTypeText}>{item.ride_type}</Text>
        </View>
        <View style={[rideStyles.statusBadge, { backgroundColor: statusConf.bg }]}>
          <Ionicons name={statusConf.icon} size={12} color={statusConf.text} />
          <Text style={[rideStyles.statusText, { color: statusConf.text }]}>{item.status}</Text>
        </View>
      </View>

      <View style={rideStyles.routeRow}>
        <View style={rideStyles.routeDotGreen} />
        <Text style={rideStyles.routeText} numberOfLines={1}>{item.pickup_address}</Text>
      </View>
      <View style={rideStyles.routeConnector} />
      <View style={rideStyles.routeRow}>
        <View style={rideStyles.routeDotRed} />
        <Text style={rideStyles.routeText} numberOfLines={1}>{item.destination_address}</Text>
      </View>

      {item.patient_name ? (
        <Text style={rideStyles.patientText}>
          <Ionicons name="person-outline" size={12} /> {item.patient_name}
        </Text>
      ) : null}

      <View style={rideStyles.cardFooter}>
        <Text style={rideStyles.dateText}>
          <Ionicons name="calendar-outline" size={12} />{' '}
          {createdDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>
        {item.status === 'Scheduled' && (
          <TouchableOpacity
            style={rideStyles.cancelBtn}
            onPress={() => onCancel(item.id, item.ride_type)}
          >
            <Text style={rideStyles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
// MAIN SCREEN
// ---------------------------------------------------------------------------

export default function ScheduleRide(): React.JSX.Element {
  const { state, loadBookings, addBooking, cancelBooking } = useTransport();

  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedType, setSelectedType] = useState<RideType>('Standard');
  const [patientName, setPatientName] = useState('');
  const [notes, setNotes] = useState('');
  const [pickupError, setPickupError] = useState('');
  const [destError, setDestError] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  const handleBookRide = useCallback(async (): Promise<void> => {
    let hasError = false;
    if (!pickup.trim()) { setPickupError('Pickup address is required.'); hasError = true; }
    else setPickupError('');
    if (!destination.trim()) { setDestError('Destination address is required.'); hasError = true; }
    else setDestError('');
    if (hasError) return;

    try {
      await addBooking({
        ride_type: selectedType,
        pickup_address: pickup.trim(),
        destination_address: destination.trim(),
        patient_name: patientName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setPickup('');
      setDestination('');
      setPatientName('');
      setNotes('');
      Alert.alert(
        '🚗 Ride Scheduled!',
        `Your ${selectedType} ride has been booked and saved.\nWe'll confirm it within 15 minutes.`,
        [{ text: 'Great!' }]
      );
    } catch (error: any) {
      Alert.alert(
        'Booking Failed',
        `Could not schedule the ride.\n\nError: ${error?.message ?? 'Unknown error'}\n\nIf this is your first time using Transport, make sure to run the transport_bookings SQL in Supabase.`
      );
    }
  }, [pickup, destination, selectedType, patientName, notes, addBooking]);

  const handleCancel = useCallback((id: string, rideType: string): void => {
    Alert.alert(
      'Cancel Ride?',
      `Are you sure you want to cancel your ${rideType} ride?`,
      [
        { text: 'Keep Ride', style: 'cancel' },
        {
          text: 'Cancel Ride',
          style: 'destructive',
          onPress: () => cancelBooking(id),
        },
      ]
    );
  }, [cancelBooking]);

  const scheduledCount = state.bookings.filter((b) => b.status === 'Scheduled').length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.gradientStart} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO BANNER ── */}
        <View style={styles.heroBanner}>
          {/* Decorative circles */}
          <View style={styles.heroDecor1} />
          <View style={styles.heroDecor2} />
          <View style={styles.heroIconContainer}>
            <Ionicons name="car" size={32} color={COLORS.surface} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Schedule Transport</Text>
            <Text style={styles.heroSubtitle}>Arrange a care ride for your patient</Text>
          </View>
          {scheduledCount > 0 && (
            <View style={styles.heroCountBadge}>
              <Text style={styles.heroCountText}>{scheduledCount}</Text>
              <Text style={styles.heroCountLabel}>Active</Text>
            </View>
          )}
        </View>

        {/* ── RIDE TYPE SELECTOR ── */}
        <Text style={styles.sectionLabel}>Ride Type</Text>
        <View style={styles.rideTypeRow}>
          {RIDE_TYPES.map((type) => {
            const isActive = selectedType === type.value;
            return (
              <TouchableOpacity
                key={type.value}
                style={[styles.rideChip, isActive && styles.rideChipActive]}
                onPress={() => setSelectedType(type.value)}
              >
                <Ionicons
                  name={type.icon}
                  size={22}
                  color={isActive ? COLORS.surface : COLORS.textLight}
                />
                <Text style={[styles.rideChipLabel, isActive && styles.rideChipLabelActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.descriptionBox}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
          <Text style={styles.descriptionText}>
            {RIDE_TYPES.find((t) => t.value === selectedType)?.description}
          </Text>
        </View>

        {/* ── ROUTE FORM ── */}
        <Text style={styles.sectionLabel}>Route Details</Text>
        <View style={styles.card}>
          <View style={styles.routeIndicator}>
            <View style={styles.routeDot} />
            <View style={styles.routeLine} />
            <Ionicons name="location" size={18} color={COLORS.error} />
          </View>
          <View style={styles.routeInputs}>
            <CustomInput
              label="Pickup Address *"
              value={pickup}
              onChangeText={(v) => { setPickup(v); setPickupError(''); }}
              iconName="radio-button-on-outline"
              error={pickupError}
            />
            <CustomInput
              label="Destination Address *"
              value={destination}
              onChangeText={(v) => { setDestination(v); setDestError(''); }}
              iconName="location-outline"
              error={destError}
            />
          </View>
        </View>

        {/* ── PATIENT DETAILS ── */}
        <Text style={styles.sectionLabel}>Patient Details</Text>
        <View style={styles.patientCard}>
          <CustomInput
            label="Patient Name (optional)"
            value={patientName}
            onChangeText={setPatientName}
            iconName="person-outline"
            autoCapitalize="words"
          />
          <CustomInput
            label="Special Instructions (optional)"
            value={notes}
            onChangeText={setNotes}
            iconName="document-text-outline"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* ── BOOK BUTTON ── */}
        <CustomButton
          title="Schedule Ride"
          onPress={handleBookRide}
          loading={state.isSubmitting}
        />

        <Text style={styles.footerNote}>
          <Ionicons name="shield-checkmark-outline" size={13} /> Rides are confirmed within 15 minutes
        </Text>

        {/* ── MY RIDES ── */}
        {state.isLoading && state.bookings.length === 0 ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={COLORS.primary} />
        ) : state.bookings.length > 0 ? (
          <View style={{ marginTop: 28 }}>
            <Text style={styles.sectionLabel}>My Rides ({state.bookings.length})</Text>
            {state.bookings.map((booking) => (
              <RideCard key={booking.id} item={booking} onCancel={handleCancel} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// MAIN STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SIZES.padding, paddingBottom: 40 },

  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gradientStart,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    gap: 16,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.hero,
  },
  heroDecor1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -40,
    right: -30,
  },
  heroDecor2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -20,
    left: 60,
  },
  heroIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { fontSize: FONTS.h3, fontWeight: '800', color: COLORS.surface },
  heroSubtitle: { fontSize: FONTS.caption, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  heroCountBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroCountText: { fontSize: FONTS.h2, fontWeight: '800', color: COLORS.surface },
  heroCountLabel: { fontSize: FONTS.micro, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  sectionLabel: {
    fontSize: FONTS.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },

  rideTypeRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  rideChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 6,
  },
  rideChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  rideChipLabel: { fontSize: FONTS.micro, fontWeight: '700', color: COLORS.textLight },
  rideChipLabelActive: { color: COLORS.surface },

  descriptionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryTint,
    borderRadius: SIZES.borderRadius,
    padding: 16,
    gap: 8,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  descriptionText: { fontSize: FONTS.caption, color: COLORS.primaryDark, flex: 1, fontWeight: '500' },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.cardPadding + 4,
    marginBottom: 24,
    flexDirection: 'row',   // used by Route card (route dots + inputs side by side)
    gap: 16,
    ...SHADOWS.card,
  },
  // Patient details card — stacks inputs vertically
  patientCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.cardPadding + 4,
    marginBottom: 24,
    flexDirection: 'column',
    ...SHADOWS.card,
  },
  routeIndicator: { alignItems: 'center', paddingTop: 14 },
  routeDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.primary, marginBottom: 4 },
  routeLine: { width: 2, flex: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  routeInputs: { flex: 1 },


  footerNote: {
    textAlign: 'center',
    fontSize: FONTS.caption,
    color: COLORS.textLight,
    marginTop: 8,
    marginBottom: 4,
  },
});

// ---------------------------------------------------------------------------
// RIDE CARD STYLES (separate for clarity)
// ---------------------------------------------------------------------------

const rideStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.cardPadding + 4,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rideTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rideTypeText: { fontSize: FONTS.micro, fontWeight: '700', color: COLORS.primary },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontSize: FONTS.micro, fontWeight: '700' },

  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  routeDotGreen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  routeDotRed: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error,
  },
  routeConnector: {
    width: 2,
    height: 12,
    backgroundColor: COLORS.border,
    marginLeft: 4,
    marginBottom: 2,
  },
  routeText: { fontSize: FONTS.caption, color: COLORS.text, flex: 1, fontWeight: '500' },

  patientText: {
    fontSize: FONTS.micro,
    color: COLORS.textLight,
    marginTop: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dateText: { fontSize: FONTS.micro, color: COLORS.textLight },
  cancelBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  cancelBtnText: { fontSize: FONTS.micro, fontWeight: '700', color: COLORS.error },
});