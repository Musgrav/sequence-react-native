import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { ButtonBlockContent, BlockStyling, ButtonAction } from '../../types';
import { getStylingStyles, getFontWeight, scale, parseGradient } from '../../utils/styles';
import { LinearGradient } from '../LinearGradient';

interface ButtonBlockProps {
  content: ButtonBlockContent;
  styling?: BlockStyling;
  onPress: (action: ButtonAction) => void;
  disabled?: boolean;
  /** Scale factor for proportional sizing in WYSIWYG mode */
  scaleFactor?: number;
  /** Max width for the button block */
  maxWidth?: number;
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
  scaleFactor = 1,
  maxWidth,
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

  // Calculate styles with scaleFactor
  const sizeConfig = SIZE_PADDING[size];

  const bgColor = backgroundColor || presetConfig?.style?.backgroundColor || variantStyle.bg;
  const txtColor = textColor || presetConfig?.style?.textColor || variantStyle.text;
  const btnBorderRadius = (presetConfig?.style?.borderRadius || borderRadius) * scaleFactor;

  // Match Swift SDK's ButtonBlockView behavior:
  // - Container maxWidth is set by FlowRenderer (280px for buttons)
  // - fullWidth property controls whether button fills its container
  // - When fullWidth == true, button expands to fill container (like .infinity in SwiftUI)
  // - When fullWidth == false, button sizes to content
  const containerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    // Button container is limited by maxWidth from FlowRenderer
    // fullWidth controls whether button fills that container
    width: fullWidth ? maxWidth : undefined,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
  };

  // Check if we should use gradient
  const hasGradient = backgroundGradient && backgroundGradient.colors && backgroundGradient.colors.length >= 2;

  const buttonStyle: ViewStyle = {
    // Only set backgroundColor if not using gradient
    ...(hasGradient ? {} : { backgroundColor: bgColor }),
    borderRadius: btnBorderRadius,
    paddingHorizontal: (paddingHorizontal ?? sizeConfig.h) * scaleFactor,
    paddingVertical: (paddingVertical ?? sizeConfig.v) * scaleFactor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
    // fullWidth buttons fill their container (matches Swift .frame(maxWidth: .infinity))
    ...(fullWidth && { width: '100%' }),
    // Border for outline variant
    ...(variant === 'outline' && {
      borderWidth: 1,
      borderColor: variantStyle.border,
    }),
    // Ensure overflow is hidden for gradient to respect border radius
    overflow: 'hidden',
  };

  // Gradient style needs to match button dimensions
  const gradientStyle: ViewStyle = {
    ...StyleSheet.absoluteFillObject,
    borderRadius: btnBorderRadius,
  };

  // Content container style for when using gradient
  const contentContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: (paddingHorizontal ?? sizeConfig.h) * scaleFactor,
    paddingVertical: (paddingVertical ?? sizeConfig.v) * scaleFactor,
  };

  const textStyle: TextStyle = {
    color: txtColor,
    fontSize: (fontSize || sizeConfig.fontSize) * scaleFactor,
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

  // Render button content (icon + text)
  const renderContent = () => (
    <>
      {displayIcon && iconPosition === 'left' && (
        <Text style={[textStyle, { marginRight: 8 * scaleFactor }]}>{displayIcon}</Text>
      )}
      <Text style={textStyle}>{displayText}</Text>
      {displayIcon && iconPosition === 'right' && (
        <Text style={[textStyle, { marginLeft: 8 * scaleFactor }]}>{displayIcon}</Text>
      )}
    </>
  );

  // If using gradient, render with LinearGradient
  if (hasGradient) {
    const { colors, start, end } = parseGradient(backgroundGradient!);

    return (
      <View style={containerStyle}>
        <TouchableOpacity
          style={[buttonStyle, { paddingHorizontal: 0, paddingVertical: 0 }]}
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={colors}
            start={start}
            end={end}
            style={{ ...gradientStyle, position: 'relative' } as ViewStyle}
          >
            <View style={contentContainerStyle}>
              {renderContent()}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // Standard button without gradient
  return (
    <View style={containerStyle}>
      <TouchableOpacity
        style={buttonStyle}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {renderContent()}
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
