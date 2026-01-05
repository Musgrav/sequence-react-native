import React from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import type { SpacerBlockContent, BlockStyling } from '../../types';
import { getStylingStyles, scale } from '../../utils/styles';

interface SpacerBlockProps {
  content: SpacerBlockContent;
  styling?: BlockStyling;
}

export function SpacerBlock({ content, styling }: SpacerBlockProps) {
  const { height } = content;

  const spacerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    height: scale(height),
    width: '100%',
  };

  return <View style={spacerStyle} />;
}
