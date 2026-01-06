import React from 'react';
import { View, Text } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { FeatureCardBlockContent, BlockStyling, TextSpan, CollectedData } from '../../types';
import { getStylingStyles, getFontWeight, createShadowStyle } from '../../utils/styles';

interface FeatureCardBlockProps {
  content: FeatureCardBlockContent;
  styling?: BlockStyling;
  /** Scale factor for proportional sizing in WYSIWYG mode */
  scaleFactor?: number;
  /** Max width for the feature card block */
  maxWidth?: number;
  /** Collected data for variable interpolation */
  collectedData?: CollectedData;
}

/**
 * Interpolate variables in text (e.g., {fieldName})
 */
function interpolateText(
  text: string,
  data: Record<string, string | string[] | number>
): string {
  return text.replace(/\{([^}]+)\}/g, (match, key) => {
    const value = data[key.trim()];
    if (value === undefined) return match;
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  });
}

/**
 * Render rich text spans with formatting
 */
function renderRichTextSpans(
  spans: TextSpan[],
  defaultColor?: string,
  defaultFontSize?: number,
  scaleFactor: number = 1,
  collectedData: CollectedData = {}
): React.ReactNode[] {
  return spans.map((span, index) => {
    const style: TextStyle = {
      color: span.color || defaultColor,
      fontWeight: span.bold ? '700' : undefined,
      fontStyle: span.italic ? 'italic' : undefined,
      textDecorationLine: span.underline ? 'underline' : undefined,
      fontFamily: span.fontFamily,
      fontSize: span.fontSize ? span.fontSize * scaleFactor : defaultFontSize,
    };

    // Interpolate variables in span text
    const text = interpolateText(span.text, collectedData);

    return (
      <Text key={index} style={style}>
        {text}
      </Text>
    );
  });
}

export function FeatureCardBlock({
  content,
  styling,
  scaleFactor = 1,
  maxWidth,
  collectedData = {},
}: FeatureCardBlockProps) {
  const {
    headline,
    headlineRichText,
    body,
    bodyRichText,
    headlineColor = '#000000',
    bodyColor = '#666666',
    headlineFontSize = 20,
    bodyFontSize = 16,
    headlineFontWeight = 'semibold',
    bodyFontWeight = 'normal',
    fontFamily,
    lineHeight,
    backgroundColor = '#F2F2F7',
    padding = 20,
    borderWidth = 0,
    borderColor,
    glowingBorder = false,
    glowColor,
    glowIntensity = 0.5,
    align = 'left',
    headlineBodyGap = 8,
  } = content;

  // Helper function for scaling
  const s = (v: number) => v * scaleFactor;

  const containerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    width: maxWidth || '100%',
  };

  const cardStyle: ViewStyle = {
    backgroundColor,
    padding: s(padding),
    borderRadius: s(styling?.borderRadius ?? 16),
    ...(borderWidth > 0 && {
      borderWidth,
      borderColor: borderColor || '#E5E5EA',
    }),
  };

  // Add glow effect
  if (glowingBorder && (glowColor || borderColor)) {
    const glow = glowColor || borderColor || '#007AFF';
    Object.assign(cardStyle, createShadowStyle({
      offsetX: 0,
      offsetY: 0,
      blur: 20 * glowIntensity,
      spread: 0,
      color: glow,
    }));
  }

  const headlineStyle: TextStyle = {
    fontSize: s(headlineFontSize),
    fontWeight: getFontWeight(headlineFontWeight),
    color: headlineColor,
    fontFamily,
    textAlign: align,
    lineHeight: lineHeight ? s(lineHeight * headlineFontSize) : undefined,
  };

  const bodyStyle: TextStyle = {
    fontSize: s(bodyFontSize),
    fontWeight: getFontWeight(bodyFontWeight),
    color: bodyColor,
    fontFamily,
    textAlign: align,
    marginTop: s(headlineBodyGap),
    lineHeight: lineHeight ? s(lineHeight * bodyFontSize) : undefined,
  };

  // Interpolate variables in headline and body
  const displayHeadline = headline ? interpolateText(headline, collectedData) : undefined;
  const displayBody = body ? interpolateText(body, collectedData) : undefined;

  return (
    <View style={containerStyle}>
      <View style={cardStyle}>
        {(displayHeadline || headlineRichText) && (
          <Text style={headlineStyle}>
            {headlineRichText && headlineRichText.length > 0
              ? renderRichTextSpans(headlineRichText, headlineColor, s(headlineFontSize), scaleFactor, collectedData)
              : displayHeadline}
          </Text>
        )}
        {(displayBody || bodyRichText) && (
          <Text style={bodyStyle}>
            {bodyRichText && bodyRichText.length > 0
              ? renderRichTextSpans(bodyRichText, bodyColor, s(bodyFontSize), scaleFactor, collectedData)
              : displayBody}
          </Text>
        )}
      </View>
    </View>
  );
}
