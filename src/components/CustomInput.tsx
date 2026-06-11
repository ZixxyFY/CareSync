// src/components/CustomInput.tsx
/**
 * @file CustomInput.tsx
 * @description Reusable floating-label text input for CareSync.
 *
 * SOLID Principle: Single Responsibility — this component only renders an
 * input field. Validation logic lives in validations.tsx; state lives in the
 * calling screen. This component is purely a controlled, "dumb" UI element.
 *
 * SOLID Principle: Open/Closed — adding a new input type (e.g., multiline,
 * number pad) is done via props, not by modifying this component's core.
 *
 * Uses react-native-paper's TextInput for the floating label animation,
 * which is standard in healthcare apps (clarity reduces input errors).
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';

// ---------------------------------------------------------------------------
// PROP TYPES
// ---------------------------------------------------------------------------

interface CustomInputProps {
  /** The floating label text shown above the input */
  label: string;
  /** Controlled value — must be managed by the parent component's state */
  value: string;
  /** Callback invoked when the text changes */
  onChangeText: (text: string) => void;
  /** When true, text is masked (for passwords). Adds a show/hide toggle icon. */
  secureTextEntry?: boolean;
  /** Inline validation error message, shown in red below the input */
  error?: string;
  /** Keyboard type — defaults to 'default' */
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  /** Whether the input can span multiple lines */
  multiline?: boolean;
  /** Number of visible lines for multiline inputs */
  numberOfLines?: number;
  /** autoCapitalize behaviour */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** Left-side icon name from @expo/vector-icons Ionicons */
  iconName?: keyof typeof Ionicons.glyphMap;
  /** When true, the input cannot be edited */
  editable?: boolean;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

/**
 * CustomInput — A floating-label, validated text input with optional password toggle.
 *
 * @param {CustomInputProps} props
 * @returns {JSX.Element}
 *
 * @example
 * <CustomInput label="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" />
 * <CustomInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />
 * <CustomInput label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
 */
export default function CustomInput({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  autoCapitalize = 'sentences',
  iconName,
  editable = true,
}: CustomInputProps): JSX.Element {
  // Local UI state: password visibility toggle (single responsibility for this component)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = secureTextEntry;
  const shouldHideText = isPassword && !isPasswordVisible;

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        label={label}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={shouldHideText}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : undefined}
        autoCapitalize={autoCapitalize}
        editable={editable}
        outlineColor={error ? COLORS.error : COLORS.border}
        activeOutlineColor={error ? COLORS.error : COLORS.primary}
        outlineStyle={{ borderRadius: SIZES.borderRadius }}
        textColor={COLORS.text}
        style={[
          styles.input,
          multiline && { height: numberOfLines * 44 },
          !editable && styles.disabled,
        ]}
        theme={{
          colors: {
            onSurfaceVariant: error ? COLORS.error : COLORS.textLight,
            background: COLORS.surface,
          },
        }}
        left={
          iconName ? (
            <TextInput.Icon
              icon={() => (
                <Ionicons name={iconName} size={20} color={error ? COLORS.error : COLORS.textLight} />
              )}
            />
          ) : undefined
        }
        right={
          isPassword ? (
            <TextInput.Icon
              icon={() => (
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible((prev) => !prev)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
              )}
            />
          ) : undefined
        }
      />
      {error ? <Text style={styles.errorText}>⚠ {error}</Text> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.surface,
    fontSize: 16,
  },
  disabled: {
    backgroundColor: '#F8FAFC',
    opacity: 0.7,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
});