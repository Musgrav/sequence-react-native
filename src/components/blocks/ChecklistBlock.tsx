import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { ChecklistBlockContent, BlockStyling, ButtonAction } from '../../types';
import { getStylingStyles, scale, createShadowStyle } from '../../utils/styles';

// Optional haptics support - dynamically imported
interface HapticsModule {
  impactAsync: (style: unknown) => Promise<void>;
  ImpactFeedbackStyle: { Light: unknown; Medium: unknown; Heavy: unknown };
}
let Haptics: HapticsModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Haptics = require('expo-haptics') as HapticsModule;
} catch {
  // expo-haptics not available
}

interface ChecklistBlockProps {
  content: ChecklistBlockContent;
  styling?: BlockStyling;
  selectedItems: string[];
  onSelectionChange: (fieldName: string | undefined, selectedIds: string[]) => void;
  onAction?: (action: ButtonAction) => void;
}

export function ChecklistBlock({
  content,
  styling,
  selectedItems = [],
  onSelectionChange,
  onAction,
}: ChecklistBlockProps) {
  const {
    items,
    allowMultiple = false,
    minSelections = 1,
    maxSelections,
    action,
    autoAdvance = false,
    style: checklistStyle = 'list',
    columns = 1,
    activeColor = '#007AFF',
    inactiveColor = '#F2F2F7',
    fieldName,
    fontSize = 16,
    itemPadding = 16,
    itemGap = 8,
    borderRadius = 12,
    itemWidth = 'full',
    backgroundColor,
    textColor = '#000000',
    borderColor,
    showBorderWhenSelected = true,
    borderWhenUnselected = 'transparent',
    shadow = false,
    hapticEnabled = true,
    hapticIntensity = 'light',
  } = content;

  const containerStyle: ViewStyle = {
    ...getStylingStyles(styling),
    width: '100%',
  };

  const handleItemPress = async (itemId: string) => {
    // Trigger haptic feedback
    if (hapticEnabled && Platform.OS !== 'web' && Haptics) {
      try {
        const impactStyle =
          hapticIntensity === 'heavy'
            ? Haptics.ImpactFeedbackStyle.Heavy
            : hapticIntensity === 'medium'
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light;
        await Haptics.impactAsync(impactStyle);
      } catch {
        // Haptics not available
      }
    }

    let newSelection: string[];

    if (allowMultiple) {
      if (selectedItems.includes(itemId)) {
        // Deselect if already selected (respecting minSelections)
        if (selectedItems.length > minSelections) {
          newSelection = selectedItems.filter((id) => id !== itemId);
        } else {
          newSelection = selectedItems;
        }
      } else {
        // Select if under maxSelections
        if (!maxSelections || selectedItems.length < maxSelections) {
          newSelection = [...selectedItems, itemId];
        } else {
          newSelection = selectedItems;
        }
      }
    } else {
      // Single select - toggle or select new
      newSelection = selectedItems.includes(itemId) ? [] : [itemId];
    }

    onSelectionChange(fieldName, newSelection);

    // Auto-advance for single select
    if (!allowMultiple && autoAdvance && action && newSelection.length > 0) {
      setTimeout(() => {
        onAction?.(action);
      }, 200);
    }
  };

  const getItemStyle = (isSelected: boolean): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: isSelected
        ? backgroundColor || activeColor
        : backgroundColor || inactiveColor,
      borderRadius: scale(borderRadius),
      padding: scale(itemPadding),
      marginBottom: scale(itemGap),
      alignItems: 'center',
      justifyContent: 'center',
    };

    // Border handling
    if (isSelected && showBorderWhenSelected) {
      baseStyle.borderWidth = 2;
      baseStyle.borderColor = borderColor || activeColor;
    } else if (borderWhenUnselected && borderWhenUnselected !== 'none') {
      baseStyle.borderWidth = 2;
      baseStyle.borderColor =
        borderWhenUnselected === 'transparent' ? 'transparent' : borderWhenUnselected;
    }

    // Shadow
    if (shadow) {
      Object.assign(baseStyle, createShadowStyle({
        offsetX: 0,
        offsetY: 2,
        blur: 8,
        spread: 0,
        color: 'rgba(0,0,0,0.1)',
      }));
    }

    // Width
    if (typeof itemWidth === 'number') {
      baseStyle.width = scale(itemWidth);
    } else {
      baseStyle.flex = columns === 2 ? undefined : 1;
      baseStyle.width = columns === 2 ? '48%' : '100%';
    }

    return baseStyle;
  };

  const getTextStyle = (isSelected: boolean): TextStyle => ({
    fontSize: scale(fontSize),
    color: isSelected ? '#FFFFFF' : textColor,
    fontWeight: isSelected ? '600' : '400',
    textAlign: 'center',
  });

  // Determine layout style based on columns and style
  const listStyle: ViewStyle =
    columns === 2
      ? { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }
      : { flexDirection: 'column' };

  // Apply pill style modifications
  const isPillStyle = checklistStyle === 'pills';
  const isCardStyle = checklistStyle === 'cards';

  return (
    <View style={containerStyle}>
      <View style={listStyle}>
        {items.map((item) => {
          const isSelected = selectedItems.includes(item.id);
          const itemStyle = getItemStyle(isSelected);

          // Pill style adjustments
          if (isPillStyle) {
            itemStyle.paddingVertical = scale(8);
            itemStyle.paddingHorizontal = scale(16);
            itemStyle.borderRadius = scale(999);
            itemStyle.width = 'auto';
            itemStyle.flex = undefined;
          }

          // Card style adjustments
          if (isCardStyle) {
            itemStyle.paddingVertical = scale(20);
            itemStyle.paddingHorizontal = scale(20);
          }

          return (
            <TouchableOpacity
              key={item.id}
              style={itemStyle}
              onPress={() => handleItemPress(item.id)}
              activeOpacity={0.7}
            >
              <Text style={getTextStyle(isSelected)}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
