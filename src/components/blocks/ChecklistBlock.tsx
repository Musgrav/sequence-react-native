import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { ChecklistBlockContent, BlockStyling, ButtonAction } from '../../types';
import { getStylingStyles, scale, createShadowStyle, hexToRgba } from '../../utils/styles';

// Checkmark icon component for list/cards style
function CheckIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: size * 0.8, color, fontWeight: '700' }}>✓</Text>
    </View>
  );
}

/**
 * AnimatedChecklistItem - Handles scale animation on selection
 * Matches Swift SDK's .scaleEffect and .animation(.easeInOut(duration: 0.2))
 */
interface AnimatedChecklistItemProps {
  isSelected: boolean;
  targetScale: number; // 1.02 for cards, 1.05 for pills
  style: ViewStyle;
  onPress: () => void;
  children: React.ReactNode;
}

function AnimatedChecklistItem({
  isSelected,
  targetScale,
  style,
  onPress,
  children,
}: AnimatedChecklistItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate scale with easeInOut, 200ms - matches Swift SDK exactly
    Animated.timing(scaleAnim, {
      toValue: isSelected ? targetScale : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isSelected, targetScale, scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={style}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

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
  /** Scale factor for proportional sizing in WYSIWYG mode */
  scaleFactor?: number;
  /** Max width for the checklist block */
  maxWidth?: number;
}

export function ChecklistBlock({
  content,
  styling,
  selectedItems = [],
  onSelectionChange,
  onAction,
  scaleFactor = 1,
  maxWidth,
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
    width: maxWidth || '100%',
  };

  // Helper function to scale values with scaleFactor
  const s = (value: number) => value * scaleFactor;

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

  // Helper to get border style - matches web editor exactly
  const getBorderStyle = (isSelected: boolean): { borderWidth?: number; borderColor?: string } => {
    if (isSelected && showBorderWhenSelected) {
      return { borderWidth: 2, borderColor: borderColor || activeColor };
    } else if (borderWhenUnselected && borderWhenUnselected !== 'none') {
      return {
        borderWidth: 2,
        borderColor: borderWhenUnselected === 'transparent' ? 'transparent' : borderWhenUnselected,
      };
    }
    return {};
  };

  // Determine layout style based on columns and style
  const isPillStyle = checklistStyle === 'pills';
  const isCardStyle = checklistStyle === 'cards';
  const isListStyle = checklistStyle === 'list';

  // Base list container style
  const listStyle: ViewStyle =
    columns === 2
      ? { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }
      : isPillStyle
      ? { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }
      : { flexDirection: 'column' };

  // Get item width - matches editor's fixed width approach
  const getItemWidth = (): ViewStyle['width'] => {
    if (isPillStyle) return 'auto';
    if (columns === 2) return '48%';
    if (typeof itemWidth === 'number') return s(itemWidth);
    return '100%';
  };

  // Render pills style - matches Swift SDK exactly
  // Swift: .scaleEffect(isSelected ? 1.05 : 1.0) with .animation(.easeInOut(duration: 0.2))
  if (isPillStyle) {
    return (
      <View style={containerStyle}>
        <View style={[listStyle, { gap: s(itemGap) }]}>
          {items.map((item) => {
            const isSelected = selectedItems.includes(item.id);

            // Pills: solid activeColor when selected, backgroundColor or inactiveColor when not
            const itemBgColor = isSelected ? activeColor : (backgroundColor || inactiveColor);
            // Pills: white text when selected
            const itemTextColor = isSelected ? '#ffffff' : textColor;

            const pillStyle: ViewStyle = {
              backgroundColor: itemBgColor,
              paddingVertical: s(itemPadding * 0.7),
              paddingHorizontal: s(itemPadding * 1.5),
              borderRadius: borderRadius === 9999 ? 9999 : s(borderRadius),
              alignItems: 'center',
              justifyContent: 'center',
              // Shadow glow effect when selected - matches Swift SDK
              ...(isSelected && Platform.OS === 'ios' && {
                shadowColor: activeColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.4,
                shadowRadius: 7,
              }),
              ...(isSelected && Platform.OS === 'android' && {
                elevation: 8,
              }),
            };

            const pillTextStyle: TextStyle = {
              fontSize: s(fontSize),
              color: itemTextColor,
              fontWeight: '500',
              textAlign: 'center',
            };

            return (
              <AnimatedChecklistItem
                key={item.id}
                isSelected={isSelected}
                targetScale={1.05} // Swift SDK: 1.05 for pills
                style={pillStyle}
                onPress={() => handleItemPress(item.id)}
              >
                <Text style={pillTextStyle}>{item.label}</Text>
              </AnimatedChecklistItem>
            );
          })}
        </View>
      </View>
    );
  }

  // Render cards style - matches Swift SDK exactly
  // Swift: .scaleEffect(isSelected && style == .cards ? 1.02 : 1.0) with .animation(.easeInOut(duration: 0.2))
  if (isCardStyle) {
    return (
      <View style={containerStyle}>
        <View style={listStyle}>
          {items.map((item) => {
            const isSelected = selectedItems.includes(item.id);

            // Cards: use activeColor with 15% opacity when selected (tinted background)
            // When not selected, use backgroundColor or default rgba(255,255,255,0.1)
            const cardBgColor = isSelected
              ? hexToRgba(activeColor, 0.15)
              : (backgroundColor || 'rgba(255,255,255,0.1)');

            // Cards: text color stays the same (doesn't turn white)
            const cardTextColor = textColor;

            const cardStyle: ViewStyle = {
              backgroundColor: cardBgColor,
              padding: s(itemPadding),
              borderRadius: s(borderRadius),
              marginBottom: s(itemGap),
              width: getItemWidth(),
              position: 'relative',
              // Border
              ...getBorderStyle(isSelected),
              // Shadow - matches Swift SDK shadow when selected
              ...(isSelected && Platform.OS === 'ios' && {
                shadowColor: activeColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.4,
                shadowRadius: 7,
              }),
              ...(isSelected && Platform.OS === 'android' && {
                elevation: 4,
              }),
            };

            const cardTextStyle: TextStyle = {
              fontSize: s(fontSize),
              color: cardTextColor,
              fontWeight: '500',
              textAlign: 'left',
            };

            return (
              <AnimatedChecklistItem
                key={item.id}
                isSelected={isSelected}
                targetScale={1.02} // Swift SDK: 1.02 for cards
                style={cardStyle}
                onPress={() => handleItemPress(item.id)}
              >
                {/* Check icon in top right when selected */}
                {isSelected && (
                  <View style={[styles.checkIconContainer, { top: s(8), right: s(8) }]}>
                    <CheckIcon color={activeColor} size={s(20)} />
                  </View>
                )}
                <Text style={cardTextStyle}>{item.label}</Text>
              </AnimatedChecklistItem>
            );
          })}
        </View>
      </View>
    );
  }

  // Render list style (default) - matches Swift SDK exactly
  // Swift: .scaleEffect(isSelected ? 1.02 : 1.0) with .animation(.easeInOut(duration: 0.2))
  return (
    <View style={containerStyle}>
      <View style={listStyle}>
        {items.map((item) => {
          const isSelected = selectedItems.includes(item.id);

          // List: use activeColor with 20% opacity when selected (slightly more prominent than cards)
          // When not selected, use backgroundColor or default rgba(255,255,255,0.1)
          const listBgColor = isSelected
            ? hexToRgba(activeColor, 0.2)
            : (backgroundColor || 'rgba(255,255,255,0.1)');

          // List: text color stays the same (doesn't turn white)
          const listTextColor = textColor;

          const listItemStyle: ViewStyle = {
            backgroundColor: listBgColor,
            padding: s(itemPadding),
            borderRadius: s(borderRadius),
            marginBottom: s(itemGap),
            width: getItemWidth(),
            position: 'relative',
            // Border
            ...getBorderStyle(isSelected),
          };

          const listTextStyle: TextStyle = {
            fontSize: s(fontSize),
            color: listTextColor,
            fontWeight: '400',
            textAlign: 'left',
          };

          return (
            <AnimatedChecklistItem
              key={item.id}
              isSelected={isSelected}
              targetScale={1.02} // Swift SDK: 1.02 for list style
              style={listItemStyle}
              onPress={() => handleItemPress(item.id)}
            >
              {/* Check icon in top right when selected */}
              {isSelected && (
                <View style={[styles.checkIconContainer, { top: s(8), right: s(8) }]}>
                  <CheckIcon color={activeColor} size={s(20)} />
                </View>
              )}
              <Text style={listTextStyle}>{item.label}</Text>
            </AnimatedChecklistItem>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  checkIconContainer: {
    position: 'absolute',
  },
});
