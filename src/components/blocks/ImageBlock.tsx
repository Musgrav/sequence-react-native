import React from 'react';
import { Image, View, StyleSheet, Dimensions } from 'react-native';
import type { ViewStyle, ImageStyle } from 'react-native';
import type { ImageBlockContent, BlockStyling } from '../../types';
import { getStylingStyles, scale } from '../../utils/styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageBlockProps {
  content: ImageBlockContent;
  styling?: BlockStyling;
}

export function ImageBlock({ content, styling }: ImageBlockProps) {
  const {
    src,
    alt,
    width = 'full',
    height = 'auto',
    borderRadius = 0,
    objectFit = 'cover',
  } = content;

  const containerStyle: ViewStyle = getStylingStyles(styling);

  // Calculate dimensions
  let imageWidth: number | string = '100%';
  let imageHeight: number | 'auto' = 'auto';

  if (typeof width === 'number') {
    imageWidth = scale(width);
  }

  if (typeof height === 'number') {
    imageHeight = scale(height);
  }

  // Map objectFit to React Native resizeMode
  const resizeMode = objectFit === 'contain' ? 'contain' : objectFit === 'fill' ? 'stretch' : 'cover';

  const imageStyle: ImageStyle = {
    width: imageWidth,
    height: imageHeight === 'auto' ? undefined : imageHeight,
    borderRadius: scale(borderRadius),
    resizeMode,
  };

  // If height is auto, we need to use aspectRatio or let it be determined by content
  if (height === 'auto') {
    imageStyle.aspectRatio = undefined; // Let image determine aspect ratio
  }

  return (
    <View style={containerStyle}>
      <Image
        source={{ uri: src }}
        style={imageStyle}
        accessibilityLabel={alt}
      />
    </View>
  );
}
