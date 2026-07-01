// src/screens/Booking/AppointmentList.tsx
/**
 * @file AppointmentList.tsx
 * @description Main appointments listing screen — the core of the Booking Engine.
 *
 * Implements the CareSync Premium UI design with LinearGradients, custom fonts,
 * and glassmorphism styling.
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
import { LinearGradient } from 'expo-linear-gradient';
import { useBooking } from '../../context/BookingContext';
import { Appointment } from '../../services/bookingService';
import { formatDate, formatRelativeDate, parseISO } from '../../utils/transformDate';
import { isRequired, isFutureOrTodayDate } from '../../utils/validations';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

// ---------------------------------------------------------------------------
// APPOINTMENT STATUS CONFIG
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  Appointment['status'],
  { bg: string; text: string; icon: keyof typeof Ionicons.glyphMap; accentColor: string }
> = {
  Upcoming: { bg: '#eef0ff', text: '#006591', icon: 'time-outline', accentColor: '#006591' },
  Completed: { bg: '#f2f3ff', text: '#6e7881', icon: 'checkmark-circle-outline', accentColor: '#bec8d2' },
  Cancelled: { bg: '#ffdad6', text: '#ba1a1a', icon: 'close-circle-outline', accentColor: '#ba1a1a' },
};

// ---------------------------------------------------------------------------
// APPOINTMENT CARD
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

        {parsedDate && (
          <Text style={styles.relativeDate}>
            <Ionicons name="calendar-outline" size={12} /> {formatRelativeDate(parsedDate)}
            {' · '}{formatDate(parsedDate)}
          </Text>
        )}

        {item.provider && (
          <View style={styles.detailRow}>
            <Ionicons name="person-circle-outline" size={13} color="#6e7881" />
            <Text style={styles.detailText}>{item.provider}</Text>
          </View>
        )}
        {item.location && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={13} color="#6e7881" />
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
              <Ionicons name="ellipsis-horizontal" size={14} color="#006591" />
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

export default function AppointmentList(): React.JSX.Element {
  const { state, loadAppointments, addAppointment, updateAppointmentStatus, deleteAppointment } =
    useBooking();

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

  const upcomingCount = state.appointments.filter((a) => a.status === 'Upcoming').length;
  const completedCount = state.appointments.filter((a) => a.status === 'Completed').length;

  if (state.isLoading && state.appointments.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#006591" />
        <Text style={styles.loadingText}>Syncing your care schedule...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* GRADIENT HEADER */}
      <LinearGradient colors={['#006591', '#0ea5e9']} style={styles.headerBg}>
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
              <Ionicons name="add" size={22} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>

        {/* STATS BANNER */}
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
      </LinearGradient>

      {/* APPOINTMENT LIST */}
      {state.appointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="calendar-outline" size={44} color="#006591" />
          </View>
          <Text style={styles.emptyTitle}>No Appointments Yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the + button to schedule your first care appointment
          </Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => setModalVisible(true)}
          >
            <LinearGradient
              colors={['#006591', '#0ea5e9']}
              style={styles.emptyAddBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="add-circle" size={18} color="#ffffff" />
              <Text style={styles.emptyAddBtnText}>Book First Appointment</Text>
            </LinearGradient>
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

      {/* ADD APPOINTMENT MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView
          style={styles.modalKeyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />

              <View style={styles.modalTitleRow}>
                <View style={styles.modalTitleIcon}>
                  <Ionicons name="calendar-outline" size={18} color="#006591" />
                </View>
                <Text style={styles.modalTitle}>Book Appointment</Text>
              </View>

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

                <Text style={styles.inputLabel}>Appointment Date *</Text>
                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => setShowDatePicker(true)}
                >
                  <View style={styles.dateSelectorIcon}>
                    <Ionicons name="calendar" size={16} color="#006591" />
                  </View>
                  <Text style={styles.dateSelectorText}>{formatDate(selectedDate)}</Text>
                  <Ionicons name="chevron-down" size={16} color="#6e7881" />
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
  container: { flex: 1, backgroundColor: '#faf8ff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#faf8ff' },
  loadingText: { marginTop: 12, fontSize: 14, fontFamily: 'Manrope_500Medium', color: '#6e7881' },

  headerBg: {
    paddingBottom: 0,
    overflow: 'visible',
    zIndex: 10,
    position: 'relative',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40, // Increased for stats banner overlap
  },
  headerTitle: { fontSize: 24, fontFamily: 'Manrope_800ExtraBold', color: '#ffffff', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, fontFamily: 'Manrope_500Medium', color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  headerAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  statsBanner: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: -32,
    marginBottom: -16, // pull it over the bottom edge of header
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#1f2687',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(190, 200, 210, 0.2)',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontFamily: 'Manrope_800ExtraBold', color: '#006591' },
  statLabel: { fontSize: 12, fontFamily: 'Manrope_600SemiBold', color: '#6e7881', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: 'rgba(190, 200, 210, 0.3)', marginVertical: 4 },

  listContent: { padding: 16, paddingTop: 40, paddingBottom: 120 },

  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 16,
    borderLeftWidth: 4,
    shadowColor: '#1f2687',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderColor: 'rgba(190, 200, 210, 0.1)',
  },
  cardMuted: { opacity: 0.65 },

  dateBadge: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef0ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  dateBadgeMuted: { backgroundColor: '#f2f3ff' },
  dateDay: { fontSize: 20, fontFamily: 'Manrope_800ExtraBold', color: '#006591' },
  dateMonth: { fontSize: 12, fontFamily: 'Manrope_700Bold', color: '#006591' },
  textMuted: { color: '#6e7881' },

  cardBody: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 16, fontFamily: 'Manrope_700Bold', color: '#131b2e' },
  titleStrikethrough: { textDecorationLine: 'line-through', color: '#6e7881' },
  relativeDate: { fontSize: 12, fontFamily: 'Manrope_600SemiBold', color: '#006591', marginTop: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  detailText: { fontSize: 12, fontFamily: 'Manrope_500Medium', color: '#6e7881', flex: 1 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 10, fontFamily: 'Manrope_700Bold' },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eef0ff',
    borderRadius: 12,
  },
  manageBtnText: { fontSize: 10, fontFamily: 'Manrope_700Bold', color: '#006591' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 40 },
  emptyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#eef0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontFamily: 'Manrope_700Bold', color: '#131b2e', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, fontFamily: 'Manrope_500Medium', color: '#6e7881', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  emptyAddBtn: {
    borderRadius: 12,
    shadowColor: '#006591',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyAddBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyAddBtnText: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#ffffff' },

  modalKeyboardView: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 27, 46, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 32,
    maxHeight: '92%',
  },
  modalScrollContent: { paddingBottom: 40 },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#bec8d2',
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  modalTitleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eef0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 24, fontFamily: 'Manrope_800ExtraBold', color: '#131b2e' },
  inputLabel: { fontSize: 12, fontFamily: 'Manrope_600SemiBold', color: '#6e7881', marginBottom: 8 },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf8ff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bec8d2',
    marginBottom: 24,
    gap: 12,
  },
  dateSelectorIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#eef0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateSelectorText: { flex: 1, fontSize: 14, fontFamily: 'Manrope_500Medium', color: '#131b2e' },
  modalActions: { gap: 8, marginTop: 8 },
});