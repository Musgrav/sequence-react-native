import React from 'react';
import { View, Text } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { IconBlockContent, BlockStyling } from '../../types';
import { getStylingStyles, getIconSize } from '../../utils/styles';

interface IconBlockProps {
  content: IconBlockContent;
  styling?: BlockStyling;
}

export function IconBlock({ content, styling }: IconBlockProps) {
  const { icon, size = 'lg', color } = content;

  const containerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    alignItems: 'center',
    justifyContent: 'center',
  };

  const iconStyle: TextStyle = {
    fontSize: getIconSize(size),
    color: color,
    textAlign: 'center',
  };

  return (
    <View style={containerStyle}>
      <Text style={iconStyle}>{icon}</Text>
    </View>
  );
}
