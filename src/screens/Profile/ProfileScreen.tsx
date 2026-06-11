// src/screens/Profile/ProfileScreen.tsx
/**
 * @file ProfileScreen.tsx
 * @description User profile screen displaying account info and care role.
 *
 * SOLID Principle: Single Responsibility — this screen ONLY renders the user's
 * profile data from AuthContext. It has zero business logic.
 * Logout is delegated entirely to AuthContext.logout.
 *
 * Design: Full-screen profile with gradient hero, avatar with initials,
 * stats row, role badge, and care-specific quick actions.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { useMedical } from '../../context/MedicalContext';
import CustomButton from '../../components/CustomButton';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';

// ---------------------------------------------------------------------------
// QUICK ACTION ITEM
// ---------------------------------------------------------------------------

interface QuickActionItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  onPress: () => void;
}

const QuickAction = ({ item }: { item: QuickActionItem }) => (
  <TouchableOpacity style={styles.actionItem} onPress={item.onPress} activeOpacity={0.7}>
    <View style={[styles.actionIconContainer, { backgroundColor: item.bgColor }]}>
      <Ionicons name={item.icon} size={22} color={item.color} />
    </View>
    <View style={styles.actionBody}>
      <Text style={styles.actionLabel}>{item.label}</Text>
      <Text style={styles.actionDescription}>{item.description}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
  </TouchableOpacity>
);

// ---------------------------------------------------------------------------
// MAIN SCREEN
// ---------------------------------------------------------------------------

/**
 * ProfileScreen — Displays the authenticated user's profile, care statistics,
 * and account management options.
 */
