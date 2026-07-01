// App.js
/**
 * @file App.js
 * @description Application root — wires together all providers, the navigation
 * container, and the root navigator switcher.
 *
 * ARCHITECTURE:
 * - AuthProvider wraps everything (auth state needed by all layers)
 * - BookingProvider wraps the main app (appointment state for authorized screens)
 * - MedicalProvider wraps the main app (OCR/prescription state for authorized screens)
 * - PaperProvider supplies the react-native-paper Material Design theme
 * - NavigationContainer is the root for @react-navigation
 * - RootNavigator switches between UnauthorizedNav ↔ AuthorizedNav based on auth state
 *
 * DATA FLOW (top-down):
 *  AuthProvider → BookingProvider → MedicalProvider → PaperProvider
 *       ↓               ↓                ↓
 *  AuthContext    BookingContext    MedicalContext
 *       ↓               ↓                ↓
 *   Screens        Screens           Screens
 */

import 'react-native-gesture-handler';
import React from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, MD3LightTheme, configureFonts } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BookingProvider } from './src/context/BookingContext';
import { MedicalProvider } from './src/context/MedicalContext';
import { TransportProvider } from './src/context/TransportContext';
import UnauthorizedNav from './src/navigation/UnauthorizedNav';
import AuthorizedNav from './src/navigation/AuthorizedNav';

// ---------------------------------------------------------------------------
// PAPER THEME — Override default Material Design colors with CareSync palette
// ---------------------------------------------------------------------------

const fontConfig = {
  fontFamily: 'Manrope_400Regular',
};

const caresyncTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#006591',
    primaryContainer: '#0ea5e9',
    secondary: '#505f76',
    background: '#faf8ff',
    surface: '#faf8ff',
    surfaceVariant: '#dae2fd',
    error: '#ba1a1a',
    onPrimary: '#ffffff',
    onSurface: '#131b2e',
    onSurfaceVariant: '#3e4850',
    outline: '#6e7881',
    elevation: {
      level1: '#f2f3ff', // surface-container-low
      level2: '#eaedff', // surface-container
      level3: '#e2e7ff', // surface-container-high
    },
  },
  fonts: configureFonts({config: fontConfig}),
};

// ---------------------------------------------------------------------------
// ROOT NAVIGATOR — Switches between auth flows based on global user state
// ---------------------------------------------------------------------------

/**
 * RootNavigator reads the user from AuthContext and conditionally renders:
 * - AuthorizedNav (bottom tabs) when a user is logged in
 * - UnauthorizedNav (login/signup stack) when no user is present
 *
 * The switch is automatic — no manual navigation.navigate() is needed.
 * AuthContext.login() sets `user`, which triggers a re-render here.
 */
const RootNavigator = () => {
  const { user } = useAuth();
  return (
    <NavigationContainer>
      {user ? <AuthorizedNav /> : <UnauthorizedNav />}
    </NavigationContainer>
  );
};

// ---------------------------------------------------------------------------
// APP ROOT
// ---------------------------------------------------------------------------

/**
 * App — The React Native application root.
 *
 * Provider nesting order (outermost to innermost):
 *   SafeAreaProvider → AuthProvider → BookingProvider → TransportProvider
 *   → MedicalProvider → PaperProvider → RootNavigator
 */
export default function App() {
  let [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={[styles.webWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#006591" />
      </View>
    );
  }

  return (
    <View style={styles.webWrapper}>
      <View style={styles.appContainer}>
        <SafeAreaProvider>
          <AuthProvider>
            <BookingProvider>
              <TransportProvider>
                <MedicalProvider>
                  <PaperProvider theme={caresyncTheme}>
                    <RootNavigator />
                  </PaperProvider>
                </MedicalProvider>
              </TransportProvider>
            </BookingProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? '#0F172A' : '#F0F7FF',
    ...(Platform.OS === 'web' && {
      alignItems: 'center',
      justifyContent: 'center',
    }),
  },
  appContainer: {
    flex: 1,
    width: '100%',
    ...(Platform.OS === 'web' && {
      maxWidth: 480,
      maxHeight: 1000,
      backgroundColor: '#F0F7FF',
      overflow: 'hidden',
      boxShadow: '0px 0px 20px rgba(0,0,0,0.5)',
    }),
  },
});