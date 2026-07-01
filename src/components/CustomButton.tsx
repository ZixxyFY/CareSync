// src/components/CustomButton.tsx
/**
 * @file CustomButton.tsx
 * @description Reusable, accessible button component for CareSync.
 *
 * SOLID Principle: Open/Closed — This component is open for extension via the
 * `variant` prop (primary, outline, danger, ghost) but closed for modification.
 * Adding a new button style never requires changing this file's core logic.
 *
 * SOLID Principle: Single Responsibility — This component ONLY handles button
 * rendering and its own visual state. It has zero business logic.
 *
 * Design:
 * - `primary`: Filled Medical Blue background with shadow — for main actions.
 * - `outline`: Transparent with blue border — for secondary/cancel actions.
 * - `danger`: Red background — for irreversible destructive actions.
 * - `ghost`: No border or background — for low-emphasis inline actions.
 */

import React from 'react';
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Button } from 'react-native-paper';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

// ---------------------------------------------------------------------------
// PROP TYPES
// ---------------------------------------------------------------------------

/** Supported button visual variants, following the Open/Closed Principle */
type ButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost';

interface CustomButtonProps {
  /** The label text displayed inside the button */
  title: string;
  /** Callback function invoked when the button is pressed */
  onPress: () => void;
  /**
   * Visual variant controls the button's appearance.
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * When true, shows an activity spinner and disables press events.
   * @default false
   */
  loading?: boolean;
  /**
   * When true, disables the button without showing a spinner.
   * @default false
   */
  disabled?: boolean;
  /** Optional custom styles to override the default container style */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// VARIANT CONFIGURATIONS (Open/Closed Principle)
// ---------------------------------------------------------------------------

/**
 * Maps each variant to its visual configuration.
 * New variants are added here without touching the component render logic.
 */
const VARIANT_CONFIG: Record<
  ButtonVariant,
  { mode: 'contained' | 'outlined' | 'text'; buttonColor: string; textColor: string; borderColor?: string }
> = {
  primary: {
    mode: 'contained',
    buttonColor: COLORS.primary,
    textColor: COLORS.surface,
  },
  outline: {
    mode: 'outlined',
    buttonColor: 'transparent',
    textColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  danger: {
    mode: 'contained',
    buttonColor: COLORS.error,
    textColor: COLORS.surface,
  },
  ghost: {
    mode: 'text',
    buttonColor: 'transparent',
    textColor: COLORS.textLight,
  },
};

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

/**
 * CustomButton — A fully accessible, multi-variant button.
 *
 * @param {CustomButtonProps} props
 * @returns {JSX.Element}
 *
 * @example
 * <CustomButton title="Sign In" onPress={handleLogin} loading={isLoading} />
 * <CustomButton title="Cancel" onPress={onCancel} variant="outline" />
 * <CustomButton title="Delete" onPress={onDelete} variant="danger" />
 */
export default function CustomButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: CustomButtonProps): React.JSX.Element {
  const config = VARIANT_CONFIG[variant];

  return (
    <Button
      mode={config.mode}
      onPress={onPress}
      loading={loading}
      disabled={loading || disabled}
      buttonColor={config.buttonColor}
      textColor={loading || disabled ? COLORS.textLight : config.textColor}
      style={[
        styles.button,
        variant === 'primary' && styles.primaryShadow,
        config.borderColor ? { borderColor: config.borderColor, borderWidth: 1.5 } : undefined,
        style,
      ]}
      contentStyle={styles.content}
      labelStyle={styles.label}
    >
      {title}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  button: {
    borderRadius: SIZES.pill,
    marginBottom: 16,
    overflow: 'hidden',
  } as ViewStyle,
  primaryShadow: SHADOWS.button as ViewStyle,
  content: {
    paddingVertical: 8,
    minHeight: 52,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  } as TextStyle,
});