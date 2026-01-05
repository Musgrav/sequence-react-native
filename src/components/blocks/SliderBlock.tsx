import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import type { ViewStyle, TextStyle } from 'react-native';
import type { SliderBlockContent, BlockStyling } from '../../types';
import { getStylingStyles, getFontWeight, scale } from '../../utils/styles';

interface SliderBlockProps {
  content: SliderBlockContent;
  styling?: BlockStyling;
  value?: number;
  onChangeValue: (fieldName: string, value: number) => void;
}

export function SliderBlock({
  content,
  styling,
  value,
  onChangeValue,
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

  const containerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    width: width === 'full' ? '100%' : scale(width),
    alignItems: 'center',
  };

  const handleValueChange = (newValue: number) => {
    onChangeValue(fieldName, newValue);
  };

  return (
    <View style={containerStyle}>
      {showValue && (
        <View style={styles.valueContainer}>
          <Text
            style={[
              styles.valueText,
              {
                color: valueColor,
                fontSize: scale(valueFontSize),
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
                  fontSize: scale(suffixFontSize || valueFontSize * 0.5),
                },
              ]}
            >
              {valueSuffix}
            </Text>
          )}
        </View>
      )}

      <View style={styles.sliderContainer}>
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
