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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
  { bg: string; text: string; icon: keyof typeof Ionicons.glyphMap; accentColor: string }
> = {
  Upcoming: { bg: '#D1FAE5', text: COLORS.success, icon: 'time-outline', accentColor: COLORS.success },
  Completed: { bg: '#E2E8F0', text: COLORS.textLight, icon: 'checkmark-circle-outline', accentColor: COLORS.border },
  Cancelled: { bg: '#FEE2E2', text: COLORS.error, icon: 'close-circle-outline', accentColor: COLORS.error },
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
    <View style={[
      styles.card,
      (isCompleted || isCancelled) && styles.cardMuted,
      { borderLeftColor: statusConf.accentColor },
    ]}>
      {/* Date Badge */}
      <View style={[styles.dateBadge, (isCompleted || isCancelled) && styles.dateBadgeMuted]}>
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

        {/* Relative date */}
        {parsedDate && (
          <Text style={styles.relativeDate}>
            <Ionicons name="calendar-outline" size={12} /> {formatRelativeDate(parsedDate)}
            {' · '}{formatDate(parsedDate)}
          </Text>
        )}

        {/* Provider + Location */}
        {item.provider && (
          <View style={styles.detailRow}>
            <Ionicons name="person-circle-outline" size={13} color={COLORS.textLight} />
            <Text style={styles.detailText}>{item.provider}</Text>
          </View>
        )}
        {item.location && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.textLight} />
            <Text style={styles.detailText} numberOfLines={1}>{item.location}</Text>
          </View>
        )}

        {/* Status Badge + Action Button */}
        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusConf.bg }]}>
            <Ionicons name={statusConf.icon} size={12} color={statusConf.text} />
            <Text style={[styles.statusText, { color: statusConf.text }]}>{item.status}</Text>
          </View>
          {!isCompleted && !isCancelled && (
            <TouchableOpacity style={styles.manageBtn} onPress={() => onManage(item)}>
              <Ionicons name="ellipsis-horizontal" size={14} color={COLORS.primary} />
              <Text style={styles.manageBtnText}>Manage</Text>
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
  const [newLocation, setNewLocation] = useState('');
  const [newNotes, setNewNotes] = useState('');
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
    setNewLocation('');
    setNewNotes('');
    setSelectedDate(new Date());
    setTitleError('');
    setModalVisible(false);
  }, []);

  const handleSaveAppointment = useCallback(async (): Promise<void> => {
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
        location: newLocation.trim() || undefined,
        notes: newNotes.trim() || undefined,
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.gradientStart} />

      {/* ── GRADIENT HEADER ── */}
      <View style={styles.headerBg}>
        <View style={styles.headerDecor1} />
        <View style={styles.headerDecor2} />
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>My Schedule</Text>
            <Text style={styles.headerSubtitle}>Your upcoming care appointments</Text>
          </View>
          {state.appointments.length > 0 && (
            <TouchableOpacity
              style={styles.headerAddBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={22} color={COLORS.surface} />
            </TouchableOpacity>
          )}
        </View>

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
      </View>

      {/* ── APPOINTMENT LIST ── */}
      {state.appointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="calendar-outline" size={44} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Appointments Yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the + button to schedule your first care appointment
          </Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add-circle" size={18} color={COLORS.surface} />
            <Text style={styles.emptyAddBtnText}>Book First Appointment</Text>
          </TouchableOpacity>
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

      {/* ── ADD APPOINTMENT MODAL ── */}
      <Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView
          style={styles.modalKeyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Modal Handle */}
              <View style={styles.modalHandle} />

              <View style={styles.modalTitleRow}>
                <View style={styles.modalTitleIcon}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.modalTitle}>Book Appointment</Text>
              </View>

              {/* Scrollable form */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                contentContainerStyle={styles.modalScrollContent}
              >
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

                <CustomInput
                  label="Location / Hospital (optional)"
                  value={newLocation}
                  onChangeText={setNewLocation}
                  iconName="location-outline"
                />

                {/* Date Selector */}
                <Text style={styles.inputLabel}>Appointment Date *</Text>
                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => setShowDatePicker(true)}
                >
                  <View style={styles.dateSelectorIcon}>
                    <Ionicons name="calendar" size={16} color={COLORS.primary} />
                  </View>
                  <Text style={styles.dateSelectorText}>{formatDate(selectedDate)}</Text>
                  <Ionicons name="chevron-down" size={16} color={COLORS.textLight} />
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}

                <CustomInput
                  label="Notes (optional)"
                  value={newNotes}
                  onChangeText={setNewNotes}
                  iconName="document-text-outline"
                  multiline
                  numberOfLines={2}
                />

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
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
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

  // Header
  headerBg: {
    backgroundColor: COLORS.gradientStart,
    paddingBottom: 0,
    overflow: 'visible', // Changed from hidden to allow stats banner to overlap
    zIndex: 10,          // Added zIndex so it renders above the FlatList
    position: 'relative',
  },
  headerDecor1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -60,
    right: -50,
    zIndex: -1,
  },
  headerDecor2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: 30,
    left: -20,
    zIndex: -1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: FONTS.h2, fontWeight: '800', color: COLORS.surface, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: FONTS.caption, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  headerAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stats
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.padding,
    marginTop: 4,
    marginBottom: -14,
    borderRadius: SIZES.borderRadius,
    paddingVertical: 14,
    ...SHADOWS.cardStrong,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: FONTS.h2, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: FONTS.micro, color: COLORS.textLight, marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },

  listContent: { padding: SIZES.padding, paddingTop: 40, paddingBottom: 100 },

  // Appointment Cards
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.cardPadding,
    marginBottom: 12,
    gap: 12,
    borderLeftWidth: 4,
    ...SHADOWS.card,
  },
  cardMuted: { opacity: 0.65 },

  dateBadge: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryTint,
    borderRadius: 10,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  dateBadgeMuted: { backgroundColor: COLORS.borderSoft },
  dateDay: { fontSize: FONTS.h3, fontWeight: '800', color: COLORS.primary },
  dateMonth: { fontSize: FONTS.micro, color: COLORS.primary, fontWeight: '700' },
  textMuted: { color: COLORS.textLight },

  cardBody: { flex: 1, gap: 4 },
  cardTitle: { fontSize: FONTS.body, fontWeight: '700', color: COLORS.text },
  titleStrikethrough: { textDecorationLine: 'line-through', color: COLORS.textLight },
  relativeDate: { fontSize: FONTS.micro, color: COLORS.primary, fontWeight: '600', marginTop: 1 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: FONTS.caption, color: COLORS.textLight, flex: 1 },

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
    paddingVertical: 4,
    borderRadius: SIZES.pill,
  },
  statusText: { fontSize: FONTS.micro, fontWeight: '700' },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: COLORS.primaryTint,
    borderRadius: SIZES.pill,
  },
  manageBtnText: { fontSize: FONTS.micro, fontWeight: '700', color: COLORS.primary },

  // Empty State
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 20 },
  emptyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: FONTS.h3, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptySubtitle: { fontSize: FONTS.caption, color: COLORS.textLight, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.pill,
    paddingHorizontal: 20,
    paddingVertical: 12,
    ...SHADOWS.button,
  },
  emptyAddBtnText: { fontSize: FONTS.body, fontWeight: '700', color: COLORS.surface },

  // Modal
  modalKeyboardView: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 24,
    maxHeight: '92%',
    ...SHADOWS.modal,
  },
  modalScrollContent: { paddingBottom: 36 },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  modalTitleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: { fontSize: FONTS.h2, fontWeight: '800', color: COLORS.text },
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
  dateSelectorIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateSelectorText: { flex: 1, fontSize: FONTS.body, color: COLORS.text, fontWeight: '500' },
  modalActions: { gap: 0, marginTop: 4 },
});