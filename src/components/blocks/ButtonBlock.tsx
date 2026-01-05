import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { ButtonBlockContent, BlockStyling, ButtonAction } from '../../types';
import { getStylingStyles, getFontWeight, scale } from '../../utils/styles';

interface ButtonBlockProps {
  content: ButtonBlockContent;
  styling?: BlockStyling;
  onPress: (action: ButtonAction) => void;
  disabled?: boolean;
}

// Default button styles by variant
const VARIANT_STYLES: Record<string, { bg: string; text: string; border?: string }> = {
  primary: { bg: '#007AFF', text: '#FFFFFF' },
  secondary: { bg: '#E5E5EA', text: '#000000' },
  outline: { bg: 'transparent', text: '#007AFF', border: '#007AFF' },
  ghost: { bg: 'transparent', text: '#007AFF' },
};

// Default padding by size
const SIZE_PADDING: Record<string, { h: number; v: number; fontSize: number }> = {
  sm: { h: 16, v: 8, fontSize: 14 },
  md: { h: 24, v: 12, fontSize: 16 },
  lg: { h: 32, v: 16, fontSize: 18 },
};

// Preset button configurations
const PRESET_CONFIG: Record<string, { icon?: string; text?: string; style?: Partial<ButtonBlockContent> }> = {
  'sign-in-apple': {
    icon: '',
    text: 'Sign in with Apple',
    style: { backgroundColor: '#000000', textColor: '#FFFFFF' },
  },
  'sign-in-google': {
    icon: '🔵',
    text: 'Sign in with Google',
    style: { backgroundColor: '#FFFFFF', textColor: '#000000' },
  },
  'sign-in-email': {
    icon: '✉️',
    text: 'Sign in with Email',
  },
  continue: {
    text: 'Continue',
    style: { variant: 'primary' },
  },
  skip: {
    text: 'Skip',
    style: { variant: 'ghost' },
  },
  'enable-notifications': {
    icon: '🔔',
    text: 'Enable Notifications',
    style: { variant: 'primary' },
  },
  'enable-location': {
    icon: '📍',
    text: 'Enable Location',
    style: { variant: 'primary' },
  },
  'get-started': {
    text: 'Get Started',
    style: { variant: 'primary' },
  },
};

export function ButtonBlock({
  content,
  styling,
  onPress,
  disabled = false,
}: ButtonBlockProps) {
  const {
    text,
    action,
    variant = 'primary',
    size = 'md',
    fullWidth = true,
    backgroundColor,
    textColor,
    borderRadius = 12,
    backgroundGradient,
    preset,
    icon,
    iconPosition = 'left',
    fontFamily,
    fontSize,
    fontWeight = 'semibold',
    paddingHorizontal,
    paddingVertical,
  } = content;

  // Apply preset configuration if specified
  const presetConfig = preset ? PRESET_CONFIG[preset] : undefined;

  // Get variant styles
  const variantStyle = VARIANT_STYLES[presetConfig?.style?.variant || variant] || VARIANT_STYLES.primary;

  // Calculate styles
  const sizeConfig = SIZE_PADDING[size];

  const bgColor = backgroundColor || presetConfig?.style?.backgroundColor || variantStyle.bg;
  const txtColor = textColor || presetConfig?.style?.textColor || variantStyle.text;
  const btnBorderRadius = scale(presetConfig?.style?.borderRadius || borderRadius);

  const containerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    width: fullWidth ? '100%' : 'auto',
  };

  const buttonStyle: ViewStyle = {
    backgroundColor: bgColor,
    borderRadius: btnBorderRadius,
    paddingHorizontal: scale(paddingHorizontal ?? sizeConfig.h),
    paddingVertical: scale(paddingVertical ?? sizeConfig.v),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
    // Border for outline variant
    ...(variant === 'outline' && {
      borderWidth: 1,
      borderColor: variantStyle.border,
    }),
  };

  const textStyle: TextStyle = {
    color: txtColor,
    fontSize: scale(fontSize || sizeConfig.fontSize),
    fontWeight: getFontWeight(fontWeight),
    fontFamily,
    textAlign: 'center',
  };

  // Determine display text and icon
  const displayText = text || presetConfig?.text || 'Button';
  const displayIcon = icon || presetConfig?.icon;

  const handlePress = () => {
    if (!disabled) {
      onPress(action);
    }
  };

  return (
    <View style={containerStyle}>
      <TouchableOpacity
        style={buttonStyle}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {displayIcon && iconPosition === 'left' && (
          <Text style={[textStyle, styles.iconLeft]}>{displayIcon}</Text>
        )}
        <Text style={textStyle}>{displayText}</Text>
        {displayIcon && iconPosition === 'right' && (
          <Text style={[textStyle, styles.iconRight]}>{displayIcon}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
