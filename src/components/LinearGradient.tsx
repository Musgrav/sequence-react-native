import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';

interface LinearGradientProps {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  angle?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * A pure React Native LinearGradient implementation using layered Views.
 * This provides gradient support without requiring any external libraries.
 *
 * It works by stacking multiple semi-transparent color layers to approximate
 * a gradient effect. For most use cases (buttons, backgrounds), this provides
 * a visually acceptable result.
 */
export function LinearGradient({
  colors,
  start = { x: 0.5, y: 0 },
  end = { x: 0.5, y: 1 },
  angle,
  style,
  children,
}: LinearGradientProps) {
  if (!colors || colors.length === 0) {
    return <View style={style}>{children}</View>;
  }

  if (colors.length === 1) {
    return (
      <View style={[style, { backgroundColor: colors[0] }]}>
        {children}
      </View>
    );
  }

  // For a simple two-color gradient, we layer the colors
  // This creates a smooth visual transition
  const numLayers = Math.min(colors.length * 5, 20); // More layers = smoother gradient
  const layers: React.ReactNode[] = [];

  for (let i = 0; i < numLayers; i++) {
    const progress = i / (numLayers - 1);
    const colorIndex = Math.min(
      Math.floor(progress * (colors.length - 1)),
      colors.length - 2
    );
    const localProgress = (progress * (colors.length - 1)) - colorIndex;

    // Interpolate between colors
    const color1 = colors[colorIndex];
    const color2 = colors[colorIndex + 1];
    const blendedColor = blendColors(color1, color2, localProgress);

    // Calculate position based on gradient direction
    const positionStyle = getLayerPosition(i, numLayers, start, end);

    layers.push(
      <View
        key={i}
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: blendedColor,
            opacity: 1 / numLayers + 0.05, // Slight overlap for smoothness
          },
          positionStyle,
        ]}
        pointerEvents="none"
      />
    );
  }

  return (
    <View style={[style, styles.container]}>
      {/* Base layer with first color */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors[0] }]} />
      {/* Gradient layers */}
      {layers}
      {/* Content on top */}
      {children}
    </View>
  );
}

/**
 * Simple fallback: just use the first color as a solid background.
 * This is used when gradient rendering is too complex.
 */
export function GradientFallback({
  colors,
  style,
  children,
}: LinearGradientProps) {
  const backgroundColor = colors && colors.length > 0 ? colors[0] : 'transparent';
  return (
    <View style={[style, { backgroundColor }]}>
      {children}
    </View>
  );
}

// Helper to get layer positioning based on gradient direction
function getLayerPosition(
  index: number,
  total: number,
  start: { x: number; y: number },
  end: { x: number; y: number }
): ViewStyle {
  const progress = index / (total - 1);

  // Determine gradient direction
  const isVertical = Math.abs(end.y - start.y) > Math.abs(end.x - start.x);
  const isReversed = isVertical ? (end.y < start.y) : (end.x < start.x);

  if (isVertical) {
    // Vertical gradient (top to bottom or bottom to top)
    const position = isReversed ? (1 - progress) : progress;
    return {
      top: `${position * 100}%`,
      height: `${100 / total + 10}%`, // Slight overlap
    };
  } else {
    // Horizontal gradient (left to right or right to left)
    const position = isReversed ? (1 - progress) : progress;
    return {
      left: `${position * 100}%`,
      width: `${100 / total + 10}%`, // Slight overlap
    };
  }
}

// Helper to blend two colors
function blendColors(color1: string, color2: string, ratio: number): string {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);

  if (!rgb1 || !rgb2) {
    return ratio < 0.5 ? color1 : color2;
  }

  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio);
  const a = rgb1.a + (rgb2.a - rgb1.a) * ratio;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Parse color string to RGB values
function parseColor(color: string): { r: number; g: number; b: number; a: number } | null {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1,
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1,
      };
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255,
      };
    }
  }

  // Handle rgba colors
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1], 10),
      g: parseInt(rgbaMatch[2], 10),
      b: parseInt(rgbaMatch[3], 10),
      a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
    };
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default LinearGradient;
