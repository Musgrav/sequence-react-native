import React from 'react';
import { View, Text } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { IconBlockContent, BlockStyling } from '../../types';
import { getStylingStyles } from '../../utils/styles';

interface IconBlockProps {
  content: IconBlockContent;
  styling?: BlockStyling;
  /** Scale factor for proportional sizing in WYSIWYG mode */
  scaleFactor?: number;
}

// Base icon sizes (in design canvas pixels) - must match Swift SDK
const ICON_SIZES: Record<string, number> = {
  sm: 24,
  md: 32,  // Swift SDK uses 32
  lg: 48,
  xl: 64,
  '2xl': 80,
};

export function IconBlock({ content, styling, scaleFactor = 1 }: IconBlockProps) {
  const { icon, size = 'lg', color } = content;

  const baseSize = ICON_SIZES[size] || ICON_SIZES.lg;
  const scaledSize = baseSize * scaleFactor;

  const containerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    alignItems: 'center',
    justifyContent: 'center',
  };

  const iconStyle: TextStyle = {
    fontSize: scaledSize,
    color: color,
    textAlign: 'center',
  };

  return (
    <View style={containerStyle}>
      <Text style={iconStyle}>{icon}</Text>
    </View>
  );
}
