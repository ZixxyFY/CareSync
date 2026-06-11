// src/screens/Profile/ProfileSetting.tsx
/**
 * @file ProfileSetting.tsx
 * @description Account settings screen — a dedicated settings page accessible
 * from the Profile tab or via navigation.
 *
 * SOLID Principle: SRP — this screen only manages settings UI state.
 * Any settings-saving logic would live in a dedicated SettingsContext in v2.
 *
 * Currently scaffolded with a production-quality UI for common settings
 * that would be wired to their respective backends in future sprints.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';

// ---------------------------------------------------------------------------
// SETTINGS ROW COMPONENT
// ---------------------------------------------------------------------------

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  iconColor?: string;
  iconBg?: string;
  rightContent?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}

const SettingsRow = ({
  icon,
  label,
  iconColor = COLORS.primary,
  iconBg = '#EFF6FF',
  rightContent,
  onPress,
  destructive = false,
}: SettingsRowProps) => (
  <TouchableOpacity
    style={styles.settingsRow}
    onPress={onPress}
    disabled={!onPress && !rightContent}
    activeOpacity={0.7}
  >
    <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <Text style={[styles.rowLabel, destructive && { color: COLORS.error }]}>{label}</Text>
    {rightContent ?? <Ionicons name="chevron-forward" size={16} color={COLORS.border} />}
  </TouchableOpacity>
);

// ---------------------------------------------------------------------------
// MAIN SCREEN
// ---------------------------------------------------------------------------

/**
 * ProfileSetting — Account and app settings screen.
 * Toggle notifications, language, theme, and manage account actions.
 */
export default function ProfileSetting(): JSX.Element {
  const { user } = useAuth();

  // Local toggle states (would persist via AsyncStorage in production)
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [medicationAlerts, setMedicationAlerts] = useState(true);
  const [caregiverUpdates, setCaregiverUpdates] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [isEditingName, setIsEditingName] = useState(false);

  const handleSaveName = (): void => {
    if (!displayName.trim()) {
      Alert.alert('Validation', 'Name cannot be empty.');
      return;
    }
    setIsEditingName(false);
    Alert.alert('Saved', 'Display name updated successfully!');
  };

  const handleDeleteAccount = (): void => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => Alert.alert('Request Submitted', 'Your account deletion request has been submitted.'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Account Settings</Text>

        {/* ── PROFILE SECTION ── */}
        <Text style={styles.sectionLabel}>Profile</Text>
        <View style={styles.card}>
          {isEditingName ? (
            <View style={{ padding: 4 }}>
              <CustomInput
                label="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
                iconName="person-outline"
                autoCapitalize="words"
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <CustomButton title="Save" onPress={handleSaveName} />
                </View>
                <View style={{ flex: 1 }}>
                  <CustomButton
                    title="Cancel"
                    variant="outline"
                    onPress={() => setIsEditingName(false)}
                  />
                </View>
              </View>
            </View>
          ) : (
            <SettingsRow
              icon="person-outline"
              label={`Display Name: ${user?.name ?? '—'}`}
              onPress={() => setIsEditingName(true)}
              iconBg="#EFF6FF"
            />
          )}
          <View style={styles.divider} />
          <SettingsRow
            icon="mail-outline"
            label={user?.email ?? 'Email not set'}
            iconColor={COLORS.textLight}
            iconBg={COLORS.border}
            onPress={() => Alert.alert('Email Change', 'Email changes require verification in v2.')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="lock-closed-outline"
            label="Change Password"
            iconColor={COLORS.warning}
            iconBg="#FEF3C7"
            onPress={() => Alert.alert('Coming Soon', 'Password change will be available in v2.')}
          />
        </View>

        {/* ── NOTIFICATIONS ── */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="calendar-outline"
            label="Appointment Reminders"
            iconColor={COLORS.primary}
            iconBg="#EFF6FF"
            rightContent={
              <Switch
                value={appointmentReminders}
                onValueChange={setAppointmentReminders}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            }
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="medical-outline"
            label="Medication Alerts"
            iconColor={COLORS.error}
            iconBg="#FEE2E2"
            rightContent={
              <Switch
                value={medicationAlerts}
                onValueChange={setMedicationAlerts}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            }
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="people-outline"
            label="Caregiver Updates"
            iconColor={COLORS.success}
            iconBg="#D1FAE5"
            rightContent={
              <Switch
                value={caregiverUpdates}
                onValueChange={setCaregiverUpdates}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            }
          />
        </View>

        {/* ── APPEARANCE ── */}
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="moon-outline"
            label="Dark Mode"
            iconColor="#8B5CF6"
            iconBg="#EDE9FE"
            rightContent={
              <Switch
                value={darkMode}
                onValueChange={(v) => {
                  setDarkMode(v);
                  Alert.alert('Coming Soon', 'Dark mode will be fully implemented in v2.');
                }}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            }
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="language-outline"
            label="Language: English (India)"
            onPress={() => Alert.alert('Coming Soon', 'Multi-language support coming in v2.')}
          />
        </View>

        {/* ── DATA & PRIVACY ── */}
        <Text style={styles.sectionLabel}>Data & Privacy</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="download-outline"
            label="Export My Data"
            iconColor="#8B5CF6"
            iconBg="#EDE9FE"
            onPress={() => Alert.alert('Coming Soon', 'Data export will be available in v2.')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="shield-outline"
            label="Privacy Policy"
            onPress={() => Alert.alert('Privacy Policy', 'CareSync respects your privacy. Full policy at caresync.health/privacy')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="trash-outline"
            label="Delete Account"
            iconColor={COLORS.error}
            iconBg="#FEE2E2"
            destructive
            onPress={handleDeleteAccount}
          />
        </View>

        <Text style={styles.versionText}>CareSync v1.0.0 · Build 2026.06.09</Text>
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
  screenTitle: {
    fontSize: FONTS.h1,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  sectionLabel: {
    fontSize: FONTS.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    marginBottom: 20,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.cardPadding,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: FONTS.caption,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 64,
  },
  versionText: {
    textAlign: 'center',
    fontSize: FONTS.micro,
    color: COLORS.border,
    marginBottom: 8,
  },
});