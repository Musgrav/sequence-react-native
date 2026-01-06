import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import type { ViewStyle } from 'react-native';
import type {
  ContentBlock,
  ButtonAction,
  TextBlockContent,
  ImageBlockContent,
  ButtonBlockContent,
  InputBlockContent,
  ChecklistBlockContent,
  SliderBlockContent,
  SpacerBlockContent,
  DividerBlockContent,
  IconBlockContent,
  FeatureCardBlockContent,
  ProgressBlockContent,
  CollectedData,
  ScrollContainerBlockContent,
} from '../types';
import { getStylingStyles } from '../utils/styles';
import {
  TextBlock,
  ImageBlock,
  ButtonBlock,
  InputBlock,
  ChecklistBlock,
  SliderBlock,
  SpacerBlock,
  DividerBlock,
  IconBlock,
  FeatureCardBlock,
  ProgressBlock,
} from './blocks';
import { ScrollContainerBlock } from './blocks/ScrollContainerBlock';

interface ContentBlockRendererProps {
  block: ContentBlock;
  collectedData: CollectedData;
  onDataChange: (fieldName: string, value: string | string[] | number) => void;
  onAction: (action: ButtonAction) => void;
  currentScreenIndex: number;
  totalScreens: number;
  validationErrors?: Set<string>;
  renderCustomBlock?: (identifier: string, props?: Record<string, unknown>) => React.ReactNode;
  /** Scale factor for proportional sizing in WYSIWYG mode */
  scaleFactor?: number;
  /** Max width for the block content */
  maxWidth?: number;
}

