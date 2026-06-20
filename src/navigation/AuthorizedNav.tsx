// src/navigation/AuthorizedNav.tsx
/**
 * @file AuthorizedNav.tsx
 * @description Bottom Tab navigator for authenticated CareSync users.
 *
 * SOLID Principle: Open/Closed — adding a new tab (e.g., a Messaging tab)
 * only requires adding a new Tab.Screen here. No existing screen or context
 * needs to change.
 *
 * Tabs:
 *  1. Appointments (calendar icon) — The Booking Engine
 *  2. Transport    (car icon)      — Schedule rides for patients
 *  3. Scanner      (scan icon)     — OCR Prescription Digitizer
 *  4. Profile      (person icon)   — User profile & settings
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

import AppointmentList from '../screens/Booking/AppointmentList';
import ScheduleRide from '../screens/Booking/ScheduleRide';
import OCRScanner from '../screens/Medical/OCRscanner';
import ProfileScreen from '../screens/Profile/ProfileScreen';

/** Type definition for the authorized tab route list */
export type AuthorizedTabParamList = {
  Schedule: undefined;
  Transport: undefined;
  Scanner: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AuthorizedTabParamList>();

// ---------------------------------------------------------------------------
// TAB BAR ICON CONFIG
// ---------------------------------------------------------------------------

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<
  keyof AuthorizedTabParamList,
  { focused: IconName; unfocused: IconName; label: string }
> = {
  Schedule: { focused: 'calendar', unfocused: 'calendar-outline', label: 'Appointments' },
  Transport: { focused: 'car', unfocused: 'car-outline', label: 'Transport' },
  Scanner: { focused: 'scan-circle', unfocused: 'scan-circle-outline', label: 'Digitize' },
  Profile: { focused: 'person-circle', unfocused: 'person-circle-outline', label: 'Profile' },
};

// ---------------------------------------------------------------------------
// CUSTOM TAB BAR LABEL
// ---------------------------------------------------------------------------

const TabLabel = ({ label, focused }: { label: string; focused: boolean }) => (
  <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
    {label}
  </Text>
);

// ---------------------------------------------------------------------------
// NAVIGATOR
// ---------------------------------------------------------------------------

/**
 * AuthorizedNav — Bottom Tab navigator shown after successful login.
 * Automatically mounted by the RootNavigator when AuthContext.user is non-null.
 */
export default function AuthorizedNav(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const routeName = route.name as keyof AuthorizedTabParamList;
        const iconConfig = TAB_ICONS[routeName];

        return {
          // Header styling
          headerShown: routeName !== 'Profile', // Profile has its own hero header
          headerStyle: { backgroundColor: COLORS.surface, elevation: 0, shadowOpacity: 0 },
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: '700', fontSize: FONTS.h3 },
          headerTitle: iconConfig.label,

          // Tab bar styling
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textLight,
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabBarItem,

          // Icon render
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? iconConfig.focused : iconConfig.unfocused}
              size={focused ? size + 2 : size}
              color={color}
            />
          ),

          // Label render
          tabBarLabel: ({ focused }) => (
            <TabLabel label={iconConfig.label} focused={focused} />
          ),
        };
      }}
    >
      <Tab.Screen name="Schedule" component={AppointmentList} />
      <Tab.Screen name="Transport" component={ScheduleRide} />
      <Tab.Screen name="Scanner" component={OCRScanner} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    height: Platform.OS === 'ios' ? 85 : 65,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 12,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textLight,
    marginTop: 2,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});