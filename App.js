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
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BookingProvider } from './src/context/BookingContext';
import { MedicalProvider } from './src/context/MedicalContext';
import { TransportProvider } from './src/context/TransportContext';
import UnauthorizedNav from './src/navigation/UnauthorizedNav';
import AuthorizedNav from './src/navigation/AuthorizedNav';

// ---------------------------------------------------------------------------
// PAPER THEME — Override default Material Design colors with CareSync palette
// ---------------------------------------------------------------------------

const caresyncTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0EA5E9',
    secondary: '#38BDF8',
    background: '#F0F7FF',
    surface: '#FFFFFF',
    error: '#EF4444',
    onPrimary: '#FFFFFF',
    onSurface: '#0F172A',
  },
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
  return (
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
  );
}