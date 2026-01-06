import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { ButtonBlockContent, BlockStyling, ButtonAction } from '../../types';
import { getStylingStyles, getFontWeight, parseGradient } from '../../utils/styles';
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

/**
 * ButtonBlock - Matches Swift SDK's ButtonBlockView exactly
 *
 * Swift SDK Reference (OnboardingView.swift lines 626-701):
 * - Standard buttons: 24pt horizontal, 16pt vertical padding (scaled)
 * - Font: system, 17pt, .semibold (scaled)
 * - Border radius: 12pt default (scaled)
 * - Icon spacing: 8pt (scaled)
 * - Default background: #10b981
 * - Default text: #ffffff
 *
 * Auth buttons (sign-in-apple, sign-in-google, sign-in-email):
 * - Icon size: 24pt × 24pt
 * - Padding: 20pt horizontal, 16pt vertical
 * - Border radius: 9999 (pill)
 * - Layout: HStack with icon left, centered text, spacer right
 */
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
    fullWidth = true,
    backgroundColor = '#10b981', // Swift SDK default
    textColor = '#ffffff', // Swift SDK default
    borderRadius = 12, // Swift SDK default
    backgroundGradient,
    preset,
    icon,
    iconPosition = 'left',
    fontFamily,
    fontSize = 17, // Swift SDK default
    fontWeight = 'semibold', // Swift SDK default
    paddingHorizontal = 24, // Swift SDK default
    paddingVertical = 16, // Swift SDK default
  } = content;

  // Helper function for scaling - matches Swift's scaleFactor usage
  const s = (v: number) => v * scaleFactor;

  // Check if this is an auth button
  const isAuthButton = preset?.startsWith('sign-in-');

  // Auth button specific settings
  const authConfig = isAuthButton ? getAuthConfig(preset!) : null;

  // Determine colors - use content values first, then auth config, then defaults
  const bgColor = content.backgroundColor || authConfig?.backgroundColor || backgroundColor;
  const txtColor = content.textColor || authConfig?.textColor || textColor;

  // Check if we should use gradient
  const hasGradient = backgroundGradient && backgroundGradient.colors && backgroundGradient.colors.length >= 2;

  // Container style - controls overall positioning
  // The parent FlowRenderer already sets width on the positioning container,
  // so we just need width: '100%' to fill it when fullWidth is true
  const containerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    // fullWidth: fill parent container (which already has maxWidth set)
    // not fullWidth: size to content (align to start)
    ...(fullWidth ? { width: '100%' } : { alignSelf: 'flex-start' }),
  };

  // Determine display text
  const displayText = text || authConfig?.text || 'Continue';
  const displayIcon = icon || authConfig?.icon;

  const handlePress = () => {
    if (!disabled) {
      onPress(action);
    }
  };

  // AUTH BUTTON RENDERING - matches Swift SDK exactly
  if (isAuthButton) {
    const authBorderRadius = s(9999); // Pill shape for auth buttons
    const authPaddingH = s(20);
    const authPaddingV = s(16);
    const iconSize = s(24);
    const iconSpacing = s(12);

    const authButtonStyle: ViewStyle = {
      backgroundColor: bgColor,
      borderRadius: authBorderRadius,
      paddingHorizontal: authPaddingH,
      paddingVertical: authPaddingV,
      flexDirection: 'row',
      alignItems: 'center',
      opacity: disabled ? 0.5 : 1,
      overflow: 'hidden',
      ...(fullWidth && { width: '100%' }),
    };

    const authTextStyle: TextStyle = {
      color: txtColor,
      fontSize: s(16),
      fontWeight: '500', // medium
      fontFamily,
      textAlign: 'center',
      flex: 1,
    };

    return (
      <View style={containerStyle}>
        <TouchableOpacity
          style={authButtonStyle}
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.7}
        >
          {/* Icon on left */}
          <View style={{ width: iconSize, height: iconSize, marginRight: iconSpacing, justifyContent: 'center', alignItems: 'center' }}>
            {renderAuthIcon(preset!, iconSize, txtColor)}
          </View>

          {/* Centered text */}
          <Text style={authTextStyle}>{displayText}</Text>

          {/* Spacer to balance icon */}
          <View style={{ width: iconSize, height: iconSize }} />
        </TouchableOpacity>
      </View>
    );
  }

  // STANDARD BUTTON RENDERING - matches Swift SDK exactly
  const btnBorderRadius = s(content.borderRadius ?? borderRadius);
  const btnPaddingH = s(content.paddingHorizontal ?? paddingHorizontal);
  const btnPaddingV = s(content.paddingVertical ?? paddingVertical);
  const iconSpacing = s(8);
  const iconFontSize = s(20);

  const buttonStyle: ViewStyle = {
    ...(hasGradient ? {} : { backgroundColor: bgColor }),
    borderRadius: btnBorderRadius,
    paddingHorizontal: btnPaddingH,
    paddingVertical: btnPaddingV,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
    overflow: 'hidden',
    ...(fullWidth && { width: '100%' }),
  };

  const textStyle: TextStyle = {
    color: txtColor,
    fontSize: s(content.fontSize ?? fontSize),
    fontWeight: getFontWeight(content.fontWeight ?? fontWeight),
    fontFamily,
    textAlign: 'center',
  };

  // Render button content (icon + text)
  const renderContent = () => (
    <>
      {displayIcon && iconPosition === 'left' && (
        <Text style={[textStyle, { fontSize: iconFontSize, marginRight: iconSpacing }]}>
          {displayIcon}
        </Text>
      )}
      <Text style={textStyle}>{displayText}</Text>
      {displayIcon && iconPosition === 'right' && (
        <Text style={[textStyle, { fontSize: iconFontSize, marginLeft: iconSpacing }]}>
          {displayIcon}
        </Text>
      )}
    </>
  );

  // GRADIENT BUTTON
  if (hasGradient) {
    const { colors, start, end } = parseGradient(backgroundGradient!);

    return (
      <View style={containerStyle}>
        <TouchableOpacity
          style={[buttonStyle, { paddingHorizontal: 0, paddingVertical: 0, backgroundColor: 'transparent' }]}
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={colors}
            start={start}
            end={end}
            style={{
              borderRadius: btnBorderRadius,
              paddingHorizontal: btnPaddingH,
              paddingVertical: btnPaddingV,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            {renderContent()}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // SOLID COLOR BUTTON
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

// Auth button configuration - matches Swift SDK
function getAuthConfig(preset: string): { backgroundColor: string; textColor: string; text: string; icon?: string } | null {
  switch (preset) {
    case 'sign-in-apple':
      return {
        backgroundColor: '#000000',
        textColor: '#FFFFFF',
        text: 'Sign in with Apple',
      };
    case 'sign-in-google':
      return {
        backgroundColor: '#FFFFFF',
        textColor: '#000000',
        text: 'Sign in with Google',
      };
    case 'sign-in-email':
      return {
        backgroundColor: '#10b981',
        textColor: '#FFFFFF',
        text: 'Sign in with Email',
        icon: '✉️',
      };
    default:
      return null;
  }
}

// Render auth icons - matches Swift SDK's auth icon views
function renderAuthIcon(preset: string, size: number, color: string): React.ReactNode {
  switch (preset) {
    case 'sign-in-apple':
      // Apple logo - using Apple symbol
      return (
        <Text style={{ fontSize: size * 0.8, color: '#FFFFFF', textAlign: 'center' }}>

        </Text>
      );
    case 'sign-in-google':
      // Google logo - colored G
      return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: size * 0.7, fontWeight: '700', color: '#4285F4' }}>G</Text>
        </View>
      );
    case 'sign-in-email':
      return (
        <Text style={{ fontSize: size * 0.7, color, textAlign: 'center' }}>✉️</Text>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({});
