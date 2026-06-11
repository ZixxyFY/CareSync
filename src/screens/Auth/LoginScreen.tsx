// src/screens/Auth/LoginScreen.tsx
/**
 * @file LoginScreen.tsx
 * @description Authentication login screen for CareSync.
 *
 * SOLID Principle: Single Responsibility (SRP) — This is a "dumb" UI component.
 * It ONLY handles:
 *   1. Local input state (email, password strings)
 *   2. Local error display state
 *   3. Calling the `login` function from AuthContext
 *
 * ALL validation logic lives in `validations.tsx`.
 * ALL authentication logic lives in `AuthContext` → `authService`.
 * This screen has ZERO business logic.
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
import { isValidEmail, isValidPassword } from '../../utils/validations';

// ---------------------------------------------------------------------------
// NAVIGATION TYPES
// ---------------------------------------------------------------------------

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

/**
 * LoginScreen — The entry point of the app for unauthenticated users.
 * Validates inputs client-side before handing off to the AuthContext.
 */
export default function LoginScreen({ navigation }: LoginScreenProps): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login, isLoading } = useAuth();

  // ---------------------------------------------------------------------------
  // VALIDATION (pure utility, called client-side before any API call)
  // ---------------------------------------------------------------------------

  /**
   * Validates the form fields using pure utility functions from validations.tsx.
   * Populates inline error messages without calling any external service.
   * @returns {boolean} True if all fields are valid
   */
  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!isValidPassword(password)) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------------------------------------------------------------------
  // SUBMIT HANDLER
  // ---------------------------------------------------------------------------

  /**
   * Orchestrates the login flow:
   * 1. Validates inputs (client-side, free)
   * 2. Calls AuthContext.login (triggers service → mock API)
   * 3. On success: navigation switches automatically (no manual navigate())
   * 4. On failure: shows an Alert with the error message
   */
  const handleLogin = async (): Promise<void> => {
    if (!validateForm()) return;

    try {
      await login(email, password);
      // ✅ No navigate() needed — AuthContext.user change triggers root navigator switch
    } catch (error: any) {
      Alert.alert('Login Failed', error.message, [{ text: 'OK' }]);
    }
  };

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
        {/* ── HERO SECTION ── */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="heart-circle" size={64} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>CareSync</Text>
          <Text style={styles.tagline}>Collaborative Rehab & Care Coordinator</Text>
        </View>

        {/* ── FORM CARD ── */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to continue coordinating care</Text>

          <CustomInput
            label="Email Address"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            iconName="mail-outline"
            error={errors.email}
          />

          <CustomInput
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            secureTextEntry
            iconName="lock-closed-outline"
            error={errors.password}
          />

          {/* Demo credentials hint */}
          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
            <Text style={styles.hintText}>
              Demo: any valid email + 6+ char password
            </Text>
          </View>

          <CustomButton
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
          />
        </View>

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.footerLink}>Create Account</Text>
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
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SIZES.padding,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: FONTS.h1,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: FONTS.caption,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
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
  formTitle: {
    fontSize: FONTS.h2,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: FONTS.caption,
    color: COLORS.textLight,
    marginBottom: 24,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    gap: 6,
  },
  hintText: {
    fontSize: FONTS.caption,
    color: COLORS.primary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONTS.caption,
    color: COLORS.textLight,
  },
  footerLink: {
    fontSize: FONTS.caption,
    color: COLORS.primary,
    fontWeight: '700',
  },
});