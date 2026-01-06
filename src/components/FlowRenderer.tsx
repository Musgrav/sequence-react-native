import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import type { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  Screen,
  ContentBlock,
  ButtonAction,
  FlowProgressIndicator,
  ScreenTransitionConfig,
  ScreenTransition,
  CollectedData,
} from '../types';
import { DESIGN_CANVAS } from '../types';
import { scale, parseGradient, scaleX, scaleY } from '../utils/styles';
import { ContentBlockRenderer } from './ContentBlockRenderer';
import { FlowProgressBar } from './FlowProgressBar';
import { Sequence } from '../SequenceClient';
import { LinearGradient } from './LinearGradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Canvas constants for WYSIWYG rendering
const EDITOR_CANVAS_WIDTH = DESIGN_CANVAS.width; // 393
const EDITOR_CANVAS_HEIGHT = DESIGN_CANVAS.height; // 852

interface FlowRendererProps {
  screens: Screen[];
  progressIndicator?: FlowProgressIndicator;
  transitions?: ScreenTransitionConfig[];
  initialScreenIndex?: number;
  onComplete?: (collectedData: CollectedData) => void;
  onNativeScreen?: (screen: Screen) => React.ReactNode;
  onCustomAction?: (identifier: string) => void;
  renderCustomBlock?: (identifier: string, props?: Record<string, unknown>) => React.ReactNode;
  experimentInfo?: { id: string; variantId: string; variantName: string } | null;
}

