// src/screens/Booking/ScheduleRide.tsx
/**
 * @file ScheduleRide.tsx
 * @description Transport scheduling screen — allows caregivers to arrange rides
 * to/from medical appointments for patients.
 *
 * SOLID Principle: SRP — this screen handles only transport scheduling UI.
 * Route/destination logic would live in a separate TransportContext in production.
 *
 * Currently a feature-ready scaffold with a clean, production-quality UI.
 * Integration with a ride service API (e.g., Ola, Uber, or an internal fleet)
 * would be added in a future sprint.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';

type RideType = 'Standard' | 'Wheelchair' | 'Ambulance';

const RIDE_TYPES: { label: string; value: RideType; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
  { label: 'Standard', value: 'Standard', icon: 'car-outline', description: 'Regular vehicle for ambulatory patients' },
  { label: 'Wheelchair', value: 'Wheelchair', icon: 'accessibility-outline', description: 'Wheelchair-accessible transport' },
  { label: 'Ambulance', value: 'Ambulance', icon: 'medkit-outline', description: 'Medical supervision en route' },
];

/**
 * ScheduleRide — Transport scheduling UI for patient rides to appointments.
 * Provides ride type selection, pickup/destination inputs, and scheduling.
 */
export default function ScheduleRide(): React.JSX.Element {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedType, setSelectedType] = useState<RideType>('Standard');
  const [patientName, setPatientName] = useState('');
  const [notes, setNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  const handleBookRide = async (): Promise<void> => {
    if (!pickup.trim() || !destination.trim()) {
      Alert.alert('Missing Details', 'Please enter both pickup and destination addresses.');
      return;
    }

    setIsBooking(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsBooking(false);

    Alert.alert(
      '🚗 Ride Scheduled!',
      `A ${selectedType} ride has been booked from "${pickup}" to "${destination}".`,
      [{ text: 'Great!', onPress: () => { setPickup(''); setDestination(''); setPatientName(''); setNotes(''); } }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO BANNER ── */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIconContainer}>
            <Ionicons name="car" size={32} color={COLORS.surface} />
          </View>
          <View>
            <Text style={styles.heroTitle}>Schedule Transport</Text>
            <Text style={styles.heroSubtitle}>Arrange a care ride for your patient</Text>
          </View>
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
              label="Pickup Address"
              value={pickup}
              onChangeText={setPickup}
              iconName="radio-button-on-outline"
            />
            <CustomInput
              label="Destination Address"
              value={destination}
              onChangeText={setDestination}
              iconName="location-outline"
            />
          </View>
        </View>

        {/* ── PATIENT DETAILS ── */}
        <Text style={styles.sectionLabel}>Patient Details</Text>
        <View style={styles.card}>
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
          loading={isBooking}
        />

        <Text style={styles.footerNote}>
          <Ionicons name="shield-checkmark-outline" size={13} /> Rides are confirmed within 15 minutes
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SIZES.padding, paddingBottom: 32 },

  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    padding: 20,
    marginBottom: 24,
    gap: 16,
    ...SHADOWS.button,
  },
  heroIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { fontSize: FONTS.h3, fontWeight: '800', color: COLORS.surface },
  heroSubtitle: { fontSize: FONTS.caption, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  sectionLabel: {
    fontSize: FONTS.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },

  rideTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  rideChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 4,
  },
  rideChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  rideChipLabel: { fontSize: FONTS.micro, fontWeight: '700', color: COLORS.textLight },
  rideChipLabelActive: { color: COLORS.surface },

  descriptionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    gap: 6,
    marginBottom: 20,
  },
  descriptionText: { fontSize: FONTS.caption, color: COLORS.primary, flex: 1 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.cardPadding,
    marginBottom: 20,
    flexDirection: 'row',
    gap: 12,
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
  },
});