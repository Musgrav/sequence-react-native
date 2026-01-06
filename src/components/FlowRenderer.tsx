import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
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
import { scale, parseGradient } from '../utils/styles';
import { ContentBlockRenderer } from './ContentBlockRenderer';
import { FlowProgressBar } from './FlowProgressBar';
import { Sequence } from '../SequenceClient';
import { LinearGradient } from './LinearGradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Canvas constants for WYSIWYG rendering
// These MUST match web/src/lib/device-constants.ts exactly
const EDITOR_CANVAS_WIDTH = DESIGN_CANVAS.width; // 393
const EDITOR_CANVAS_HEIGHT = DESIGN_CANVAS.height; // 852

// OLD canvas dimensions (used by flows created before the DESIGN_CANVAS update)
// Used for backward compatibility migration
const OLD_CANVAS_WIDTH = 320;
const OLD_CANVAS_HEIGHT = 693;

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

  // Animation values for screen transitions
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideYAnim = useRef(new Animated.Value(0)).current;

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

      // Reset all animation values first
      const resetAnimations = () => {
        slideAnim.setValue(0);
        slideYAnim.setValue(0);
        fadeAnim.setValue(1);
        scaleAnim.setValue(1);
      };

      switch (transition) {
        case 'none':
          callback();
          resetAnimations();
          break;

        case 'fade':
          slideAnim.setValue(0);
          slideYAnim.setValue(0);
          scaleAnim.setValue(1);
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
          slideYAnim.setValue(0);
          fadeAnim.setValue(1);
          scaleAnim.setValue(1);
          Animated.timing(slideAnim, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }).start(callback);
          break;

        case 'slide-right':
          // Slide in from left
          slideAnim.setValue(-SCREEN_WIDTH);
          slideYAnim.setValue(0);
          fadeAnim.setValue(1);
          scaleAnim.setValue(1);
          Animated.timing(slideAnim, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }).start(callback);
          break;

        case 'slide-up':
          // Slide in from bottom
          slideAnim.setValue(0);
          slideYAnim.setValue(SCREEN_HEIGHT);
          fadeAnim.setValue(1);
          scaleAnim.setValue(1);
          Animated.timing(slideYAnim, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }).start(callback);
          break;

        case 'slide-down':
          // Slide in from top
          slideAnim.setValue(0);
          slideYAnim.setValue(-SCREEN_HEIGHT);
          fadeAnim.setValue(1);
          scaleAnim.setValue(1);
          Animated.timing(slideYAnim, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }).start(callback);
          break;

        case 'fade-slide-left':
          // Slide from right with fade
          slideAnim.setValue(isForward ? SCREEN_WIDTH : -SCREEN_WIDTH);
          slideYAnim.setValue(0);
          fadeAnim.setValue(0);
          scaleAnim.setValue(1);
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
          break;

        case 'fade-slide-right':
          // Slide from left with fade
          slideAnim.setValue(isForward ? -SCREEN_WIDTH : SCREEN_WIDTH);
          slideYAnim.setValue(0);
          fadeAnim.setValue(0);
          scaleAnim.setValue(1);
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
          break;

        case 'scale':
          // Scale up from center
          slideAnim.setValue(0);
          slideYAnim.setValue(0);
          fadeAnim.setValue(0);
          scaleAnim.setValue(0.8);
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration,
              useNativeDriver: true,
            }),
          ]).start(callback);
          break;

        default:
          // Default: slide + fade (matching Swift SDK asymmetric transition)
          // Forward: slide in from right + fade in
          // Backward: slide in from left + fade in
          slideAnim.setValue(isForward ? SCREEN_WIDTH : -SCREEN_WIDTH);
          slideYAnim.setValue(0);
          fadeAnim.setValue(0);
          scaleAnim.setValue(1);
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
      }
    },
    [slideAnim, slideYAnim, fadeAnim, scaleAnim]
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
      setCollectedData((prev: CollectedData) => ({
        ...prev,
        [fieldName]: value,
      }));

      // Clear validation error for this field
      setValidationErrors((prev: Set<string>) => {
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
  // Matches web FlowRenderer.tsx exactly:
  // - uniformScale (width-based) for horizontal positioning and most sizing
  // - yScale for vertical positioning to fill the screen
  const uniformScale = SCREEN_WIDTH / EDITOR_CANVAS_WIDTH;
  const yScale = SCREEN_HEIGHT / EDITOR_CANVAS_HEIGHT;

  // Max widths for different block types (matching Swift SDK and web exactly)
  // Web FlowRenderer: textMaxWidth = 280px, fullWidthMaxWidth = canvas - 48px
  const textMaxWidth = 280 * uniformScale;
  const fullWidthMaxWidth = (EDITOR_CANVAS_WIDTH - 48) * uniformScale; // 345px scaled

  // Check if all blocks need position migration (from old 320x693 to new 393x852)
  const needsMigration = useMemo(() => {
    if (!currentScreen?.content?.blocks) return false;
    const blocksWithPositions = currentScreen.content.blocks.filter(b => b.position);
    return blocksWithPositions.length > 0 &&
      blocksWithPositions.every(b =>
        b.position &&
        b.position.x <= OLD_CANVAS_WIDTH &&
        b.position.y <= OLD_CANVAS_HEIGHT
      );
  }, [currentScreen]);

  // Migrate old position to new coordinates if needed
  const migratePosition = useCallback((pos: { x: number; y: number }): { x: number; y: number } => {
    if (!needsMigration) return pos;
    const scaleXFactor = EDITOR_CANVAS_WIDTH / OLD_CANVAS_WIDTH;
    const scaleYFactor = EDITOR_CANVAS_HEIGHT / OLD_CANVAS_HEIGHT;
    return {
      x: Math.round(pos.x * scaleXFactor),
      y: Math.round(pos.y * scaleYFactor),
    };
  }, [needsMigration]);

  // Determine if a block should use full width
  // IMPORTANT: This must match Swift SDK's OnboardingView.swift and web FlowRenderer exactly
  // Full-width blocks: checklist, input, slider, progress, divider, spacer, button (with fullWidth=true)
  // Text-width blocks: text, icon, image
  const getBlockMaxWidth = useCallback((block: ContentBlock): number => {
    switch (block.type) {
      case 'checklist':
      case 'input':
      case 'progress':
      case 'divider':
      case 'slider':
      case 'spacer':
        return fullWidthMaxWidth;
      case 'button':
        // Buttons with fullWidth=true (default) should use full width
        const buttonContent = block.content as { fullWidth?: boolean };
        return buttonContent.fullWidth !== false ? fullWidthMaxWidth : textMaxWidth;
      // Text, icon, image use text width
      default:
        // Check for explicit width in styling
        if (block.styling?.width && typeof block.styling.width === 'number') {
          return block.styling.width * uniformScale;
        }
        return textMaxWidth;
    }
  }, [fullWidthMaxWidth, textMaxWidth, uniformScale]);

  // Render screen content using WYSIWYG canvas-based positioning
  const renderScreenContent = () => {
    if (!currentScreen) return null;

    const { content, type } = currentScreen;

    // Native screen - delegate to callback
    if (type === 'native' && onNativeScreen) {
      return onNativeScreen(currentScreen);
    }

    // Block-based content with WYSIWYG absolute positioning
    if (content.useBlocks !== false && content.blocks) {
      const sortedBlocks = [...content.blocks]
        .filter((b) => b.visible !== false)
        .sort((a, b) => a.order - b.order);

      // Separate pinned blocks from regular blocks
      const pinnedBlocks = sortedBlocks.filter(b => b.pinToBottom);
      const regularBlocks = sortedBlocks.filter(b => !b.pinToBottom);

      // Calculate default positions for blocks without stored positions
      const centerX = 24; // 24px padding from left edge in design space

      return (
        <View style={styles.canvasContainer}>
          {regularBlocks.map((block, index) => {
            // Use stored position or compute default
            let pos = block.position || {
              x: block.type === 'icon' ? (EDITOR_CANVAS_WIDTH / 2 - 40) : centerX,
              y: 150 + index * 70, // Simple vertical stacking for blocks without positions
            };

            // Migrate position if needed (old coordinate system)
            pos = migratePosition(pos);

            // Scale the position to device coordinates
            // X uses uniform scale (width-based) for consistent horizontal positioning
            // Y uses yScale to fill the screen height properly
            const scaledX = pos.x * uniformScale;
            const scaledY = pos.y * yScale;
            const maxWidth = getBlockMaxWidth(block);

            // Get explicit dimensions from styling if set
            const blockWidth = block.styling?.width && typeof block.styling.width === 'number'
              ? block.styling.width * uniformScale
              : undefined;
            const blockHeight = block.styling?.height && typeof block.styling.height === 'number'
              ? block.styling.height * uniformScale
              : undefined;

            // Determine if block needs explicit width
            // Icons should NOT have explicit width to size naturally
            const needsExplicitWidth = block.type !== 'icon';

            return (
              <View
                key={block.id}
                style={{
                  position: 'absolute',
                  left: scaledX,
                  top: scaledY,
                  // Apply explicit dimensions if set, otherwise use maxWidth for non-icons
                  ...(blockWidth !== undefined && { width: blockWidth }),
                  ...(blockHeight !== undefined && { height: blockHeight }),
                  ...(needsExplicitWidth && blockWidth === undefined && { width: maxWidth }),
                  zIndex: 1,
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

          {/* Pinned blocks - rendered at the bottom */}
          {pinnedBlocks.length > 0 && (
            <View style={styles.pinnedContainer}>
              {pinnedBlocks.map((block, index) => {
                let pos = block.position || {
                  x: centerX,
                  y: 0, // Will be positioned at bottom
                };
                pos = migratePosition(pos);

                const scaledX = pos.x * uniformScale;
                const maxWidth = getBlockMaxWidth(block);

                return (
                  <View
                    key={block.id}
                    style={{
                      position: 'absolute',
                      left: scaledX,
                      bottom: (pinnedBlocks.length - 1 - index) * 70 * uniformScale + insets.bottom + 20,
                      width: maxWidth,
                      zIndex: 10,
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
          )}
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
      <StatusBar barStyle="light-content" />

      {renderBackground()}

      {/* Screen content with animations - fills entire screen for WYSIWYG */}
      <Animated.View
        style={[
          styles.screenContainer,
          {
            transform: [
              { translateX: slideAnim },
              { translateY: slideYAnim },
              { scale: scaleAnim },
            ],
            opacity: fadeAnim,
          },
        ]}
      >
        {renderScreenContent()}
      </Animated.View>

      {/* Progress indicator at top - overlaid on top of content */}
      {progressIndicator?.enabled && progressIndicator.position === 'top' && (
        <View style={styles.progressOverlayTop}>
          <FlowProgressBar
            progressIndicator={progressIndicator}
            currentIndex={currentIndex}
            totalScreens={screens.length}
            style={{ paddingTop: insets.top + scale(10), paddingHorizontal: scale(24) }}
          />
        </View>
      )}

      {/* Progress indicator at bottom - overlaid on top of content */}
      {progressIndicator?.enabled && progressIndicator.position === 'bottom' && (
        <View style={styles.progressOverlayBottom}>
          <FlowProgressBar
            progressIndicator={progressIndicator}
            currentIndex={currentIndex}
            totalScreens={screens.length}
            style={{ paddingBottom: insets.bottom + scale(10), paddingHorizontal: scale(24) }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Match web default
    // Ensure content is not clipped at container level
    overflow: 'visible',
  },
  screenContainer: {
    // Fill entire screen for WYSIWYG positioning
    // Swift SDK uses .frame(maxWidth: .infinity, maxHeight: .infinity).ignoresSafeArea(.all)
    ...StyleSheet.absoluteFillObject,
    // Ensure content is not clipped
    overflow: 'visible',
  },
  canvasContainer: {
    // Canvas fills entire screen - blocks are positioned absolutely within
    // Swift SDK: .frame(width: geometry.size.width, height: geometry.size.height, alignment: .topLeading)
    // IMPORTANT: Use absolute fill to ensure blocks can be positioned anywhere on screen
    ...StyleSheet.absoluteFillObject,
    // Ensure content is not clipped
    overflow: 'visible',
  },
  pinnedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  progressOverlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  progressOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
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
