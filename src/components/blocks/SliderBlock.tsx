import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder } from 'react-native';
import type { ViewStyle, TextStyle, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import type { SliderBlockContent, BlockStyling } from '../../types';
import { getStylingStyles, getFontWeight, scale } from '../../utils/styles';

// Try to use @react-native-community/slider
interface SliderComponent {
  (props: {
    style?: ViewStyle;
    minimumValue: number;
    maximumValue: number;
    step: number;
    value: number;
    onValueChange: (value: number) => void;
    minimumTrackTintColor?: string;
    maximumTrackTintColor?: string;
    thumbTintColor?: string;
  }): React.ReactElement;
}

let Slider: SliderComponent | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Slider = require('@react-native-community/slider').default;
} catch {
  // Slider not available - we'll use a fallback UI
}

interface SliderBlockProps {
  content: SliderBlockContent;
  styling?: BlockStyling;
  value?: number;
  onChangeValue: (fieldName: string, value: number) => void;
  /** Scale factor for proportional sizing in WYSIWYG mode */
  scaleFactor?: number;
  /** Max width for the slider block */
  maxWidth?: number;
}

export function SliderBlock({
  content,
  styling,
  value,
  onChangeValue,
  scaleFactor = 1,
  maxWidth,
}: SliderBlockProps) {
  const {
    fieldName,
    min,
    max,
    step = 1,
    defaultValue = min,
    showValue = true,
    valuePrefix = '',
    valueSuffix = '',
    showMinMax = true,
    fillColor = '#007AFF',
    trackColor = '#E5E5EA',
    thumbColor = '#FFFFFF',
    thumbSize = 28,
    trackHeight = 4,
    width = 'full',
    valueColor = '#000000',
    valueFontSize = 32,
    valueFontWeight = 'bold',
    suffixFontSize = 16,
    labelColor = '#666666',
  } = content;

  const currentValue = value ?? defaultValue;

  // Helper function for scaling
  const s = (v: number) => v * scaleFactor;

  const containerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    width: maxWidth || (width === 'full' ? '100%' : s(width as number)),
    alignItems: 'center',
  };

  const handleValueChange = (newValue: number) => {
    onChangeValue(fieldName, newValue);
  };

  return (
    <View style={containerStyle}>
      {showValue && (
        <View style={[styles.valueContainer, { marginBottom: s(16) }]}>
          <Text
            style={[
              styles.valueText,
              {
                color: valueColor,
                fontSize: s(valueFontSize),
                fontWeight: getFontWeight(valueFontWeight),
              },
            ]}
          >
            {valuePrefix}
            {Math.round(currentValue)}
          </Text>
          {valueSuffix && (
            <Text
              style={[
                styles.suffixText,
                {
                  color: valueColor,
                  fontSize: s(suffixFontSize || valueFontSize * 0.5),
                },
              ]}
            >
              {valueSuffix}
            </Text>
          )}
        </View>
      )}

      <View style={styles.sliderContainer}>
        {Slider ? (
          <Slider
            style={styles.slider}
            minimumValue={min}
            maximumValue={max}
            step={step}
            value={currentValue}
            onValueChange={handleValueChange}
            minimumTrackTintColor={fillColor}
            maximumTrackTintColor={trackColor}
            thumbTintColor={thumbColor}
          />
        ) : (
          // Fallback: simple + / - buttons when slider package not installed
          <View style={styles.fallbackContainer}>
            <TouchableOpacity
              style={[styles.fallbackButton, { backgroundColor: trackColor }]}
              onPress={() => handleValueChange(Math.max(min, currentValue - step))}
            >
              <Text style={styles.fallbackButtonText}>−</Text>
            </TouchableOpacity>
            <View style={[styles.fallbackTrack, { backgroundColor: trackColor }]}>
              <View
                style={[
                  styles.fallbackFill,
                  {
                    backgroundColor: fillColor,
                    width: `${((currentValue - min) / (max - min)) * 100}%`,
                  },
                ]}
              />
            </View>
            <TouchableOpacity
              style={[styles.fallbackButton, { backgroundColor: trackColor }]}
              onPress={() => handleValueChange(Math.min(max, currentValue + step))}
            >
              <Text style={styles.fallbackButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {showMinMax && (
        <View style={styles.minMaxContainer}>
          <Text style={[styles.minMaxText, { color: labelColor }]}>
            {valuePrefix}{min}{valueSuffix}
          </Text>
          <Text style={[styles.minMaxText, { color: labelColor }]}>
            {valuePrefix}{max}{valueSuffix}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  valueText: {
    textAlign: 'center',
  },
  suffixText: {
    marginLeft: 4,
  },
  sliderContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  fallbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 40,
  },
  fallbackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  fallbackTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  fallbackFill: {
    height: '100%',
    borderRadius: 4,
  },
  minMaxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  minMaxText: {
    fontSize: 14,
  },
});
