import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardTypeOptions,
} from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { InputBlockContent, BlockStyling } from '../../types';
import { getStylingStyles, scale } from '../../utils/styles';

interface InputBlockProps {
  content: InputBlockContent;
  styling?: BlockStyling;
  value?: string;
  onChangeValue: (fieldName: string, value: string) => void;
  hasError?: boolean;
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

export function InputBlock({
  content,
  styling,
  value = '',
  onChangeValue,
  hasError = false,
}: InputBlockProps) {
  const {
    placeholder = '',
    placeholderColor = '#999999',
    label,
    fieldName,
    inputType = 'text',
    required = false,
  } = content;

  const [isFocused, setIsFocused] = useState(false);

  const containerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    width: '100%',
  };

  const inputContainerStyle: ViewStyle = {
    borderWidth: 1,
    borderColor: hasError ? '#FF3B30' : isFocused ? '#007AFF' : '#E5E5EA',
    borderRadius: scale(12),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
  };

  const inputStyle: TextStyle = {
    fontSize: scale(16),
    color: '#000000',
    padding: 0,
  };

  const labelStyle: TextStyle = {
    fontSize: scale(14),
    color: '#666666',
    marginBottom: scale(8),
    fontWeight: '500',
  };

  const handleChangeText = (text: string) => {
    onChangeValue(fieldName, text);
  };

  return (
    <View style={containerStyle}>
      {label && (
        <Text style={labelStyle}>
          {label}
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
        />
      </View>
      {hasError && (
        <Text style={styles.errorText}>This field is required</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  required: {
    color: '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
});
