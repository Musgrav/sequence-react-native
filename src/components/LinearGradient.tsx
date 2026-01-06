import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';

// Try to import native linear gradient
let NativeLinearGradient: React.ComponentType<{
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: ViewStyle;
  children?: React.ReactNode;
}> | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nativeGradient = require('react-native-linear-gradient');
  NativeLinearGradient = nativeGradient.default || nativeGradient;
} catch {
  // Native linear gradient not available, will use fallback
}

interface LinearGradientProps {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  angle?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * LinearGradient component that uses native implementation when available,
 * falls back to a layered View approximation otherwise.
 */
export function LinearGradient({
  colors,
  start = { x: 0.5, y: 0 },
  end = { x: 0.5, y: 1 },
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

  // Use native linear gradient if available
  if (NativeLinearGradient) {
    return (
      <NativeLinearGradient
        colors={colors}
        start={start}
        end={end}
        style={style}
      >
        {children}
      </NativeLinearGradient>
    );
  }

  // Fallback: Create a smooth gradient approximation using layered views
  const numLayers = Math.min(colors.length * 10, 30); // More layers = smoother gradient
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
          },
          positionStyle,
        ]}
        pointerEvents="none"
      />
    );
  }

  return (
    <View style={[style, styles.container]}>
      {layers}
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
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const isVertical = Math.abs(dy) >= Math.abs(dx);

  if (isVertical) {
    // Vertical gradient
    const isDownward = dy >= 0;
    const layerHeight = 100 / total;
    const position = isDownward ? progress * 100 : (1 - progress) * 100;
    return {
      top: `${position}%`,
      height: `${layerHeight + 2}%`, // Slight overlap to prevent gaps
      left: 0,
      right: 0,
    };
  } else {
    // Horizontal gradient
    const isRightward = dx >= 0;
    const layerWidth = 100 / total;
    const position = isRightward ? progress * 100 : (1 - progress) * 100;
    return {
      left: `${position}%`,
      width: `${layerWidth + 2}%`, // Slight overlap to prevent gaps
      top: 0,
      bottom: 0,
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

  if (a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
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
