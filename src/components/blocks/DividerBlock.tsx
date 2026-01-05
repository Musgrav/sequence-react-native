import React from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import type { DividerBlockContent, BlockStyling } from '../../types';
import { getStylingStyles, scale } from '../../utils/styles';

interface DividerBlockProps {
  content: DividerBlockContent;
  styling?: BlockStyling;
}

export function DividerBlock({ content, styling }: DividerBlockProps) {
  const {
    color = '#E5E5EA',
    thickness = 1,
    style: dividerStyle = 'solid',
    width = 'full',
  } = content;

  const containerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    width: '100%',
    alignItems: 'center',
  };

  const dividerLineStyle: ViewStyle = {
    height: thickness,
    backgroundColor: color,
    width: width === 'full' ? '100%' : `${width}%`,
    borderStyle: dividerStyle,
  };

  // For dashed/dotted styles, we use border instead
  if (dividerStyle !== 'solid') {
    dividerLineStyle.height = 0;
    dividerLineStyle.borderBottomWidth = thickness;
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
