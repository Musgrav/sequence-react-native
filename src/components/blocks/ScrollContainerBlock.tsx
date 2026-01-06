import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import type {
  ScrollContainerBlockContent,
  ContentBlock,
  BlockStyling,
  ButtonAction,
  CollectedData,
} from '../../types';
import { getStylingStyles } from '../../utils/styles';
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
} from './index';

interface ScrollContainerBlockProps {
  content: ScrollContainerBlockContent;
  styling?: BlockStyling;
  scaleFactor?: number;
  maxWidth?: number;
  collectedData: CollectedData;
  onDataChange: (fieldName: string, value: string | string[] | number) => void;
  onAction: (action: ButtonAction) => void;
  validationErrors?: Set<string>;
  currentScreenIndex: number;
  totalScreens: number;
}

/**
 * ScrollContainerBlock - A scrollable container for nested blocks
 * Matches web FlowRenderer's ScrollContainerBlock implementation
 */
export function ScrollContainerBlock({
  content,
  styling,
  scaleFactor = 1,
  maxWidth,
  collectedData,
  onDataChange,
  onAction,
  validationErrors = new Set(),
  currentScreenIndex,
  totalScreens,
}: ScrollContainerBlockProps) {
  const {
    children = [],
    height = 300,
    maxHeight,
    backgroundColor,
    padding = 16,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    gap = 12,
    borderRadius = 16,
    showScrollIndicator = false,
    scrollSnap = 'none',
  } = content;

  const s = (v: number) => v * scaleFactor;

  // Sort children by order
  const sortedChildren = [...children].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Container style
  const containerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    width: maxWidth || '100%',
    height: height === 'auto' ? undefined : s(height),
    maxHeight: maxHeight ? s(maxHeight) : undefined,
    backgroundColor: backgroundColor || 'transparent',
    borderRadius: s(borderRadius),
    overflow: 'hidden',
  };

  // Content style
  const contentStyle: ViewStyle = {
    paddingTop: s(paddingTop ?? padding),
    paddingBottom: s(paddingBottom ?? padding),
    paddingLeft: s(paddingLeft ?? padding),
    paddingRight: s(paddingRight ?? padding),
    gap: s(gap),
  };

  // Render a child block
  const renderChildBlock = (block: ContentBlock) => {
    const { type, content: blockContent, styling: blockStyling } = block;

    switch (type) {
      case 'text':
        return (
          <TextBlock
            content={blockContent as any}
            styling={blockStyling}
            collectedData={collectedData}
            scaleFactor={scaleFactor}
          />
        );
      case 'image':
        return (
          <ImageBlock
            content={blockContent as any}
            styling={blockStyling}
            scaleFactor={scaleFactor}
          />
        );
      case 'button':
        return (
          <ButtonBlock
            content={blockContent as any}
            styling={blockStyling}
            onPress={onAction}
            scaleFactor={scaleFactor}
          />
        );
      case 'input': {
        const inputContent = blockContent as any;
        const value = collectedData[inputContent.fieldName];
        return (
          <InputBlock
            content={inputContent}
            styling={blockStyling}
            value={typeof value === 'string' ? value : ''}
            onChangeValue={onDataChange}
            hasError={validationErrors.has(inputContent.fieldName)}
            scaleFactor={scaleFactor}
          />
        );
      }
      case 'checklist': {
        const checklistContent = blockContent as any;
        const selected = checklistContent.fieldName
          ? collectedData[checklistContent.fieldName]
          : [];
        return (
          <ChecklistBlock
            content={checklistContent}
            styling={blockStyling}
            selectedItems={Array.isArray(selected) ? selected : selected ? [String(selected)] : []}
            onSelectionChange={(fieldName: string | undefined, selectedIds: string[]) => {
              if (fieldName) onDataChange(fieldName, selectedIds);
            }}
            onAction={onAction}
            scaleFactor={scaleFactor}
          />
        );
      }
      case 'slider': {
        const sliderContent = blockContent as any;
        const value = collectedData[sliderContent.fieldName];
        return (
          <SliderBlock
            content={sliderContent}
            styling={blockStyling}
            value={typeof value === 'number' ? value : sliderContent.defaultValue}
            onChangeValue={onDataChange}
            scaleFactor={scaleFactor}
          />
        );
      }
      case 'spacer':
        return (
          <SpacerBlock
            content={blockContent as any}
            styling={blockStyling}
            scaleFactor={scaleFactor}
          />
        );
      case 'divider':
        return (
          <DividerBlock
            content={blockContent as any}
            styling={blockStyling}
            scaleFactor={scaleFactor}
          />
        );
      case 'icon':
        return (
          <IconBlock
            content={blockContent as any}
            styling={blockStyling}
            scaleFactor={scaleFactor}
          />
        );
      case 'feature-card':
        return (
          <FeatureCardBlock
            content={blockContent as any}
            styling={blockStyling}
            scaleFactor={scaleFactor}
            collectedData={collectedData}
          />
        );
      case 'progress':
        return (
          <ProgressBlock
            content={blockContent as any}
            styling={blockStyling}
            currentScreenIndex={currentScreenIndex}
            totalScreens={totalScreens}
            scaleFactor={scaleFactor}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={containerStyle}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={showScrollIndicator}
        bounces={true}
        snapToAlignment={scrollSnap !== 'none' ? scrollSnap : undefined}
      >
        {sortedChildren.map((child) => (
          <View key={child.id} style={styles.childContainer}>
            {renderChildBlock(child)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  childContainer: {
    width: '100%',
  },
});
