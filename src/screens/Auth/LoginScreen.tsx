// src/screens/Auth/LoginScreen.tsx
/**
 * @file LoginScreen.tsx
 * @description Authentication login screen for CareSync.
 *
 * Implements the new CareSync Premium UI design with LinearGradients
 * and glassmorphism styling.
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
import { LinearGradient } from 'expo-linear-gradient';
import CustomInput from '../../components/CustomInput';
import { useAuth } from '../../context/AuthContext';
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

export default function LoginScreen({ navigation }: LoginScreenProps): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  // Entrance animations
  const logoAnim = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
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
  }, []);

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

  const handleLogin = async (): Promise<void> => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message, [{ text: 'OK' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={['#e2e7ff', '#faf8ff', '#eaedff']}
      style={styles.safe}
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Auth Card (Glassmorphism emulation) */}
          <Animated.View style={[styles.mainCard, { opacity: cardOpacity, transform: [{ translateY: cardAnim }] }]}>
            
            {/* Logo Section */}
            <Animated.View style={[styles.header, { transform: [{ scale: logoAnim }] }]}>
              <LinearGradient
                colors={['#006591', '#0ea5e9']}
                style={styles.logoIconContainer}
              >
                <Ionicons name="document-text" size={32} color="#ffffff" />
              </LinearGradient>
              <Text style={styles.title}>
                <Text style={styles.titleRegular}>Care</Text>
                <Text style={styles.titleBold}>Sync</Text>
              </Text>
              <Text style={styles.subtitle}>Professional Healthcare Access</Text>
            </Animated.View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              <CustomInput
                label="Email Address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
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
                error={errors.password}
              />

              <View style={styles.forgotPasswordContainer}>
                <TouchableOpacity>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Primary Action Button */}
              <TouchableOpacity onPress={handleLogin} disabled={isSubmitting} activeOpacity={0.8}>
                <LinearGradient
                  colors={['#006591', '#0ea5e9']}
                  style={styles.primaryButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.primaryButtonText}>
                    {isSubmitting ? 'Authenticating...' : 'Sign In'}
                  </Text>
                  {!isSubmitting && <Ionicons name="arrow-forward" size={20} color="#fff" />}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Auth */}
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
              <Ionicons name="logo-google" size={20} color="#006591" />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Footer Links */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  mainCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(255, 255, 255, 0.75)', // Less opaque to simulate glass
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#1f2687',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 32,
    elevation: 4,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#006591',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Manrope_600SemiBold',
    letterSpacing: -0.5,
    color: '#006591',
  },
  titleRegular: {
    fontFamily: 'Manrope_500Medium',
  },
  titleBold: {
    fontFamily: 'Manrope_800ExtraBold',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: '#6e7881',
    marginTop: 4,
  },
  formContainer: {
    width: '100%',
  },
  forgotPasswordContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: '#006591',
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#006591',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    marginRight: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(190, 200, 210, 0.5)',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: '#6e7881',
  },
  socialButton: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(190, 200, 210, 0.5)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  socialButtonText: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: '#131b2e',
    marginLeft: 16,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: '#3e4850',
  },
  footerLink: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: '#006591',
  },
});