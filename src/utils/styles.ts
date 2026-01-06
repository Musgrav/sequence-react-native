import { StyleSheet, Dimensions, Platform } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { BlockStyling, BoxShadow } from '../types';
import { DESIGN_CANVAS } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Calculate scale factor from design canvas to device screen
 */
export function getScaleFactor(): number {
  const scaleX = SCREEN_WIDTH / DESIGN_CANVAS.width;
  const scaleY = SCREEN_HEIGHT / DESIGN_CANVAS.height;
  return Math.min(scaleX, scaleY);
}

/**
 * Scale a pixel value from design canvas to device screen
 */
export function scale(value: number): number {
  return Math.round(value * getScaleFactor());
}

/**
 * Scale X coordinate from design canvas to device screen (width-based)
 */
export function scaleX(value: number): number {
  return value * (SCREEN_WIDTH / DESIGN_CANVAS.width);
}

/**
 * Scale Y coordinate from design canvas to device screen (height-based)
 */
export function scaleY(value: number): number {
  return value * (SCREEN_HEIGHT / DESIGN_CANVAS.height);
}

/**
 * Get the uniform scale factor (width-based) for proportional sizing
 */
export function getUniformScale(): number {
  return SCREEN_WIDTH / DESIGN_CANVAS.width;
}

/**
 * Convert hex color to rgba
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  // Handle rgba already
  if (hex.startsWith('rgba')) return hex;
  if (hex.startsWith('rgb')) {
    // Convert rgb to rgba
    return hex.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  }

  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Parse hex values
  let r: number, g: number, b: number;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Convert BlockStyling to React Native ViewStyle
 */
export function getStylingStyles(styling?: BlockStyling): ViewStyle {
  if (!styling) return {};

  const styles: ViewStyle = {};

  // Padding
  if (styling.paddingTop !== undefined) styles.paddingTop = scale(styling.paddingTop);
  if (styling.paddingBottom !== undefined) styles.paddingBottom = scale(styling.paddingBottom);
  if (styling.paddingLeft !== undefined) styles.paddingLeft = scale(styling.paddingLeft);
  if (styling.paddingRight !== undefined) styles.paddingRight = scale(styling.paddingRight);

  // Margin
  if (styling.marginTop !== undefined) styles.marginTop = scale(styling.marginTop);
  if (styling.marginBottom !== undefined) styles.marginBottom = scale(styling.marginBottom);
  if (styling.marginLeft !== undefined) styles.marginLeft = scale(styling.marginLeft);
  if (styling.marginRight !== undefined) styles.marginRight = scale(styling.marginRight);

  // Size
  if (styling.width !== undefined) {
    if (styling.width === 'full') {
      styles.width = '100%';
    } else if (styling.width === 'auto') {
      styles.width = 'auto';
    } else {
      styles.width = scale(styling.width);
    }
  }

  if (styling.height !== undefined) {
    if (styling.height === 'auto') {
      styles.height = 'auto';
    } else {
      styles.height = scale(styling.height);
    }
  }

  if (styling.minWidth !== undefined) styles.minWidth = scale(styling.minWidth);
  if (styling.maxWidth !== undefined) styles.maxWidth = scale(styling.maxWidth);

  // Border radius
  const hasPerCornerRadius =
    styling.borderTopLeftRadius !== undefined ||
    styling.borderTopRightRadius !== undefined ||
    styling.borderBottomLeftRadius !== undefined ||
    styling.borderBottomRightRadius !== undefined;

  if (hasPerCornerRadius) {
    styles.borderTopLeftRadius = scale(styling.borderTopLeftRadius ?? styling.borderRadius ?? 0);
    styles.borderTopRightRadius = scale(styling.borderTopRightRadius ?? styling.borderRadius ?? 0);
    styles.borderBottomLeftRadius = scale(styling.borderBottomLeftRadius ?? styling.borderRadius ?? 0);
    styles.borderBottomRightRadius = scale(styling.borderBottomRightRadius ?? styling.borderRadius ?? 0);
  } else if (styling.borderRadius !== undefined) {
    // 9999 is used for fully rounded (pill shape)
    styles.borderRadius = styling.borderRadius === 9999 ? 9999 : scale(styling.borderRadius);
  }

  // Border
  if (styling.borderWidth !== undefined) styles.borderWidth = styling.borderWidth;
  if (styling.borderColor !== undefined) styles.borderColor = styling.borderColor;
  if (styling.borderStyle !== undefined) {
    // React Native only supports 'solid', 'dotted', 'dashed'
    styles.borderStyle = styling.borderStyle;
  }

  // Background
  if (styling.backgroundColor !== undefined) styles.backgroundColor = styling.backgroundColor;

  // Opacity
  if (styling.opacity !== undefined) styles.opacity = styling.opacity;

  // Shadow (iOS)
  if (styling.shadow && Platform.OS === 'ios') {
    const shadow = styling.shadow;
    styles.shadowColor = shadow.color;
    styles.shadowOffset = { width: shadow.offsetX, height: shadow.offsetY };
    styles.shadowOpacity = 1;
    styles.shadowRadius = shadow.blur / 2;
  }

  // Shadow (Android) - uses elevation
  if (styling.shadow && Platform.OS === 'android') {
    styles.elevation = Math.max(1, Math.round(styling.shadow.blur / 2));
  }

  // Rotation
  if (styling.rotation !== undefined) {
    styles.transform = [{ rotate: `${styling.rotation}deg` }];
  }

  return styles;
}

