// src/screens/Profile/ProfileScreen.tsx
/**
 * @file ProfileScreen.tsx
 * @description User profile screen displaying account info and care role.
 *
 * SOLID Principle: Single Responsibility — this screen ONLY renders the user's
 * profile data from AuthContext. It has zero business logic.
 * Logout is delegated entirely to AuthContext.logout.
 *
 * Design: Premium dark gradient hero with animated avatar ring, glassmorphism stats card,
 * and polished quick-action list.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Animated,
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
      <Ionicons name={item.icon} size={20} color={item.color} />
    </View>
    <View style={styles.actionBody}>
      <Text style={styles.actionLabel}>{item.label}</Text>
      <Text style={styles.actionDescription}>{item.description}</Text>
    </View>
    <View style={styles.actionChevron}>
      <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
    </View>
  </TouchableOpacity>
);

// ---------------------------------------------------------------------------
// ANIMATED STAT BLOCK
// ---------------------------------------------------------------------------

const AnimatedStat = ({ value, label, delay }: { value: number; label: string; delay: number }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.spring(anim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
    }, delay);
  }, [value]);

  return (
    <Animated.View
      style={[
        styles.statBlock,
        { opacity: anim, transform: [{ scale: anim }] },
      ]}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

// ---------------------------------------------------------------------------
// MAIN SCREEN
// ---------------------------------------------------------------------------

/**
 * ProfileScreen — Displays the authenticated user's profile, care statistics,
 * and account management options.
 */
export default function ProfileScreen(): React.JSX.Element {
  const { user, logout, isLoading } = useAuth();
  const { state: bookingState } = useBooking();
  const { state: medicalState } = useMedical();

  const [showDetails, setShowDetails] = useState(false);

  // Hero entrance animation
  const heroAnim = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.8)).current;
  const avatarRingOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(avatarScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(avatarRingOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  // Derive user initials for avatar
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  // Role-specific badge
  const ROLE_CONFIG: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap; bg: string }> = {
    Caregiver: { color: COLORS.success, icon: 'people', bg: '#D1FAE5' },
    Patient: { color: COLORS.primary, icon: 'person', bg: COLORS.primaryTint },
    Provider: { color: COLORS.warning, icon: 'medical', bg: '#FEF3C7' },
  };
  const roleConf = ROLE_CONFIG[user?.role ?? ''] ?? ROLE_CONFIG.Patient;

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
      bgColor: COLORS.primaryTint,
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.gradientStart} />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HERO HEADER ── */}
        <View style={styles.heroHeader}>
          {/* Decorative rings */}
          <View style={styles.heroDecor1} />
          <View style={styles.heroDecor2} />
          <View style={styles.heroDecor3} />

          <Animated.View style={[styles.avatarWrapper, { opacity: heroAnim }]}>
            {/* Outer animated ring */}
            <Animated.View style={[styles.avatarRing, { opacity: avatarRingOpacity }]} />
            {/* Avatar */}
            <Animated.View style={[styles.avatarContainer, { transform: [{ scale: avatarScale }] }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </Animated.View>
          </Animated.View>

          <Animated.View style={{ opacity: heroAnim, alignItems: 'center' }}>
            <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ''}</Text>

            {/* Role Badge */}
            <View style={[styles.roleBadge, { backgroundColor: roleConf.bg + '33', borderColor: roleConf.color + '60' }]}>
              <Ionicons name={roleConf.icon} size={13} color={roleConf.color} />
              <Text style={[styles.roleText, { color: roleConf.color }]}>{user?.role ?? 'User'}</Text>
            </View>
          </Animated.View>
        </View>

        {/* ── STATS ROW ── */}
        <View style={styles.statsRow}>
          <AnimatedStat value={upcomingCount} label="Upcoming" delay={200} />
          <View style={styles.statDivider} />
          <AnimatedStat value={completedCount} label="Completed" delay={350} />
          <View style={styles.statDivider} />
          <AnimatedStat value={prescriptionsCount} label="Prescriptions" delay={500} />
        </View>

        {/* ── ACCOUNT DETAILS ── */}
        {showDetails && (
          <View style={styles.detailsCard}>
            <Text style={styles.sectionLabel}>Account Info</Text>
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="key-outline" size={14} color={COLORS.primary} />
              </View>
              <Text style={styles.detailLabel}>User ID</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{user?.id}</Text>
            </View>
            <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: COLORS.border }]}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="mail-outline" size={14} color={COLORS.primary} />
              </View>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{user?.email}</Text>
            </View>
            <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: COLORS.border }]}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="lock-closed-outline" size={14} color={COLORS.primary} />
              </View>
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
          <Ionicons
            name={showDetails ? 'eye-off-outline' : 'eye-outline'}
            size={14}
            color={COLORS.primary}
          />
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

  // Hero
  heroHeader: {
    backgroundColor: COLORS.gradientStart,
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: SIZES.padding,
    overflow: 'hidden',
    position: 'relative',
  },
  heroDecor1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -80,
    right: -70,
  },
  heroDecor2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -50,
    left: -40,
  },
  heroDecor3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: 30,
    left: 20,
  },
  avatarWrapper: { alignItems: 'center', justifyContent: 'center', marginBottom: 14, position: 'relative' },
  avatarRing: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 34, color: COLORS.surface, fontWeight: '800', letterSpacing: -1 },
  userName: { fontSize: FONTS.h2, fontWeight: '800', color: COLORS.surface, letterSpacing: -0.5 },
  userEmail: { fontSize: FONTS.caption, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: SIZES.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  roleText: { fontSize: FONTS.caption, fontWeight: '700' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.padding,
    marginTop: -18,
    borderRadius: SIZES.borderRadiusLg,
    paddingVertical: 18,
    ...SHADOWS.cardStrong,
  },
  statBlock: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: FONTS.h2, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: FONTS.micro, color: COLORS.textLight, marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 6 },

  // Account Details
  detailsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    margin: SIZES.padding,
    marginBottom: 0,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  sectionLabel: {
    fontSize: FONTS.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: SIZES.padding,
    marginBottom: 10,
    marginTop: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: SIZES.cardPadding,
  },
  detailIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailLabel: { fontSize: FONTS.caption, color: COLORS.textLight, width: 56 },
  detailValue: { fontSize: FONTS.caption, color: COLORS.text, fontWeight: '600', flex: 1 },

  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginHorizontal: SIZES.padding,
  },
  detailsToggleText: { fontSize: FONTS.caption, color: COLORS.primary, fontWeight: '600' },

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
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBody: { flex: 1 },
  actionLabel: { fontSize: FONTS.caption, fontWeight: '700', color: COLORS.text },
  actionDescription: { fontSize: FONTS.micro, color: COLORS.textLight, marginTop: 1 },
  actionChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: { height: 1, backgroundColor: COLORS.borderSoft, marginLeft: 68 },

  signOutContainer: { paddingHorizontal: SIZES.padding, marginTop: 8, marginBottom: 8 },

  versionText: {
    textAlign: 'center',
    fontSize: FONTS.micro,
    color: COLORS.border,
    marginBottom: 24,
  },
});