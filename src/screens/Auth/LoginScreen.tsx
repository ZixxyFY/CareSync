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
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { isValidEmail, isValidPassword } from '../../utils/validations';

const { width } = Dimensions.get('window');

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
 * Features a premium animated hero section with glassmorphism card.
 */
export default function LoginScreen({ navigation }: LoginScreenProps): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  // Entrance animations
  const logoAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(40)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Staggered entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(titleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(cardAnim, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Subtle pulse on logo
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, []);

  // ---------------------------------------------------------------------------
  // VALIDATION
  // ---------------------------------------------------------------------------

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

  const handleLogin = async (): Promise<void> => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await login(email, password);
      // Navigation is handled automatically by the root navigator watching AuthContext.user
    } catch (error: any) {
      Alert.alert('Login Failed', error.message, [{ text: 'OK' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        {/* ── HERO BACKGROUND ── */}
        <View style={styles.heroBackground}>
          {/* Decorative circles */}
          <View style={[styles.decorCircle, styles.decorCircle1]} />
          <View style={[styles.decorCircle, styles.decorCircle2]} />
          <View style={[styles.decorCircle, styles.decorCircle3]} />

          {/* ── LOGO & TITLE ── */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoAnim,
                transform: [
                  { scale: Animated.multiply(logoAnim, pulse) },
                ],
              },
            ]}
          >
            <View style={styles.logoInner}>
              <Ionicons name="heart" size={40} color={COLORS.surface} />
            </View>
            <View style={styles.logoRing} />
          </Animated.View>

          <Animated.View style={{ opacity: titleAnim, alignItems: 'center' }}>
            <Text style={styles.appName}>CareSync</Text>
            <Text style={styles.tagline}>Collaborative Rehab & Care Coordinator</Text>
          </Animated.View>
        </View>

        {/* ── FORM CARD ── */}
        <Animated.View
          style={[
            styles.formCard,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardAnim }],
            },
          ]}
        >
          {/* Card accent line */}
          <View style={styles.cardAccent} />

          <Text style={styles.formTitle}>Welcome Back </Text>
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
            <View style={styles.hintIconWrap}>
              <Ionicons name="flash" size={14} color={COLORS.primary} />
            </View>
            <Text style={styles.hintText}>
              Demo: any valid email + 6+ character password
            </Text>
          </View>

          <CustomButton
            title="Sign In"
            onPress={handleLogin}
            loading={isSubmitting}
          />
        </Animated.View>

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.footerLink}>Create Account →</Text>
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
    backgroundColor: COLORS.gradientStart,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Hero Section
  heroBackground: {
    backgroundColor: COLORS.gradientStart,
    paddingTop: 48,
    paddingBottom: 48,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorCircle1: {
    width: 220,
    height: 220,
    top: -60,
    right: -50,
  },
  decorCircle2: {
    width: 160,
    height: 160,
    bottom: -40,
    left: -40,
  },
  decorCircle3: {
    width: 100,
    height: 100,
    top: 40,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  logoInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  logoRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  appName: {
    fontSize: FONTS.display,
    fontWeight: '800',
    color: COLORS.surface,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: FONTS.caption,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // Form Card
  formCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingTop: 32,
    flex: 1,
    minHeight: 480,
    ...SHADOWS.modal,
  },
  cardAccent: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  formTitle: {
    fontSize: FONTS.h2,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: FONTS.caption,
    color: COLORS.textLight,
    marginBottom: 24,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryTint,
    borderRadius: SIZES.borderRadius,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  hintIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    fontSize: FONTS.caption,
    color: COLORS.primaryDark,
    flex: 1,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 20,
    paddingBottom: 36,
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