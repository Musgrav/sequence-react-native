import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import type { FlowProgressIndicator } from '../types';
import { scale } from '../utils/styles';

interface FlowProgressBarProps {
  progressIndicator: FlowProgressIndicator;
  currentIndex: number;
  totalScreens: number;
  style?: ViewStyle;
}

export function FlowProgressBar({
  progressIndicator,
  currentIndex,
  totalScreens,
  style,
}: FlowProgressBarProps) {
  const {
    variant = 'bar',
    fillColor = '#007AFF',
    trackColor = '#E5E5EA',
    animated = true,
    startScreen = 0,
    endScreen,
    skipScreens = [],
  } = progressIndicator;

  // Calculate effective progress
  const effectiveStart = startScreen;
  const effectiveEnd = endScreen ?? totalScreens - 1;

  // Filter out skipped screens
  const effectiveScreens = Array.from(
    { length: effectiveEnd - effectiveStart + 1 },
    (_, i) => i + effectiveStart
  ).filter((i) => !skipScreens.includes(i));

  const effectiveTotal = effectiveScreens.length;
  const currentEffectiveIndex = effectiveScreens.indexOf(currentIndex);
  const progress = effectiveTotal > 1
    ? Math.max(0, currentEffectiveIndex) / (effectiveTotal - 1)
    : 1;

  // Bar variant
  if (variant === 'bar') {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.barTrack, { backgroundColor: trackColor }]}>
          <View
            style={[
              styles.barFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: fillColor,
              },
            ]}
          />
        </View>
      </View>
    );
  }

  // Dots variant
  if (variant === 'dots') {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.dotsContainer}>
          {effectiveScreens.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index <= currentEffectiveIndex ? fillColor : trackColor,
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  }

  // Steps variant
  if (variant === 'steps') {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.stepsContainer}>
          {effectiveScreens.map((_, index) => (
            <React.Fragment key={index}>
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor: index <= currentEffectiveIndex ? fillColor : trackColor,
                  },
                ]}
              />
              {index < effectiveScreens.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    {
                      backgroundColor: index < currentEffectiveIndex ? fillColor : trackColor,
                    },
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
    );
  }

  // Minimal variant (just a thin line)
  if (variant === 'minimal') {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.minimalTrack, { backgroundColor: trackColor }]}>
          <View
            style={[
              styles.minimalFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: fillColor,
              },
            ]}
          />
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  // Bar styles
  barTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  // Dots styles
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  // Steps styles
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepLine: {
    width: 24,
    height: 2,
    marginHorizontal: 2,
  },
  // Minimal styles
  minimalTrack: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  minimalFill: {
    height: '100%',
    borderRadius: 1,
  },
});