export default function ProfileScreen(): JSX.Element {
  const { user, logout, isLoading } = useAuth();
  const { state: bookingState } = useBooking();
  const { state: medicalState } = useMedical();

  const [showDetails, setShowDetails] = useState(false);

  // Derive user initials for avatar
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  // Role-specific badge color
  const ROLE_COLOR: Record<string, string> = {
    Caregiver: COLORS.success,
    Patient: COLORS.primary,
    Provider: COLORS.warning,
  };
  const roleBadgeColor = ROLE_COLOR[user?.role ?? ''] ?? COLORS.primary;

  // Derived stats from context
  const upcomingCount = bookingState.appointments.filter((a) => a.status === 'Upcoming').length;
  const completedCount = bookingState.appointments.filter((a) => a.status === 'Completed').length;
  const prescriptionsCount = medicalState.records.length;

  // ---------------------------------------------------------------------------
  // LOGOUT HANDLER
  // ---------------------------------------------------------------------------

  const handleLogout = (): void => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of CareSync?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  // ---------------------------------------------------------------------------
  // QUICK ACTIONS
  // ---------------------------------------------------------------------------

  const quickActions: QuickActionItem[] = [
    {
      icon: 'notifications-outline',
      label: 'Notification Preferences',
      description: 'Manage reminders and alerts',
      color: COLORS.warning,
      bgColor: '#FEF3C7',
      onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available in v2.'),
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Privacy & Security',
      description: 'Data permissions and security settings',
      color: COLORS.success,
      bgColor: '#D1FAE5',
      onPress: () => Alert.alert('Coming Soon', 'Privacy settings will be available in v2.'),
    },
    {
      icon: 'people-outline',
      label: 'Care Team',
      description: 'Manage shared access with family members',
      color: COLORS.primary,
      bgColor: '#EFF6FF',
      onPress: () => Alert.alert('Coming Soon', 'Care team management will be available in v2.'),
    },
    {
      icon: 'download-outline',
      label: 'Export Records',
      description: 'Download your medical records as PDF',
      color: '#8B5CF6',
      bgColor: '#EDE9FE',
      onPress: () => Alert.alert('Coming Soon', 'Export will be available in v2.'),
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      description: 'FAQs, tutorials, and contact support',
      color: COLORS.textLight,
      bgColor: COLORS.border,
      onPress: () => Alert.alert('CareSync Support', 'Email: support@caresync.health\nVersion: 1.0.0'),
    },
  ];

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[]}>

        {/* ── HERO HEADER ── */}
        <View style={styles.heroHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>

          {/* Role Badge */}
          <View style={[styles.roleBadge, { borderColor: roleBadgeColor }]}>
            <Ionicons
              name={
                user?.role === 'Caregiver'
                  ? 'people'
                  : user?.role === 'Provider'
                  ? 'medical'
                  : 'person'
              }
              size={13}
              color={roleBadgeColor}
            />
            <Text style={[styles.roleText, { color: roleBadgeColor }]}>{user?.role ?? 'User'}</Text>
          </View>
        </View>

        {/* ── STATS ROW ── */}
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{upcomingCount}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{prescriptionsCount}</Text>
            <Text style={styles.statLabel}>Prescriptions</Text>
          </View>
        </View>

        {/* ── ACCOUNT DETAILS ── */}
        {showDetails && (
          <View style={styles.detailsCard}>
            <Text style={styles.sectionLabel}>Account Info</Text>
            <View style={styles.detailRow}>
              <Ionicons name="key-outline" size={16} color={COLORS.textLight} />
              <Text style={styles.detailLabel}>User ID</Text>
              <Text style={styles.detailValue}>{user?.id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="mail-outline" size={16} color={COLORS.textLight} />
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{user?.email}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="lock-closed-outline" size={16} color={COLORS.textLight} />
              <Text style={styles.detailLabel}>Token</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {user?.token?.substring(0, 20)}…
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.detailsToggle}
          onPress={() => setShowDetails((v) => !v)}
        >
          <Text style={styles.detailsToggleText}>
            {showDetails ? 'Hide Account Details' : 'Show Account Details'}
          </Text>
          <Ionicons
            name={showDetails ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={COLORS.primary}
          />
        </TouchableOpacity>

        {/* ── QUICK ACTIONS ── */}
        <Text style={styles.sectionLabel}>Settings & Actions</Text>
        <View style={styles.actionsCard}>
          {quickActions.map((action, idx) => (
            <React.Fragment key={idx}>
              <QuickAction item={action} />
              {idx < quickActions.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── SIGN OUT ── */}
        <View style={styles.signOutContainer}>
          <CustomButton
            title="Sign Out"
            variant="danger"
            onPress={handleLogout}
            loading={isLoading}
          />
        </View>

        <Text style={styles.versionText}>CareSync v1.0.0 · © 2026 Code Quartet</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  heroHeader: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: SIZES.padding,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 34, color: COLORS.surface, fontWeight: '800', letterSpacing: -1 },
  userName: { fontSize: FONTS.h2, fontWeight: '800', color: COLORS.surface },
  userEmail: { fontSize: FONTS.caption, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    borderWidth: 1.5,
    borderRadius: SIZES.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  roleText: { fontSize: FONTS.caption, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.padding,
    marginTop: -16,
    borderRadius: SIZES.borderRadius,
    paddingVertical: 16,
    ...SHADOWS.card,
  },
  statBlock: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: FONTS.h2, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: FONTS.micro, color: COLORS.textLight, marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },

  detailsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    margin: SIZES.padding,
    marginBottom: 0,
    padding: SIZES.cardPadding,
    ...SHADOWS.card,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: { fontSize: FONTS.caption, color: COLORS.textLight, width: 60 },
  detailValue: { fontSize: FONTS.caption, color: COLORS.text, fontWeight: '600', flex: 1 },

  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    marginHorizontal: SIZES.padding,
  },
  detailsToggleText: { fontSize: FONTS.caption, color: COLORS.primary, fontWeight: '600' },

  sectionLabel: {
    fontSize: FONTS.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: SIZES.padding,
    marginBottom: 10,
    marginTop: 4,
  },

  actionsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    marginHorizontal: SIZES.padding,
    marginBottom: 12,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.cardPadding,
    gap: 12,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBody: { flex: 1 },
  actionLabel: { fontSize: FONTS.caption, fontWeight: '700', color: COLORS.text },
  actionDescription: { fontSize: FONTS.micro, color: COLORS.textLight, marginTop: 1 },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 68 },

  signOutContainer: { paddingHorizontal: SIZES.padding, marginTop: 8, marginBottom: 8 },

  versionText: {
    textAlign: 'center',
    fontSize: FONTS.micro,
    color: COLORS.border,
    marginBottom: 24,
  },
});