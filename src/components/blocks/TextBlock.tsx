import React from 'react';
import { Text } from 'react-native';
import type { TextStyle } from 'react-native';
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
    // Line height: multiplier * scaledFontSize (in React Native, lineHeight is absolute pixels)
    // Web passes lineHeight as a multiplier (e.g., 1.5) which CSS interprets correctly
    // React Native needs an absolute value, so we multiply by the already-scaled font size
    lineHeight: lineHeight ? lineHeight * scaledFontSize : undefined,
    // Letter spacing scaled
    letterSpacing: letterSpacing ? s(letterSpacing) : undefined,
  };

  // Text block rendering approach - matching web's behavior:
  // Web: <p className="max-w-[280px]" style={{ width: 'fit-content', textAlign: '...' }}>
  //
  // In React Native:
  // - Text naturally sizes to content (like fit-content)
  // - Use maxWidth on the text style to cap the width
  // - flexShrink: 0 prevents unwanted shrinking
  // - No container View needed - simpler and matches web behavior
  //
  // The parent View in FlowRenderer uses maxWidth on the positioning container,
  // which allows this Text to size naturally up to that limit.

  // Get styling styles but apply to appropriate places
  const stylingStyles = getStylingStyles(styling);

  // Render rich text if available
  if (richText && richText.length > 0) {
    return (
      <Text style={[textStyle, stylingStyles]}>
        {renderRichTextSpans(richText, color, scaledFontSize, scaleFactor)}
      </Text>
    );
  }

  // Interpolate variables in plain text
  const displayText = interpolateText(text, collectedData);

  // Render plain text - no container needed, Text handles everything
  return (
    <Text style={[textStyle, stylingStyles]}>{displayText}</Text>
  );
}
