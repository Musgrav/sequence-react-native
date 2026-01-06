import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import type { TextBlockContent, TextSpan, BlockStyling } from '../../types';
import {
  getStylingStyles,
  getFontWeight,
  getVariantFontSize,
  getVariantFontWeight,
  getTextAlign,
  scale,
} from '../../utils/styles';

interface TextBlockProps {
  content: TextBlockContent;
  styling?: BlockStyling;
  collectedData?: Record<string, string | string[] | number>;
  /** Scale factor for proportional sizing in WYSIWYG mode */
  scaleFactor?: number;
  /** Max width for the text block */
  maxWidth?: number;
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
  defaultFontSize?: number
): React.ReactNode[] {
  return spans.map((span, index) => {
    const style: TextStyle = {
      color: span.color || defaultColor,
      fontWeight: span.bold ? '700' : undefined,
      fontStyle: span.italic ? 'italic' : undefined,
      textDecorationLine: span.underline ? 'underline' : undefined,
      fontFamily: span.fontFamily,
      fontSize: span.fontSize ? scale(span.fontSize) : defaultFontSize,
    };

    return (
      <Text key={index} style={style}>
        {span.text}
      </Text>
    );
  });
}

export function TextBlock({ content, styling, collectedData = {}, scaleFactor = 1, maxWidth }: TextBlockProps) {
  const {
    text,
    variant = 'body',
    color = '#000000',
    align = 'center',
    fontWeight,
    fontFamily,
    fontSize,
    lineHeight,
    letterSpacing,
    richText,
  } = content;

  // Calculate font size based on variant or custom, then scale by scaleFactor
  const baseFontSize = fontSize || getVariantFontSize(variant);
  const scaledFontSize = baseFontSize * scaleFactor;

  // Calculate font weight based on variant or custom
  const baseWeight = fontWeight
    ? getFontWeight(fontWeight)
    : getVariantFontWeight(variant);

  const textStyle: TextStyle = {
    fontSize: scaledFontSize,
    fontWeight: baseWeight,
    color,
    textAlign: getTextAlign(align),
    fontFamily,
    lineHeight: lineHeight ? lineHeight * baseFontSize * scaleFactor : undefined,
    letterSpacing: letterSpacing ? letterSpacing * scaleFactor : undefined,
    // Apply variant-specific opacity for caption/label
    opacity: variant === 'caption' ? 0.7 : variant === 'label' ? 0.6 : 1,
    // Label variant is uppercase
    textTransform: variant === 'label' ? 'uppercase' : undefined,
  };

  // Match Swift SDK's TextBlockView behavior:
  // - Position represents TOP-LEFT of the text container
  // - maxWidth sets the max width for wrapping
  // - Text naturally sizes to content (fit-content)
  const containerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    maxWidth: maxWidth,
    // Ensure text wraps within maxWidth (matching web's width: fit-content; max-width: 280px)
    flexShrink: 1,
  };

  // Render rich text if available
  if (richText && richText.length > 0) {
    return (
      <View style={containerStyle}>
        <Text style={textStyle}>
          {renderRichTextSpans(richText, color, scaledFontSize)}
        </Text>
      </View>
    );
  }

  // Interpolate variables in plain text
  const displayText = interpolateText(text, collectedData);

  return (
    <View style={containerStyle}>
      <Text style={textStyle}>{displayText}</Text>
    </View>
  );
}
