// src/screens/Booking/AppointmentList.tsx
/**
 * @file AppointmentList.tsx
 * @description Main appointments listing screen — the core of the Booking Engine.
 *
 * SOLID Principle: Single Responsibility (SRP) — This "dumb" component manages
 * ONLY local UI state:
 *   - Modal open/close
 *   - Form input text (newTitle)
 *   - Date picker visibility
 *   - Submit loading indicator
 *
 * ALL business logic (add, update, delete) is delegated to BookingContext.
 * ALL date formatting is handled by transformDate.tsx utilities.
 * ALL validation is handled by validations.tsx utilities.
 *
 * This screen reads from BookingContext.state.appointments and renders them.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useBooking } from '../../context/BookingContext';
import { Appointment } from '../../services/bookingService';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { formatDate, formatRelativeDate, parseISO } from '../../utils/transformDate';
import { isRequired, isFutureOrTodayDate } from '../../utils/validations';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

// ---------------------------------------------------------------------------
// APPOINTMENT STATUS CONFIG (Open/Closed — add new statuses here only)
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  Appointment['status'],
  { bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  Upcoming: { bg: '#D1FAE5', text: COLORS.success, icon: 'time-outline' },
  Completed: { bg: '#E2E8F0', text: COLORS.textLight, icon: 'checkmark-circle-outline' },
  Cancelled: { bg: '#FEE2E2', text: COLORS.error, icon: 'close-circle-outline' },
};

// ---------------------------------------------------------------------------
// APPOINTMENT CARD (SRP — rendering only)
// ---------------------------------------------------------------------------

interface AppointmentCardProps {
  item: Appointment;
  onManage: (item: Appointment) => void;
}

const AppointmentCard = React.memo(({ item, onManage }: AppointmentCardProps): React.JSX.Element => {
  const isCompleted = item.status === 'Completed';
  const isCancelled = item.status === 'Cancelled';
  const statusConf = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.Upcoming;
  const parsedDate = item.date ? parseISO(item.date) : null;

  return (
    <View style={[styles.card, (isCompleted || isCancelled) && styles.cardMuted]}>
      {/* Date Badge */}
      <View style={styles.dateBadge}>
        <Text style={[styles.dateDay, (isCompleted || isCancelled) && styles.textMuted]}>
          {parsedDate ? parsedDate.getDate() : '--'}
        </Text>
        <Text style={[styles.dateMonth, (isCompleted || isCancelled) && styles.textMuted]}>
          {parsedDate
            ? parsedDate.toLocaleString('default', { month: 'short' }).toUpperCase()
            : 'TBD'}
        </Text>
      </View>

      {/* Card Body */}
      <View style={styles.cardBody}>
        <Text
          style={[styles.cardTitle, (isCompleted || isCancelled) && styles.titleStrikethrough]}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        {/* Relative date (e.g. "Tomorrow", "Today") */}
        {parsedDate && (
          <Text style={styles.relativeDate}>
            <Ionicons name="calendar-outline" size={12} /> {formatRelativeDate(parsedDate)}
            {' · '}{formatDate(parsedDate)}
          </Text>
        )}

        {/* Provider + Location */}
        {item.provider && (
          <Text style={styles.detailText}>
            <Ionicons name="person-outline" size={12} /> {item.provider}
          </Text>
        )}
        {item.location && (
          <Text style={styles.detailText} numberOfLines={1}>
            <Ionicons name="location-outline" size={12} /> {item.location}
          </Text>
        )}

        {/* Status Badge + Action Button */}
        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusConf.bg }]}>
            <Ionicons name={statusConf.icon} size={12} color={statusConf.text} />
            <Text style={[styles.statusText, { color: statusConf.text }]}>{item.status}</Text>
          </View>
          {!isCompleted && !isCancelled && (
            <TouchableOpacity style={styles.manageBtn} onPress={() => onManage(item)}>
              <Text style={styles.manageBtnText}>Manage</Text>
              <Ionicons name="chevron-down" size={12} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
// MAIN SCREEN
// ---------------------------------------------------------------------------

/**
 * AppointmentList — Displays the user's care schedule with add/manage capabilities.
 * Uses a FlatList for performant rendering of long appointment lists.
 * A bottom-sheet modal enables creating new appointments with a date picker.
 */
export default function AppointmentList(): React.JSX.Element {
  const { state, loadAppointments, addAppointment, updateAppointmentStatus, deleteAppointment } =
    useBooking();

  // --- Local UI State (SRP) ---
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProvider, setNewProvider] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleError, setTitleError] = useState('');

  useEffect(() => {
    loadAppointments();
  }, []);

  // --- Handlers ---

  const handleDateChange = useCallback((_: any, date?: Date): void => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  }, []);

  const resetModal = useCallback((): void => {
    setNewTitle('');
    setNewProvider('');
    setSelectedDate(new Date());
    setTitleError('');
    setModalVisible(false);
  }, []);

  const handleSaveAppointment = useCallback(async (): Promise<void> => {
    // Validate using pure utility functions
    if (!isRequired(newTitle)) {
      setTitleError('Please enter the appointment reason.');
      return;
    }
    if (!isFutureOrTodayDate(selectedDate)) {
      Alert.alert('Invalid Date', 'You cannot book an appointment in the past.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addAppointment({
        title: newTitle.trim(),
        date: selectedDate.toISOString(),
        provider: newProvider.trim() || undefined,
      });
      resetModal();
    } catch {
      Alert.alert('Error', 'Could not save the appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [newTitle, newProvider, selectedDate, addAppointment, resetModal]);

  const handleManage = useCallback((appointment: Appointment): void => {
    Alert.alert(
      'Manage Appointment',
      `What would you like to do with "${appointment.title}"?`,
      [
        {
          text: '✅ Mark as Completed',
          onPress: () => updateAppointmentStatus(appointment.id, 'Completed'),
        },
        {
          text: '❌ Cancel Appointment',
          style: 'destructive',
          onPress: () => deleteAppointment(appointment.id),
        },
        { text: 'Close', style: 'cancel' },
      ]
    );
  }, [updateAppointmentStatus, deleteAppointment]);

  // --- Derived stats ---
  const upcomingCount = state.appointments.filter((a) => a.status === 'Upcoming').length;
  const completedCount = state.appointments.filter((a) => a.status === 'Completed').length;

  // --- Render ---

  if (state.isLoading && state.appointments.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Syncing your care schedule...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* ── STATS BANNER ── */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{upcomingCount}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{state.appointments.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* ── APPOINTMENT LIST ── */}
      {state.appointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={COLORS.border} />
          <Text style={styles.emptyTitle}>No Appointments Yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the + button to schedule your first care appointment
          </Text>
        </View>
      ) : (
        <FlatList
          data={state.appointments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AppointmentCard item={item} onManage={handleManage} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
        />
      )}

      {/* ── FLOATING ACTION BUTTON ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={COLORS.surface} />
      </TouchableOpacity>

      {/* ── ADD APPOINTMENT MODAL ── */}
      <Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Handle */}
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Book New Appointment</Text>

            <CustomInput
              label="Appointment Reason *"
              value={newTitle}
              onChangeText={(t) => { setNewTitle(t); setTitleError(''); }}
              iconName="clipboard-outline"
              error={titleError}
            />

            <CustomInput
              label="Care Provider (optional)"
              value={newProvider}
              onChangeText={setNewProvider}
              iconName="person-outline"
            />

            {/* Date Selector */}
            <Text style={styles.inputLabel}>Appointment Date *</Text>
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
              <Text style={styles.dateSelectorText}>{formatDate(selectedDate)}</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.textLight} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()} // ← Prevents past-date booking
              />
            )}

            <View style={styles.modalActions}>
              <CustomButton
                title="Save Appointment"
                onPress={handleSaveAppointment}
                loading={isSubmitting}
              />
              <CustomButton
                title="Cancel"
                variant="outline"
                onPress={resetModal}
                disabled={isSubmitting}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, fontSize: FONTS.body, color: COLORS.textLight },

  statsBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    paddingHorizontal: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.card,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: FONTS.h2, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: FONTS.micro, color: COLORS.textLight, marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },

  listContent: { padding: SIZES.padding, paddingBottom: 100 },

  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.cardPadding,
    marginBottom: 12,
    gap: 12,
    ...SHADOWS.card,
  },
  cardMuted: { opacity: 0.65 },

  dateBadge: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  dateDay: { fontSize: FONTS.h3, fontWeight: '800', color: COLORS.primary },
  dateMonth: { fontSize: FONTS.micro, color: COLORS.primary, fontWeight: '700' },
  textMuted: { color: COLORS.textLight },

  cardBody: { flex: 1, gap: 3 },
  cardTitle: { fontSize: FONTS.body, fontWeight: '700', color: COLORS.text },
  titleStrikethrough: { textDecorationLine: 'line-through', color: COLORS.textLight },
  relativeDate: { fontSize: FONTS.micro, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  detailText: { fontSize: FONTS.caption, color: COLORS.textLight },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: SIZES.pill,
  },
  statusText: { fontSize: FONTS.micro, fontWeight: '700' },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: SIZES.pill,
  },
  manageBtnText: { fontSize: FONTS.micro, fontWeight: '700', color: COLORS.primary },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: FONTS.h3, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  emptySubtitle: { fontSize: FONTS.caption, color: COLORS.textLight, textAlign: 'center', marginTop: 8 },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    ...SHADOWS.modal,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: FONTS.h2, fontWeight: '800', color: COLORS.text, marginBottom: 20 },
  inputLabel: { fontSize: FONTS.caption, fontWeight: '600', color: COLORS.textLight, marginBottom: 8 },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    gap: 10,
  },
  dateSelectorText: { flex: 1, fontSize: FONTS.body, color: COLORS.text, fontWeight: '500' },
  modalActions: { gap: 0, marginTop: 4 },
});