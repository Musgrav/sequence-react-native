import React from 'react';
import { Text, View } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import type { TextBlockContent, TextSpan, BlockStyling } from '../../types';
import {
  getStylingStyles,
  getFontWeight,
  getTextAlign,
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
 * TextBlock - Matches Swift SDK's TextBlockView exactly
 *
 * Swift SDK Reference (OnboardingView.swift lines 514-602):
 * - Font sizes by variant: h1=34, h2=28, h3=22, body=16, caption=12, label=14
 * - Font weights by variant: h1/h2=bold, h3=semibold, label=medium, default=regular
 * - Position represents TOP-LEFT of text container
 * - maxWidth 280px (scaled) for text wrapping
 * - .multilineTextAlignment() for text alignment within container
 * - .lineLimit(nil) allows unlimited lines
 */

// Font sizes matching Swift SDK exactly
const VARIANT_FONT_SIZE: Record<string, number> = {
  h1: 34,
  h2: 28,
  h3: 22,
  body: 16,
  caption: 12,
  label: 14,
};

// Font weights matching Swift SDK exactly
const VARIANT_FONT_WEIGHT: Record<string, TextStyle['fontWeight']> = {
  h1: '700', // bold
  h2: '700', // bold
  h3: '600', // semibold
  label: '500', // medium
  body: '400', // regular
  caption: '400', // regular
};

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
  scaleFactor: number = 1
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

    return (
      <Text key={index} style={style}>
        {span.text}
      </Text>
    );
  });
}

export function TextBlock({
  content,
  styling,
  collectedData = {},
  scaleFactor = 1,
  maxWidth,
}: TextBlockProps) {
  const {
    text,
    variant = 'body',
    color = '#ffffff', // Swift SDK default
    align = 'center',
    fontWeight,
    fontFamily,
    fontSize,
    lineHeight,
    letterSpacing,
    richText,
  } = content;

  // Helper function for scaling
  const s = (v: number) => v * scaleFactor;

  // Calculate font size: custom fontSize overrides variant default
  const baseFontSize = fontSize ?? VARIANT_FONT_SIZE[variant] ?? 16;
  const scaledFontSize = s(baseFontSize);

  // Calculate font weight: custom fontWeight overrides variant default
  const computedWeight = fontWeight
    ? getFontWeight(fontWeight)
    : VARIANT_FONT_WEIGHT[variant] ?? '400';

  // Text style matching Swift SDK
  const textStyle: TextStyle = {
    fontSize: scaledFontSize,
    fontWeight: computedWeight,
    color,
    textAlign: getTextAlign(align),
    fontFamily,
    // Line height: Swift uses lineHeight multiplier * fontSize
    lineHeight: lineHeight ? s(lineHeight * baseFontSize) : undefined,
    // Letter spacing scaled
    letterSpacing: letterSpacing ? s(letterSpacing) : undefined,
  };

  // Container style matching Swift SDK's TextBlockView:
  // - .frame(maxWidth: maxWidth, alignment: .leading)
  // - Position represents TOP-LEFT of text container
  // - Text naturally sizes to content, maxWidth constrains wrapping
  const containerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    // Use width instead of maxWidth to ensure proper text wrapping
    // Swift SDK: .frame(maxWidth: maxWidth, alignment: .leading)
    width: maxWidth,
    // Allow the view to shrink to content if text is shorter
    alignSelf: 'flex-start',
  };

  // Render rich text if available
  if (richText && richText.length > 0) {
    return (
      <View style={containerStyle}>
        <Text style={textStyle} numberOfLines={0}>
          {renderRichTextSpans(richText, color, scaledFontSize, scaleFactor)}
        </Text>
      </View>
    );
  }

  // Interpolate variables in plain text
  const displayText = interpolateText(text, collectedData);

  return (
    <View style={containerStyle}>
      <Text style={textStyle} numberOfLines={0}>{displayText}</Text>
    </View>
  );
}
