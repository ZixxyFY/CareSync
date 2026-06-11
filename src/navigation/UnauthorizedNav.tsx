// src/navigation/UnauthorizedNav.tsx
/**
 * @file UnauthorizedNav.tsx
 * @description Stack navigator for unauthenticated users.
 *
 * Screens: Login (initial) → Signup
 * Uses headerShown: false for both screens since each screen manages its
 * own visual header as part of the design (custom hero sections).
 *
 * The RootNavigator in App.js switches between this navigator and
 * AuthorizedNav based on AuthContext.user state.
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';

/** Type definition for the unauthenticated route parameter list */
export type UnauthorizedStackParamList = {
  Login: undefined;
  Signup: undefined;
};

const Stack = createStackNavigator<UnauthorizedStackParamList>();

/**
 * UnauthorizedNav — Stack navigator for unauthenticated users.
 * Once AuthContext.user is set (after login/signup), the root navigator
 * in App.tsx automatically replaces this with AuthorizedNav.
 */
export default function UnauthorizedNav(): JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        // Slide transition feels more native-like for auth flows
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        }),
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}