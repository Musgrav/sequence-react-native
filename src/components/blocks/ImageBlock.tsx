import React, { useState } from 'react';
import { Image, View, ActivityIndicator, StyleSheet } from 'react-native';
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

/**
 * ImageBlock - Matches web editor and Swift SDK
 *
 * Features:
 * - WYSIWYG sizing with scaleFactor
 * - Support for 'full' width and 'auto' height
 * - Loading state with spinner
 * - Error state with placeholder
 * - Proper borderRadius scaling
 * - Object-fit (cover/contain/fill) support
 */
export function ImageBlock({
  content,
  styling,
  scaleFactor = 1,
  maxWidth,
}: ImageBlockProps) {
  const {
    src,
    alt,
    width = 'full',
    height = 'auto',
    borderRadius = 12,
    objectFit = 'cover',
  } = content;

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Helper function for scaling
  const s = (v: number) => v * scaleFactor;

  // Calculate container dimensions
  const containerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    // If styling has explicit width/height, use those
    ...(styling?.width === undefined && {
      width: maxWidth || '100%',
    }),
    overflow: 'hidden',
    borderRadius: s(borderRadius),
  };

  // Calculate image dimensions
  let imageWidth: number | '100%' = '100%';
  let imageHeight: number | undefined;
  let aspectRatio: number | undefined;

  // Handle explicit numeric width
  if (typeof width === 'number') {
    imageWidth = s(width);
    containerStyle.width = s(width);
  } else if (width === 'full') {
    imageWidth = '100%';
  }

  // Handle explicit numeric height
  if (typeof height === 'number') {
    imageHeight = s(height);
    containerStyle.height = s(height);
  } else if (height === 'auto') {
    // Auto height - use aspect ratio to maintain proportions
    // Default to 16:9 if no explicit height
    if (!styling?.height) {
      aspectRatio = 16 / 9;
    }
  }

  // Map objectFit to React Native resizeMode
  const resizeMode = objectFit === 'contain' ? 'contain' : objectFit === 'fill' ? 'stretch' : 'cover';

  const imageStyle: ImageStyle = {
    width: imageWidth,
    height: imageHeight,
    borderRadius: s(borderRadius),
    resizeMode,
    ...(aspectRatio && !imageHeight && { aspectRatio }),
  };

  // Placeholder for missing source
  if (!src) {
    return (
      <View style={[containerStyle, styles.placeholder, { aspectRatio: aspectRatio || 16 / 9 }]}>
        <View style={styles.placeholderIcon}>
          {/* Simple image placeholder icon using text */}
          <View style={styles.iconFrame}>
            <View style={styles.iconMountain} />
            <View style={styles.iconSun} />
          </View>
        </View>
      </View>
    );
  }

  // Error state
  if (hasError) {
    return (
      <View style={[containerStyle, styles.placeholder, { aspectRatio: aspectRatio || 16 / 9 }]}>
        <View style={styles.errorPlaceholder}>
          <View style={[styles.iconFrame, { borderColor: 'rgba(255,255,255,0.3)' }]}>
            <View style={[styles.iconMountain, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {isLoading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.5)" />
        </View>
      )}
      <Image
        source={{ uri: src }}
        style={imageStyle}
        accessibilityLabel={alt}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    opacity: 0.5,
  },
  errorPlaceholder: {
    opacity: 0.3,
  },
  iconFrame: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconMountain: {
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
    position: 'absolute',
    bottom: 4,
  },
  iconSun: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    position: 'absolute',
    top: 8,
    right: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
