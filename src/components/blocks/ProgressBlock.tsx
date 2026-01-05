import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { ProgressBlockContent, BlockStyling } from '../../types';
import { getStylingStyles, scale } from '../../utils/styles';

interface ProgressBlockProps {
  content: ProgressBlockContent;
  styling?: BlockStyling;
  currentScreenIndex: number;
  totalScreens: number;
}

export function ProgressBlock({
  content,
  styling,
  currentScreenIndex,
  totalScreens,
}: ProgressBlockProps) {
  const {
    variant = 'bar',
    fillColor = '#007AFF',
    trackColor = '#E5E5EA',
    height = 4,
    size = 60,
    strokeWidth = 4,
    showPercentage = false,
    activeColor = '#007AFF',
    inactiveColor = '#E5E5EA',
    dotSize = 8,
    labels,
    showLabels = false,
    startScreen = 0,
    endScreen,
    animated = true,
  } = content;

  // Calculate effective range
  const effectiveStart = startScreen;
  const effectiveEnd = endScreen ?? totalScreens - 1;
  const effectiveTotal = effectiveEnd - effectiveStart + 1;
  const effectiveCurrent = Math.max(0, Math.min(currentScreenIndex - effectiveStart, effectiveTotal - 1));
  const progress = effectiveTotal > 1 ? effectiveCurrent / (effectiveTotal - 1) : 1;

  const containerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    width: '100%',
    alignItems: 'center',
  };

  // Bar variant
  if (variant === 'bar') {
    return (
      <View style={containerStyle}>
        <View
          style={[
            styles.barTrack,
            { height: scale(height), backgroundColor: trackColor },
          ]}
        >
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
        {showPercentage && (
          <Text style={styles.percentageText}>
            {Math.round(progress * 100)}%
          </Text>
        )}
      </View>
    );
  }

  // Dots variant
  if (variant === 'dots') {
    return (
      <View style={containerStyle}>
        <View style={styles.dotsContainer}>
          {Array.from({ length: effectiveTotal }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  width: scale(dotSize),
                  height: scale(dotSize),
                  borderRadius: scale(dotSize) / 2,
                  backgroundColor: index <= effectiveCurrent ? activeColor : inactiveColor,
                  marginHorizontal: scale(4),
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
      <View style={containerStyle}>
        <View style={styles.stepsContainer}>
          {Array.from({ length: effectiveTotal }).map((_, index) => (
            <View key={index} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  {
                    width: scale(24),
                    height: scale(24),
                    borderRadius: scale(12),
                    backgroundColor: index <= effectiveCurrent ? activeColor : inactiveColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    { color: index <= effectiveCurrent ? '#FFFFFF' : '#666666' },
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
              {showLabels && labels && labels[index] && (
                <Text style={styles.stepLabel}>{labels[index]}</Text>
              )}
              {index < effectiveTotal - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    {
                      backgroundColor: index < effectiveCurrent ? activeColor : inactiveColor,
                    },
                  ]}
                />
              )}
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Ring variant
  if (variant === 'ring') {
    const ringSize = scale(size);
    const ringStrokeWidth = scale(strokeWidth);
    const radius = (ringSize - ringStrokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    return (
      <View style={containerStyle}>
        <View style={{ width: ringSize, height: ringSize }}>
          <Svg width={ringSize} height={ringSize}>
            {/* Track */}
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke={trackColor}
              strokeWidth={ringStrokeWidth}
              fill="none"
            />
            {/* Fill */}
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke={fillColor}
              strokeWidth={ringStrokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
            />
          </Svg>
          {showPercentage && (
            <View style={styles.ringPercentageContainer}>
              <Text style={styles.ringPercentageText}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  barTrack: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  percentageText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {},
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  stepCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  stepLine: {
    height: 2,
    width: 40,
    marginHorizontal: 4,
  },
  ringPercentageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercentageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});
