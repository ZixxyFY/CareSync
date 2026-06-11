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

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
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

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

/**
 * SignupScreen — Allows new users to create a CareSync account.
 * Role selection (Patient / Caregiver / Provider) drives personalized features.
 */
export default function SignupScreen({ navigation }: SignupScreenProps): JSX.Element {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('Caregiver');
  const [errors, setErrors] = useState<FormErrors>({});
  const { signup, isLoading } = useAuth();

  const ROLES: { label: string; value: Role; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Caregiver', value: 'Caregiver', icon: 'people-outline' },
    { label: 'Patient', value: 'Patient', icon: 'person-outline' },
    { label: 'Provider', value: 'Provider', icon: 'medical-outline' },
  ];

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

    try {
      await signup(name, email, password, selectedRole);
      // On success, AuthContext.user is set → root navigator switches automatically
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message, [{ text: 'OK' }]);
    }
  };

  const clearError = (field: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── BACK BUTTON ── */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSubtitle}>Join CareSync to coordinate care better</Text>
        </View>

        {/* ── FORM CARD ── */}
        <View style={styles.formCard}>
          {/* Role Selector */}
          <Text style={styles.sectionLabel}>I am a...</Text>
          <View style={styles.roleContainer}>
            {ROLES.map((role) => {
              const isActive = selectedRole === role.value;
              return (
                <TouchableOpacity
                  key={role.value}
                  style={[styles.roleChip, isActive && styles.roleChipActive]}
                  onPress={() => setSelectedRole(role.value)}
                >
                  <Ionicons
                    name={role.icon}
                    size={18}
                    color={isActive ? COLORS.surface : COLORS.textLight}
                  />
                  <Text style={[styles.roleChipText, isActive && styles.roleChipTextActive]}>
                    {role.label}
                  </Text>
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
            loading={isLoading}
          />
        </View>

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign In</Text>
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
  safe: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, padding: SIZES.padding },
  backButton: {
    marginBottom: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: FONTS.h1, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: FONTS.caption, color: COLORS.textLight, marginTop: 4 },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: FONTS.caption,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  roleChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  roleChipTextActive: {
    color: COLORS.surface,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: FONTS.caption, color: COLORS.textLight },
  footerLink: { fontSize: FONTS.caption, color: COLORS.primary, fontWeight: '700' },
});