/**
 * Convert font weight string to React Native numeric weight
 */
export function getFontWeight(weight?: string): TextStyle['fontWeight'] {
  switch (weight) {
    case 'normal':
      return '400';
    case 'medium':
      return '500';
    case 'semibold':
      return '600';
    case 'bold':
      return '700';
    default:
      return '400';
  }
}

/**
 * Get default font size for text variant
 */
export function getVariantFontSize(variant: string): number {
  switch (variant) {
    case 'h1':
      return 34;
    case 'h2':
      return 28;
    case 'h3':
      return 22;
    case 'body':
      return 16;
    case 'caption':
      return 12;
    case 'label':
      return 14;
    default:
      return 16;
  }
}

/**
 * Get default font weight for text variant
 */
export function getVariantFontWeight(variant: string): TextStyle['fontWeight'] {
  switch (variant) {
    case 'h1':
    case 'h2':
      return '700';
    case 'h3':
      return '600';
    case 'label':
      return '500';
    default:
      return '400';
  }
}

/**
 * Get text alignment style
 */
export function getTextAlign(align?: string): TextStyle['textAlign'] {
  switch (align) {
    case 'left':
      return 'left';
    case 'right':
      return 'right';
    case 'center':
    default:
      return 'center';
  }
}

/**
 * Get icon size in pixels
 */
export function getIconSize(size?: string): number {
  switch (size) {
    case 'sm':
      return scale(24);
    case 'md':
      return scale(36);
    case 'lg':
      return scale(48);
    case 'xl':
      return scale(60);
    case '2xl':
      return scale(72);
    default:
      return scale(48);
  }
}

/**
 * Create shadow style from BoxShadow config
 */
export function createShadowStyle(shadow: BoxShadow): ViewStyle {
  if (Platform.OS === 'ios') {
    return {
      shadowColor: shadow.color,
      shadowOffset: { width: shadow.offsetX, height: shadow.offsetY },
      shadowOpacity: 1,
      shadowRadius: shadow.blur / 2,
    };
  } else {
    return {
      elevation: Math.max(1, Math.round(shadow.blur / 2)),
    };
  }
}

/**
 * Parse gradient colors and create gradient stops
 */
export function parseGradient(gradient: {
  type: 'linear' | 'radial';
  colors: string[];
  angle?: number;
}): { colors: string[]; start: { x: number; y: number }; end: { x: number; y: number } } {
  const { colors, angle = 180 } = gradient;

  // Convert angle to start/end points for LinearGradient
  const angleRad = ((angle - 90) * Math.PI) / 180;
  const x1 = 0.5 + Math.cos(angleRad) * 0.5;
  const y1 = 0.5 + Math.sin(angleRad) * 0.5;
  const x2 = 0.5 - Math.cos(angleRad) * 0.5;
  const y2 = 0.5 - Math.sin(angleRad) * 0.5;

  return {
    colors,
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
  };
}
