import React from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import type { SpacerBlockContent, BlockStyling } from '../../types';
import { getStylingStyles } from '../../utils/styles';

interface SpacerBlockProps {
  content: SpacerBlockContent;
  styling?: BlockStyling;
  /** Scale factor for proportional sizing in WYSIWYG mode */
  scaleFactor?: number;
}

export function SpacerBlock({ content, styling, scaleFactor = 1 }: SpacerBlockProps) {
  const { height } = content;

  const spacerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    height: height * scaleFactor,
    width: '100%',
  };

  return <View style={spacerStyle} />;
}
