import React from 'react';
import { Image, View } from 'react-native';
import type { ViewStyle, ImageStyle } from 'react-native';
import type { ImageBlockContent, BlockStyling } from '../../types';
import { getStylingStyles } from '../../utils/styles';

interface ImageBlockProps {
  content: ImageBlockContent;
  styling?: BlockStyling;
  /** Scale factor for proportional sizing in WYSIWYG mode */
  scaleFactor?: number;
  /** Max width for the image block */
  maxWidth?: number;
}

export function ImageBlock({ content, styling, scaleFactor = 1, maxWidth }: ImageBlockProps) {
  const {
    src,
    alt,
    width = 'full',
    height = 'auto',
    borderRadius = 0,
    objectFit = 'cover',
  } = content;

  const containerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    maxWidth: maxWidth,
  };

  // Calculate dimensions with scaleFactor
  let imageWidth: number | string = maxWidth || '100%';
  let imageHeight: number | 'auto' = 'auto';

  if (typeof width === 'number') {
    imageWidth = width * scaleFactor;
  }

  if (typeof height === 'number') {
    imageHeight = height * scaleFactor;
  }

  // Map objectFit to React Native resizeMode
  const resizeMode = objectFit === 'contain' ? 'contain' : objectFit === 'fill' ? 'stretch' : 'cover';

  const imageStyle: ImageStyle = {
    width: typeof imageWidth === 'string' ? imageWidth as ImageStyle['width'] : imageWidth,
    height: imageHeight === 'auto' ? undefined : imageHeight,
    borderRadius: borderRadius * scaleFactor,
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
