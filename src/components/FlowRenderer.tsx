import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
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
import { scale, getStylingStyles, parseGradient } from '../utils/styles';
import { ContentBlockRenderer } from './ContentBlockRenderer';
import { FlowProgressBar } from './FlowProgressBar';
import { Sequence } from '../SequenceClient';

// Optional linear gradient support - try react-native-linear-gradient first, then expo-linear-gradient
let LinearGradient: React.ComponentType<{
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: ViewStyle;
}> | null = null;
try {
  LinearGradient = require('react-native-linear-gradient').default;
} catch {
  try {
    LinearGradient = require('expo-linear-gradient').LinearGradient;
  } catch {
    // No gradient support available
  }
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  // Animate screen transition
  const animateTransition = useCallback(
    (transition: ScreenTransition, isForward: boolean, callback: () => void) => {
      // Reset animation values
      slideAnim.setValue(isForward ? SCREEN_WIDTH : -SCREEN_WIDTH);
      fadeAnim.setValue(0);

      const duration = 300;

      switch (transition) {
        case 'none':
          callback();
          slideAnim.setValue(0);
          fadeAnim.setValue(1);
          break;

        case 'fade':
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }).start(callback);
          slideAnim.setValue(0);
          break;

        case 'slide-left':
        case 'slide-right':
          const slideValue = transition === 'slide-left'
            ? (isForward ? SCREEN_WIDTH : -SCREEN_WIDTH)
            : (isForward ? -SCREEN_WIDTH : SCREEN_WIDTH);
          slideAnim.setValue(slideValue);
          fadeAnim.setValue(1);
          Animated.timing(slideAnim, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }).start(callback);
          break;

        case 'slide-up':
        case 'slide-down':
          slideAnim.setValue(0);
          fadeAnim.setValue(1);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }).start(callback);
          break;

        case 'scale':
          slideAnim.setValue(0);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }).start(callback);
          break;

        default:
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }).start(callback);
          slideAnim.setValue(0);
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

  // Render screen content
  const renderScreenContent = () => {
    if (!currentScreen) return null;

    const { content, type } = currentScreen;

    // Native screen - delegate to callback
    if (type === 'native' && onNativeScreen) {
      return onNativeScreen(currentScreen);
    }

    // Block-based content
    if (content.useBlocks && content.blocks) {
      const sortedBlocks = [...content.blocks].sort((a, b) => a.order - b.order);
      const pinnedBlocks = sortedBlocks.filter((b) => b.pinToBottom);
      const flowBlocks = sortedBlocks.filter((b) => !b.pinToBottom);

      return (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: pinnedBlocks.length > 0 ? scale(120) : scale(40) },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {flowBlocks.map((block) => (
              <ContentBlockRenderer
                key={block.id}
                block={block}
                collectedData={collectedData}
                onDataChange={handleDataChange}
                onAction={handleAction}
                currentScreenIndex={currentIndex}
                totalScreens={screens.length}
                validationErrors={validationErrors}
                renderCustomBlock={renderCustomBlock}
              />
            ))}
          </ScrollView>

          {/* Pinned blocks at bottom */}
          {pinnedBlocks.length > 0 && (
            <View style={[styles.pinnedContainer, { paddingBottom: insets.bottom + scale(20) }]}>
              {pinnedBlocks.map((block) => (
                <ContentBlockRenderer
                  key={block.id}
                  block={block}
                  collectedData={collectedData}
                  onDataChange={handleDataChange}
                  onAction={handleAction}
                  currentScreenIndex={currentIndex}
                  totalScreens={screens.length}
                  validationErrors={validationErrors}
                  renderCustomBlock={renderCustomBlock}
                />
              ))}
            </View>
          )}
        </>
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

    if (content.backgroundGradient && LinearGradient) {
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  legacyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
