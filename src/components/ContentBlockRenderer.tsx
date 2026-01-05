import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
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
} from '../types';
import { scale } from '../utils/styles';
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

interface ContentBlockRendererProps {
  block: ContentBlock;
  collectedData: CollectedData;
  onDataChange: (fieldName: string, value: string | string[] | number) => void;
  onAction: (action: ButtonAction) => void;
  currentScreenIndex: number;
  totalScreens: number;
  validationErrors?: Set<string>;
  renderCustomBlock?: (identifier: string, props?: Record<string, unknown>) => React.ReactNode;
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
}: ContentBlockRendererProps) {
  const { type, content, styling, animation, visible = true, pinToBottom } = block;

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
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, [animation, animatedValue]);

  // Don't render if not visible
  if (!visible) {
    return null;
  }

  // Get animation styles
  const getAnimationStyle = (): Animated.AnimatedProps<ViewStyle>['style'] => {
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
                outputRange: [50, 0],
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
                outputRange: [-50, 0],
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
                outputRange: [50, 0],
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
                outputRange: [-50, 0],
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

  // Render block content based on type
  const renderBlockContent = (): React.ReactNode => {
    switch (type) {
      case 'text':
        return (
          <TextBlock
            content={content as TextBlockContent}
            styling={styling}
            collectedData={collectedData}
          />
        );

      case 'image':
        return (
          <ImageBlock
            content={content as ImageBlockContent}
            styling={styling}
          />
        );

      case 'button':
        return (
          <ButtonBlock
            content={content as ButtonBlockContent}
            styling={styling}
            onPress={onAction}
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
            onChangeValue={(fieldName, val) => onDataChange(fieldName, val)}
            hasError={validationErrors.has(inputContent.fieldName)}
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
            onSelectionChange={(fieldName, selectedIds) => {
              if (fieldName) {
                onDataChange(fieldName, selectedIds);
              }
            }}
            onAction={onAction}
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
            onChangeValue={(fieldName, val) => onDataChange(fieldName, val)}
          />
        );
      }

      case 'spacer':
        return (
          <SpacerBlock
            content={content as SpacerBlockContent}
            styling={styling}
          />
        );

      case 'divider':
        return (
          <DividerBlock
            content={content as DividerBlockContent}
            styling={styling}
          />
        );

      case 'icon':
        return (
          <IconBlock
            content={content as IconBlockContent}
            styling={styling}
          />
        );

      case 'feature-card':
        return (
          <FeatureCardBlock
            content={content as FeatureCardBlockContent}
            styling={styling}
          />
        );

      case 'progress':
        return (
          <ProgressBlock
            content={content as ProgressBlockContent}
            styling={styling}
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

  const containerStyle: ViewStyle = {
    width: '100%',
    ...(pinToBottom && {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    }),
  };

  return (
    <Animated.View style={[containerStyle, getAnimationStyle()]}>
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
