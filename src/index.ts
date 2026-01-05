// Sequence React Native SDK
// Beautiful onboarding flows for mobile apps

// Main client
export { Sequence } from './SequenceClient';

// Provider and hooks
export { SequenceProvider, useSequence, useOnboardingScreens, useShouldShowOnboarding } from './SequenceProvider';

// Components
export {
  FlowRenderer,
  FlowProgressBar,
  OnboardingModal,
  ContentBlockRenderer,
} from './components';

// Block components (for custom rendering)
export {
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
} from './components/blocks';

// Types
export type {
  // Core types
  Screen,
  ScreenContent,
  ScreenType,
  ScreenTransition,
  ContentBlock,
  ContentBlockType,
  ButtonAction,
  ButtonPreset,
  BlockStyling,
  BoxShadow,

  // Block content types
  TextBlockContent,
  ImageBlockContent,
  VideoBlockContent,
  LottieBlockContent,
  IconBlockContent,
  ButtonBlockContent,
  SpacerBlockContent,
  DividerBlockContent,
  InputBlockContent,
  ChecklistBlockContent,
  ChecklistItem,
  SliderBlockContent,
  ProgressBlockContent,
  FeatureCardBlockContent,
  ScrollContainerBlockContent,
  CustomBlockContent,
  TextSpan,

  // Config types
  OnboardingConfig,
  FlowProgressIndicator,
  ScreenTransitionConfig,
  SequenceConfig,
  CollectedData,

  // Event types
  EventType,
  TrackingEvent,
} from './types';

// Constants
export { DESIGN_CANVAS, CONTENT_AREA } from './types';

// Utilities
export { scale, getStylingStyles, getFontWeight, getScaleFactor } from './utils/styles';
