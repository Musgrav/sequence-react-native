import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import type { ViewStyle, TextStyle, KeyboardTypeOptions } from 'react-native';
import type { InputBlockContent, BlockStyling } from '../../types';
import { getStylingStyles } from '../../utils/styles';

interface InputBlockProps {
  content: InputBlockContent;
  styling?: BlockStyling;
  value?: string;
  onChangeValue: (fieldName: string, value: string) => void;
  hasError?: boolean;
  /** Scale factor for proportional sizing in WYSIWYG mode */
  scaleFactor?: number;
  /** Max width for the input block */
  maxWidth?: number;
}

// Map input type to keyboard type
function getKeyboardType(inputType?: string): KeyboardTypeOptions {
  switch (inputType) {
    case 'email':
      return 'email-address';
    case 'number':
      return 'numeric';
    case 'phone':
      return 'phone-pad';
    default:
      return 'default';
  }
}

/**
 * InputBlock - Matches web editor and Swift SDK styling
 *
 * Features:
 * - Dark mode support (transparent background with white text)
 * - Focus state with accent color border
 * - Error state with red border
 * - Proper scaling for WYSIWYG
 * - Label support with asterisk for required fields
 */
export function InputBlock({
  content,
  styling,
  value = '',
  onChangeValue,
  hasError = false,
  scaleFactor = 1,
  maxWidth,
}: InputBlockProps) {
  const {
    placeholder = '',
    placeholderColor = 'rgba(255, 255, 255, 0.5)', // Light placeholder for dark backgrounds
    label,
    fieldLabel,
    fieldName,
    inputType = 'text',
    required = false,
  } = content;

  const [isFocused, setIsFocused] = useState(false);

  // Helper function for scaling
  const s = (v: number) => v * scaleFactor;

  // Use fieldLabel if available, otherwise fall back to label
  const displayLabel = fieldLabel || label;

  // Container style - matches web editor
  const containerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    width: maxWidth || '100%',
  };

  // Input container style - matches web editor exactly
  // Web uses: bg-white/10 (rgba(255,255,255,0.1)) with rounded corners
  const inputContainerStyle: ViewStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Matches web bg-white/10
    borderRadius: s(12),
    borderWidth: 2,
    borderColor: hasError
      ? '#FF3B30' // Red for error
      : isFocused
        ? '#10b981' // Green accent when focused (matches web emerald-500)
        : 'transparent', // No border when not focused
    paddingHorizontal: s(16),
    paddingVertical: Platform.select({
      ios: s(14),
      android: s(12),
      default: s(14),
    }),
    // Subtle shadow on iOS for depth
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
  };

  // Input text style - matches web editor
  const inputStyle: TextStyle = {
    fontSize: s(16),
    color: '#FFFFFF', // White text for dark backgrounds
    padding: 0,
    margin: 0,
    fontWeight: '400',
    // Ensure proper vertical alignment
    ...(Platform.OS === 'android' && {
      textAlignVertical: 'center',
    }),
  };

  // Label style - matches web editor
  const labelStyle: TextStyle = {
    fontSize: s(14),
    color: 'rgba(255, 255, 255, 0.7)', // Slightly transparent white
    marginBottom: s(8),
    fontWeight: '500',
  };

  // Error text style
  const errorStyle: TextStyle = {
    fontSize: s(12),
    color: '#FF3B30',
    marginTop: s(6),
    fontWeight: '400',
  };

  const handleChangeText = (text: string) => {
    onChangeValue(fieldName, text);
  };

  return (
    <View style={containerStyle}>
      {displayLabel && (
        <Text style={labelStyle}>
          {displayLabel}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <View style={inputContainerStyle}>
        <TextInput
          style={inputStyle}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          keyboardType={getKeyboardType(inputType)}
          secureTextEntry={inputType === 'password'}
          autoCapitalize={inputType === 'email' ? 'none' : 'sentences'}
          autoCorrect={inputType !== 'email' && inputType !== 'password'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          returnKeyType="done"
          autoComplete={inputType === 'email' ? 'email' : inputType === 'phone' ? 'tel' : 'off'}
        />
      </View>
      {hasError && (
        <Text style={errorStyle}>This field is required</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  required: {
    color: '#FF3B30',
  },
});