export function ContentBlockRenderer({
  block,
  collectedData,
  onDataChange,
  onAction,
  currentScreenIndex,
  totalScreens,
  validationErrors = new Set(),
  renderCustomBlock,
  scaleFactor = 1,
  maxWidth,
}: ContentBlockRendererProps) {
  const { type, content, styling, animation, visible = true } = block;

  // Animation values
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animation || animation.type === 'none') {
      animatedValue.setValue(1);
      return;
    }

    const delay = animation.delay || 0;
    const duration = animation.duration || 300;

    const timeout = setTimeout(() => {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, [animation, animatedValue]);

  // Don't render if not visible
  if (!visible) {
    return null;
  }

  // Get animation styles - memoized for performance
  const getAnimationStyle = (): ViewStyle | { opacity: Animated.Value; transform: { translateY?: Animated.AnimatedInterpolation<number>; translateX?: Animated.AnimatedInterpolation<number>; scale?: Animated.AnimatedInterpolation<number> }[] } => {
    if (!animation || animation.type === 'none') {
      return {};
    }

    const baseOpacity = animatedValue;

    switch (animation.type) {
      case 'fade':
        return { opacity: baseOpacity };

      case 'slide-up':
        return {
          opacity: baseOpacity,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [50 * scaleFactor, 0],
              }),
            },
          ],
        };

      case 'slide-down':
        return {
          opacity: baseOpacity,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-50 * scaleFactor, 0],
              }),
            },
          ],
        };

      case 'slide-left':
        return {
          opacity: baseOpacity,
          transform: [
            {
              translateX: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [50 * scaleFactor, 0],
              }),
            },
          ],
        };

      case 'slide-right':
        return {
          opacity: baseOpacity,
          transform: [
            {
              translateX: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-50 * scaleFactor, 0],
              }),
            },
          ],
        };

      case 'scale':
        return {
          opacity: baseOpacity,
          transform: [
            {
              scale: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        };

      case 'bounce':
        return {
          opacity: baseOpacity,
          transform: [
            {
              scale: animatedValue.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 1.1, 1],
              }),
            },
          ],
        };

      default:
        return {};
    }
  };

  // Get styling styles with rotation support
  const stylingStyles = useMemo((): ViewStyle => {
    const baseStyles = getStylingStyles(styling);

    // Add rotation transform if specified
    if (styling?.rotation) {
      const rotationTransform = { rotate: `${styling.rotation}deg` };
      if (baseStyles.transform) {
        // If there are existing transforms, add rotation to them
        (baseStyles.transform as any[]).push(rotationTransform);
      } else {
        baseStyles.transform = [rotationTransform] as any;
      }
    }

    return baseStyles;
  }, [styling]);

  // Render block content based on type
  const renderBlockContent = (): React.ReactNode => {
    switch (type) {
      case 'text':
        return (
          <TextBlock
            content={content as TextBlockContent}
            styling={styling}
            collectedData={collectedData}
            scaleFactor={scaleFactor}
            maxWidth={maxWidth}
          />
        );

      case 'image':
        return (
          <ImageBlock
            content={content as ImageBlockContent}
            styling={styling}
            scaleFactor={scaleFactor}
            maxWidth={maxWidth}
          />
        );

      case 'button':
        return (
          <ButtonBlock
            content={content as ButtonBlockContent}
            styling={styling}
            onPress={onAction}
            scaleFactor={scaleFactor}
            maxWidth={maxWidth}
          />
        );

      case 'input': {
        const inputContent = content as InputBlockContent;
        const value = collectedData[inputContent.fieldName];
        return (
          <InputBlock
            content={inputContent}
            styling={styling}
            value={typeof value === 'string' ? value : ''}
            onChangeValue={(fieldName: string, val: string) => onDataChange(fieldName, val)}
            hasError={validationErrors.has(inputContent.fieldName)}
            scaleFactor={scaleFactor}
            maxWidth={maxWidth}
          />
        );
      }

      case 'checklist': {
        const checklistContent = content as ChecklistBlockContent;
        const selected = checklistContent.fieldName
          ? collectedData[checklistContent.fieldName]
          : [];
        return (
          <ChecklistBlock
            content={checklistContent}
            styling={styling}
            selectedItems={Array.isArray(selected) ? selected : selected ? [String(selected)] : []}
            onSelectionChange={(fieldName: string | undefined, selectedIds: string[]) => {
              if (fieldName) {
                onDataChange(fieldName, selectedIds);
              }
            }}
            onAction={onAction}
            scaleFactor={scaleFactor}
            maxWidth={maxWidth}
          />
        );
      }

      case 'slider': {
        const sliderContent = content as SliderBlockContent;
        const value = collectedData[sliderContent.fieldName];
        return (
          <SliderBlock
            content={sliderContent}
            styling={styling}
            value={typeof value === 'number' ? value : sliderContent.defaultValue}
            onChangeValue={(fieldName: string, val: number) => onDataChange(fieldName, val)}
            scaleFactor={scaleFactor}
            maxWidth={maxWidth}
          />
        );
      }

      case 'spacer':
        return (
          <SpacerBlock
            content={content as SpacerBlockContent}
            styling={styling}
            scaleFactor={scaleFactor}
          />
        );

      case 'divider':
        return (
          <DividerBlock
            content={content as DividerBlockContent}
            styling={styling}
            scaleFactor={scaleFactor}
            maxWidth={maxWidth}
          />
        );

      case 'icon':
        return (
          <IconBlock
            content={content as IconBlockContent}
            styling={styling}
            scaleFactor={scaleFactor}
          />
        );

      case 'feature-card':
        return (
          <FeatureCardBlock
            content={content as FeatureCardBlockContent}
            styling={styling}
            scaleFactor={scaleFactor}
            maxWidth={maxWidth}
            collectedData={collectedData}
          />
        );

      case 'progress':
        return (
          <ProgressBlock
            content={content as ProgressBlockContent}
            styling={styling}
            currentScreenIndex={currentScreenIndex}
            totalScreens={totalScreens}
            scaleFactor={scaleFactor}
            maxWidth={maxWidth}
          />
        );

      case 'scroll-container':
        return (
          <ScrollContainerBlock
            content={content as ScrollContainerBlockContent}
            styling={styling}
            scaleFactor={scaleFactor}
            maxWidth={maxWidth}
            collectedData={collectedData}
            onDataChange={onDataChange}
            onAction={onAction}
            validationErrors={validationErrors}
            currentScreenIndex={currentScreenIndex}
            totalScreens={totalScreens}
          />
        );

      case 'custom': {
        const customContent = content as { identifier: string; props?: Record<string, unknown> };
        if (renderCustomBlock) {
          return renderCustomBlock(customContent.identifier, customContent.props);
        }
        return null;
      }

      // Video and Lottie require additional dependencies
      case 'video':
      case 'lottie':
        // Placeholder - these would require react-native-video and lottie-react-native
        return (
          <View style={styles.placeholder}>
            {/* Implement with appropriate library */}
          </View>
        );

      default:
        return null;
    }
  };

  // Container style - different for text vs other blocks
  // - Text blocks: no fixed width, allow natural sizing (like CSS fit-content)
  // - Other blocks: width: 100% to fill parent container
  //
  // This matches web behavior where text uses fit-content + max-width
  // while other blocks (buttons, inputs) fill their container
  const isTextBlock = type === 'text';
  const isIconBlock = type === 'icon';
  const shouldSizeNaturally = isTextBlock || isIconBlock;

  const containerStyle: ViewStyle = {
    // Text/icon: size naturally; others: fill parent
    ...(shouldSizeNaturally ? {} : { width: '100%' }),
    flexShrink: 0,
  };

  // Get animation style
  const animationStyle = getAnimationStyle();

  return (
    <Animated.View style={[containerStyle, stylingStyles, animationStyle as ViewStyle]}>
      {renderBlockContent()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