export function FlowRenderer({
  screens,
  progressIndicator,
  transitions,
  initialScreenIndex = 0,
  onComplete,
  onNativeScreen,
  onCustomAction,
  renderCustomBlock,
  experimentInfo,
}: FlowRendererProps) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialScreenIndex);
  const [collectedData, setCollectedData] = useState<CollectedData>({});
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  // Animation values for screen transitions
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentScreen = screens[currentIndex];

  // Track onboarding started
  useEffect(() => {
    Sequence.track('onboarding_started', undefined, {
      experiment_id: experimentInfo?.id,
      variant_id: experimentInfo?.variantId,
    });
  }, [experimentInfo]);

  // Track screen views
  useEffect(() => {
    if (currentScreen) {
      Sequence.track('screen_viewed', currentScreen.id);
    }
  }, [currentScreen?.id]);

  // Get the transition type for navigating from current screen
  const getTransition = useCallback(
    (fromIndex: number, toIndex: number): ScreenTransition => {
      const fromScreen = screens[fromIndex];
      const toScreen = screens[toIndex];

      // Check for specific transition config
      if (transitions) {
        const config = transitions.find(
          (t) => t.fromScreenId === fromScreen?.id && t.toScreenId === toScreen?.id
        );
        if (config) return config.transition;
      }

      // Use screen's default transition
      return fromScreen?.transition || 'fade';
    },
    [screens, transitions]
  );

  // Animate screen transition - matches Swift SDK exactly
  // Swift uses: .transition(.asymmetric(
  //   insertion: .move(edge: .trailing).combined(with: .opacity),
  //   removal: .move(edge: .leading).combined(with: .opacity)
  // ))
  // Duration: 0.3s with easeInOut
  const animateTransition = useCallback(
    (transition: ScreenTransition, isForward: boolean, callback: () => void) => {
      const duration = 300; // 0.3s - matches Swift SDK

      // Default transition: slide + fade (matching Swift SDK asymmetric transition)
      // Forward: slide in from right + fade in
      // Backward: slide in from left + fade in
      const defaultTransition = () => {
        // Set initial position: new screen comes from right (forward) or left (backward)
        slideAnim.setValue(isForward ? SCREEN_WIDTH : -SCREEN_WIDTH);
        fadeAnim.setValue(0);

        // Animate both slide and fade together
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
        ]).start(callback);
      };

      switch (transition) {
        case 'none':
          callback();
          slideAnim.setValue(0);
          fadeAnim.setValue(1);
          break;

        case 'fade':
          slideAnim.setValue(0);
          fadeAnim.setValue(0);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }).start(callback);
          break;

        case 'slide-left':
          // Slide in from right
          slideAnim.setValue(SCREEN_WIDTH);
          fadeAnim.setValue(1);
          Animated.timing(slideAnim, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }).start(callback);
          break;

        case 'slide-right':
          // Slide in from left
          slideAnim.setValue(-SCREEN_WIDTH);
          fadeAnim.setValue(1);
          Animated.timing(slideAnim, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }).start(callback);
          break;

        case 'slide-up':
        case 'slide-down':
          // For now, use fade for vertical transitions
          slideAnim.setValue(0);
          fadeAnim.setValue(0);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }).start(callback);
          break;

        case 'scale':
          slideAnim.setValue(0);
          fadeAnim.setValue(0);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }).start(callback);
          break;

        default:
          // Default: slide + fade (matching Swift SDK)
          defaultTransition();
      }
    },
    [slideAnim, fadeAnim]
  );

  // Validate required fields on current screen
  const validateCurrentScreen = useCallback((): boolean => {
    if (!currentScreen?.content?.blocks) return true;

    const errors: string[] = [];

    for (const block of currentScreen.content.blocks) {
      if (block.type === 'input') {
        const inputContent = block.content as { required?: boolean; fieldName?: string };
        if (inputContent.required && inputContent.fieldName) {
          const value = collectedData[inputContent.fieldName];
          const isEmpty =
            value === undefined ||
            value === null ||
            (typeof value === 'string' && value.trim() === '') ||
            (Array.isArray(value) && value.length === 0);
          if (isEmpty) {
            errors.push(inputContent.fieldName);
          }
        }
      }

      if (block.type === 'checklist') {
        const checklistContent = block.content as { minSelections?: number; fieldName?: string };
        if (checklistContent.minSelections && checklistContent.minSelections > 0 && checklistContent.fieldName) {
          const value = collectedData[checklistContent.fieldName];
          const selectionCount = Array.isArray(value) ? value.length : value ? 1 : 0;
          if (selectionCount < checklistContent.minSelections) {
            errors.push(checklistContent.fieldName);
          }
        }
      }
    }

    if (errors.length > 0) {
      setValidationErrors(new Set(errors));
      return false;
    }

    setValidationErrors(new Set());
    return true;
  }, [currentScreen, collectedData]);

  // Navigate to a screen index
  const navigateTo = useCallback(
    (targetIndex: number) => {
      if (targetIndex < 0 || targetIndex >= screens.length) return;

      const isForward = targetIndex > currentIndex;
      setDirection(isForward ? 'forward' : 'backward');

      const transition = getTransition(currentIndex, targetIndex);

      // Track screen completion
      Sequence.track('screen_completed', currentScreen?.id);

      animateTransition(transition, isForward, () => {
        setCurrentIndex(targetIndex);
      });
    },
    [currentIndex, screens.length, getTransition, animateTransition, currentScreen]
  );

  // Handle button actions
  const handleAction = useCallback(
    (action: ButtonAction) => {
      // Validate before navigation
      if (action.type === 'next' || action.type === 'complete' || action.type === 'screen') {
        if (!validateCurrentScreen()) {
          return;
        }
      }

      switch (action.type) {
        case 'next':
          if (currentIndex < screens.length - 1) {
            navigateTo(currentIndex + 1);
          } else {
            // Last screen - complete
            Sequence.trackOnboardingCompleted(collectedData);
            onComplete?.(collectedData);
          }
          break;

        case 'previous':
          if (currentIndex > 0) {
            navigateTo(currentIndex - 1);
          }
          break;

        case 'screen':
          const targetIndex = screens.findIndex((s) => s.id === action.screenId);
          if (targetIndex !== -1) {
            navigateTo(targetIndex);
          }
          break;

        case 'complete':
          Sequence.trackOnboardingCompleted(collectedData);
          onComplete?.(collectedData);
          break;

        case 'custom':
          onCustomAction?.(action.identifier);
          break;
      }
    },
    [currentIndex, screens, navigateTo, validateCurrentScreen, collectedData, onComplete, onCustomAction]
  );

  // Handle data changes from inputs/checklists/sliders
  const handleDataChange = useCallback(
    (fieldName: string, value: string | string[] | number) => {
      setCollectedData((prev) => ({
        ...prev,
        [fieldName]: value,
      }));

      // Clear validation error for this field
      setValidationErrors((prev) => {
        const next = new Set(prev);
        next.delete(fieldName);
        return next;
      });
    },
    []
  );

  // Get background styles for current screen
  const getBackgroundStyle = useMemo((): ViewStyle => {
    const content = currentScreen?.content;
    if (!content) return {};

    const style: ViewStyle = {};

    if (content.backgroundColor) {
      style.backgroundColor = content.backgroundColor;
    }

    return style;
  }, [currentScreen]);

  // Calculate scale factors for WYSIWYG rendering
  const uniformScale = SCREEN_WIDTH / EDITOR_CANVAS_WIDTH;
  const yScale = SCREEN_HEIGHT / EDITOR_CANVAS_HEIGHT;

  // Max widths for different block types (matching Swift SDK)
  const textMaxWidth = 280 * uniformScale;
  const fullWidthMaxWidth = (EDITOR_CANVAS_WIDTH - 48) * uniformScale; // 345px scaled

  // Determine if a block should use full width
  // IMPORTANT: This must match Swift SDK's OnboardingView.swift exactly
  // Full-width blocks: checklist, input, slider, progress, divider, button (with fullWidth=true)
  // Text-width blocks: text, icon, image
  const getBlockMaxWidth = (block: ContentBlock): number => {
    switch (block.type) {
      case 'checklist':
      case 'input':
      case 'progress':
      case 'divider':
      case 'slider':
        return fullWidthMaxWidth;
      case 'button':
        // Buttons with fullWidth=true (default) should use full width
        const buttonContent = block.content as { fullWidth?: boolean };
        return buttonContent.fullWidth !== false ? fullWidthMaxWidth : textMaxWidth;
      // Text, icon, image use text width
      default:
        return textMaxWidth;
    }
  };

  // Render screen content using WYSIWYG canvas-based positioning
  const renderScreenContent = () => {
    if (!currentScreen) return null;

    const { content, type } = currentScreen;

    // Native screen - delegate to callback
    if (type === 'native' && onNativeScreen) {
      return onNativeScreen(currentScreen);
    }

    // Block-based content with WYSIWYG absolute positioning
    if (content.useBlocks && content.blocks) {
      const sortedBlocks = [...content.blocks]
        .filter((b) => b.visible !== false)
        .sort((a, b) => a.order - b.order);

      // Calculate default positions for blocks without stored positions
      const centerX = 24; // 24px padding from left edge in design space

      return (
        <View style={styles.canvasContainer}>
          {sortedBlocks.map((block, index) => {
            // Use stored position or compute default
            const pos = block.position || {
              x: block.type === 'icon' ? (EDITOR_CANVAS_WIDTH / 2 - 40) : centerX,
              y: 150 + index * 70, // Simple vertical stacking for blocks without positions
            };

            // Scale the position to device coordinates
            const scaledX = pos.x * uniformScale;
            const scaledY = pos.y * yScale;
            const maxWidth = getBlockMaxWidth(block);

            // For full-width blocks (checklist, input, button, etc.), set explicit width
            // For text-width blocks, let them size to content within maxWidth
            const buttonContent = block.content as { fullWidth?: boolean };
            const isFullWidthBlock = ['checklist', 'input', 'progress', 'divider', 'slider'].includes(block.type) ||
              (block.type === 'button' && buttonContent.fullWidth !== false);

            return (
              <View
                key={block.id}
                style={{
                  position: 'absolute',
                  left: scaledX,
                  top: scaledY,
                  // Full-width blocks get explicit width, text-width blocks get maxWidth constraint
                  ...(isFullWidthBlock
                    ? { width: maxWidth }
                    : { maxWidth: maxWidth }),
                }}
              >
                <ContentBlockRenderer
                  block={block}
                  collectedData={collectedData}
                  onDataChange={handleDataChange}
                  onAction={handleAction}
                  currentScreenIndex={currentIndex}
                  totalScreens={screens.length}
                  validationErrors={validationErrors}
                  renderCustomBlock={renderCustomBlock}
                  scaleFactor={uniformScale}
                  maxWidth={maxWidth}
                />
              </View>
            );
          })}
        </View>
      );
    }

    // Legacy content (non-block-based) - render basic layout
    return (
      <View style={styles.legacyContent}>
        {/* Legacy content would be rendered here */}
      </View>
    );
  };

  // Render background (gradient or image)
  const renderBackground = () => {
    const content = currentScreen?.content;
    if (!content) return null;

    if (content.backgroundGradient) {
      const { colors, start, end } = parseGradient(content.backgroundGradient);
      return (
        <LinearGradient
          colors={colors}
          start={start}
          end={end}
          style={StyleSheet.absoluteFill as ViewStyle}
        />
      );
    }

    if (content.backgroundImage) {
      // Background image would be rendered here
      return null;
    }

    return null;
  };

  return (
    <View style={[styles.container, getBackgroundStyle]}>
      <StatusBar barStyle="dark-content" />

      {renderBackground()}

      {/* Progress indicator at top */}
      {progressIndicator?.enabled && progressIndicator.position === 'top' && (
        <FlowProgressBar
          progressIndicator={progressIndicator}
          currentIndex={currentIndex}
          totalScreens={screens.length}
          style={{ paddingTop: insets.top + scale(10), paddingHorizontal: scale(24) }}
        />
      )}

      {/* Screen content with animations */}
      <Animated.View
        style={[
          styles.screenContainer,
          {
            paddingTop: progressIndicator?.enabled && progressIndicator.position === 'top'
              ? scale(20)
              : insets.top + scale(20),
            transform: [{ translateX: slideAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        {renderScreenContent()}
      </Animated.View>

      {/* Progress indicator at bottom */}
      {progressIndicator?.enabled && progressIndicator.position === 'bottom' && (
        <FlowProgressBar
          progressIndicator={progressIndicator}
          currentIndex={currentIndex}
          totalScreens={screens.length}
          style={{ paddingBottom: insets.bottom + scale(10), paddingHorizontal: scale(24) }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenContainer: {
    flex: 1,
  },
  canvasContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  pinnedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    // backgroundColor is set dynamically to match screen background
  },
  pinnedFadeGradient: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    height: 60,
  },
  legacyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
