import React from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import type { DividerBlockContent, BlockStyling } from '../../types';
import { getStylingStyles } from '../../utils/styles';

interface DividerBlockProps {
  content: DividerBlockContent;
  styling?: BlockStyling;
  /** Scale factor for proportional sizing in WYSIWYG mode */
  scaleFactor?: number;
  /** Max width for the divider block */
  maxWidth?: number;
}

export function DividerBlock({ content, styling, scaleFactor = 1, maxWidth }: DividerBlockProps) {
  const {
    color = '#E5E5EA',
    thickness = 1,
    style: dividerStyle = 'solid',
    width = 'full',
  } = content;

  const containerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    width: maxWidth || '100%',
    alignItems: 'center',
  };

  const scaledThickness = thickness * scaleFactor;

  const dividerLineStyle: ViewStyle = {
    height: scaledThickness,
    backgroundColor: color,
    width: width === 'full' ? '100%' : `${width}%`,
    borderStyle: dividerStyle,
  };

  // For dashed/dotted styles, we use border instead
  if (dividerStyle !== 'solid') {
    dividerLineStyle.height = 0;
    dividerLineStyle.borderBottomWidth = scaledThickness;
    dividerLineStyle.borderBottomColor = color;
    dividerLineStyle.borderStyle = dividerStyle;
    delete dividerLineStyle.backgroundColor;
  }

  return (
    <View style={containerStyle}>
      <View style={dividerLineStyle} />
    </View>
  );
}
