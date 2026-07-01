// src/screens/Profile/ProfileScreen.tsx
/**
 * @file ProfileScreen.tsx
 * @description User profile screen displaying account info and care role.
 *
 * Implements the new CareSync Premium UI design with LinearGradients,
 * custom typography, and glassmorphism styling.
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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { useMedical } from '../../context/MedicalContext';

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
      <Ionicons name="chevron-forward" size={16} color="#6e7881" />
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

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const upcomingCount = bookingState.appointments.filter((a) => a.status === 'Upcoming').length;
  const completedCount = bookingState.appointments.filter((a) => a.status === 'Completed').length;
  const prescriptionsCount = medicalState.records.length;

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

  const quickActions: QuickActionItem[] = [
    {
      icon: 'notifications-outline',
      label: 'Notification Preferences',
      description: 'Manage reminders and alerts',
      color: '#006591',
      bgColor: '#eaedff',
      onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available in v2.'),
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Privacy & Security',
      description: 'Data permissions and security settings',
      color: '#006591',
      bgColor: '#eaedff',
      onPress: () => Alert.alert('Coming Soon', 'Privacy settings will be available in v2.'),
    },
    {
      icon: 'people-outline',
      label: 'Care Team',
      description: 'Manage shared access with family members',
      color: '#006591',
      bgColor: '#eaedff',
      onPress: () => Alert.alert('Coming Soon', 'Care team management will be available in v2.'),
    },
    {
      icon: 'download-outline',
      label: 'Export Records',
      description: 'Download your medical records as PDF',
      color: '#006591',
      bgColor: '#eaedff',
      onPress: () => Alert.alert('Coming Soon', 'Export will be available in v2.'),
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      description: 'FAQs, tutorials, and contact support',
      color: '#6e7881',
      bgColor: '#f2f3ff',
      onPress: () => Alert.alert('CareSync Support', 'Email: support@caresync.health\nVersion: 1.0.0'),
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Hero Header with Gradients */}
        <LinearGradient colors={['#006591', '#0ea5e9']} style={styles.heroHeader}>
          {/* Decorative rings */}
          <View style={styles.heroDecor1} />
          <View style={styles.heroDecor2} />

          <Animated.View style={[styles.avatarWrapper, { opacity: heroAnim }]}>
            <Animated.View style={[styles.avatarRing, { opacity: avatarRingOpacity }]} />
            <Animated.View style={[styles.avatarContainer, { transform: [{ scale: avatarScale }] }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </Animated.View>
          </Animated.View>

          <Animated.View style={{ opacity: heroAnim, alignItems: 'center' }}>
            <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ''}</Text>

            <View style={styles.roleBadge}>
              <Ionicons name="person" size={12} color="#ffffff" />
              <Text style={styles.roleText}>{user?.role ?? 'Patient'}</Text>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <AnimatedStat value={upcomingCount} label="Upcoming" delay={200} />
          <View style={styles.statDivider} />
          <AnimatedStat value={completedCount} label="Completed" delay={350} />
          <View style={styles.statDivider} />
          <AnimatedStat value={prescriptionsCount} label="Records" delay={500} />
        </View>

        {/* Account Details Toggle */}
        <TouchableOpacity
          style={styles.detailsToggle}
          onPress={() => setShowDetails((v) => !v)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showDetails ? 'eye-off-outline' : 'eye-outline'}
            size={16}
            color="#006591"
          />
          <Text style={styles.detailsToggleText}>
            {showDetails ? 'Hide Account Details' : 'Show Account Details'}
          </Text>
        </TouchableOpacity>

        {/* Account Details Section */}
        {showDetails && (
          <View style={styles.detailsCard}>
            <Text style={styles.sectionLabel}>Account Info</Text>
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="key-outline" size={16} color="#006591" />
              </View>
              <View style={styles.detailTextWrap}>
                <Text style={styles.detailLabel}>User ID</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{user?.id}</Text>
              </View>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="mail-outline" size={16} color="#006591" />
              </View>
              <View style={styles.detailTextWrap}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{user?.email}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Settings & Actions */}
        <Text style={styles.sectionLabelMain}>Settings & Actions</Text>
        <View style={styles.actionsCard}>
          {quickActions.map((action, idx) => (
            <React.Fragment key={idx}>
              <QuickAction item={action} />
              {idx < quickActions.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <TouchableOpacity onPress={handleLogout} disabled={isLoading} activeOpacity={0.8}>
            <View style={styles.signOutButton}>
              <Ionicons name="log-out-outline" size={20} color="#ba1a1a" style={{ marginRight: 8 }} />
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </View>
          </TouchableOpacity>
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
  safe: { flex: 1, backgroundColor: '#faf8ff' },

  heroHeader: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 64,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroDecor1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -80,
    right: -70,
  },
  heroDecor2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -50,
    left: -40,
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatarRing: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    color: '#ffffff',
    fontFamily: 'Manrope_800ExtraBold',
    letterSpacing: -1,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Manrope_700Bold',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: '#ffffff',
    marginLeft: 6,
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: -32,
    borderRadius: 16,
    paddingVertical: 20,
    shadowColor: '#1f2687',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(190, 200, 210, 0.2)',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#006591',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: '#6e7881',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(190, 200, 210, 0.3)',
    marginVertical: 4,
  },

  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  detailsToggleText: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: '#006591',
  },

  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    shadowColor: '#1f2687',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(190, 200, 210, 0.2)',
  },
  sectionLabelMain: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: '#131b2e',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: '#6e7881',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eaedff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTextWrap: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: '#6e7881',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: '#131b2e',
    marginTop: 2,
  },
  detailDivider: {
    height: 1,
    backgroundColor: 'rgba(190, 200, 210, 0.3)',
    marginVertical: 12,
  },

  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#1f2687',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(190, 200, 210, 0.2)',
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionBody: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: '#131b2e',
  },
  actionDescription: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: '#6e7881',
    marginTop: 2,
  },
  actionChevron: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(190, 200, 210, 0.2)',
    marginLeft: 76,
  },

  signOutContainer: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  signOutButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ffdad6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.2)',
  },
  signOutButtonText: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: '#ba1a1a',
  },

  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: '#a0aab2',
  },
});