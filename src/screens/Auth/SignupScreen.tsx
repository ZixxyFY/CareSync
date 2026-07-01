// src/screens/Auth/SignupScreen.tsx
/**
 * @file SignupScreen.tsx
 * @description New user registration screen for CareSync.
 *
 * SOLID Principle: Single Responsibility (SRP) — This "dumb" UI screen only manages:
 *   1. Local form state (name, email, password, role, confirmPassword)
 *   2. Inline validation error display
 *   3. Delegating registration to AuthContext.signup
 *
 * ALL validation logic is in validations.tsx.
 * ALL network logic is in authService.tsx via AuthContext.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { isValidEmail, isValidPassword, isValidName } from '../../utils/validations';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

type SignupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Signup'>;

interface SignupScreenProps {
  navigation: SignupScreenNavigationProp;
}

type Role = 'Caregiver' | 'Patient' | 'Provider';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// Role metadata with colors
const ROLE_META: { label: string; value: Role; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; description: string }[] = [
  { label: 'Caregiver', value: 'Caregiver', icon: 'people', color: COLORS.success, bg: '#D1FAE5', description: 'Supporting a loved one' },
  { label: 'Patient', value: 'Patient', icon: 'person', color: COLORS.primary, bg: COLORS.primaryTint, description: 'Managing my own care' },
  { label: 'Provider', value: 'Provider', icon: 'medical', color: COLORS.warning, bg: '#FEF3C7', description: 'Healthcare professional' },
];

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

/**
 * SignupScreen — Allows new users to create a CareSync account.
 * Role selection (Patient / Caregiver / Provider) drives personalized features.
 */
export default function SignupScreen({ navigation }: SignupScreenProps): React.JSX.Element {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('Caregiver');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();

  // Entrance animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(30)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(formAnim, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
      Animated.timing(formOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // ---------------------------------------------------------------------------
  // VALIDATION
  // ---------------------------------------------------------------------------

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!isValidName(name)) {
      newErrors.name = 'Please enter your full name (letters only, min 2 chars).';
    }
    if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!isValidPassword(password)) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------------------------------------------------------------------
  // SUBMIT
  // ---------------------------------------------------------------------------

  const handleSignup = async (): Promise<void> => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await signup(name, email, password, selectedRole);
      // Navigation is handled automatically by the root navigator watching AuthContext.user
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message, [{ text: 'OK' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearError = (field: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.gradientStart} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO HEADER ── */}
        <View style={styles.heroHeader}>
          <View style={[styles.decorCircle, styles.decorCircle1]} />
          <View style={[styles.decorCircle, styles.decorCircle2]} />

          <Animated.View style={{ opacity: headerAnim }}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <View style={styles.backButtonInner}>
                <Ionicons name="arrow-back" size={20} color={COLORS.surface} />
              </View>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Join CareSync to coordinate care better</Text>
          </Animated.View>
        </View>

        {/* ── FORM CARD ── */}
        <Animated.View
          style={[
            styles.formCard,
            { opacity: formOpacity, transform: [{ translateY: formAnim }] },
          ]}
        >
          {/* Role Selector */}
          <Text style={styles.sectionLabel}>I am a...</Text>
          <View style={styles.roleContainer}>
            {ROLE_META.map((role) => {
              const isActive = selectedRole === role.value;
              return (
                <TouchableOpacity
                  key={role.value}
                  style={[
                    styles.roleCard,
                    isActive && { borderColor: role.color, backgroundColor: role.bg },
                  ]}
                  onPress={() => setSelectedRole(role.value)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.roleIconWrap,
                      { backgroundColor: isActive ? role.color : COLORS.border },
                    ]}
                  >
                    <Ionicons
                      name={role.icon}
                      size={18}
                      color={isActive ? COLORS.surface : COLORS.textLight}
                    />
                  </View>
                  <Text style={[styles.roleLabel, isActive && { color: role.color }]}>
                    {role.label}
                  </Text>
                  <Text style={styles.roleDescription}>{role.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Form Fields */}
          <CustomInput
            label="Full Name"
            value={name}
            onChangeText={(t) => { setName(t); clearError('name'); }}
            iconName="person-outline"
            autoCapitalize="words"
            error={errors.name}
          />
          <CustomInput
            label="Email Address"
            value={email}
            onChangeText={(t) => { setEmail(t); clearError('email'); }}
            keyboardType="email-address"
            autoCapitalize="none"
            iconName="mail-outline"
            error={errors.email}
          />
          <CustomInput
            label="Password"
            value={password}
            onChangeText={(t) => { setPassword(t); clearError('password'); }}
            secureTextEntry
            iconName="lock-closed-outline"
            error={errors.password}
          />
          <CustomInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); clearError('confirmPassword'); }}
            secureTextEntry
            iconName="shield-checkmark-outline"
            error={errors.confirmPassword}
          />

          <CustomButton
            title="Create Account"
            onPress={handleSignup}
            loading={isSubmitting}
          />
        </Animated.View>

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign In →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gradientStart },
  scrollContent: { flexGrow: 1 },

  // Hero Header
  heroHeader: {
    backgroundColor: COLORS.gradientStart,
    paddingTop: 40,
    paddingHorizontal: SIZES.padding,
    paddingBottom: 48,
    overflow: 'hidden',
    position: 'relative',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorCircle1: { width: 200, height: 200, top: -80, right: -60 },
  decorCircle2: { width: 120, height: 120, bottom: -40, left: -20 },
  backButton: { marginBottom: 16 },
  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.h1,
    fontWeight: '800',
    color: COLORS.surface,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FONTS.caption,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },

  // Form Card
  formCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    paddingTop: 36,
    flex: 1,
    ...SHADOWS.modal,
  },

  sectionLabel: {
    fontSize: FONTS.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },

  // Role Cards
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    gap: 6,
  },
  roleIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  roleDescription: {
    fontSize: 9,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 12,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 20,
    paddingBottom: 36,
  },
  footerText: { fontSize: FONTS.caption, color: COLORS.textLight },
  footerLink: { fontSize: FONTS.caption, color: COLORS.primary, fontWeight: '700' },
});
