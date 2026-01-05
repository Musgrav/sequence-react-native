// ============================================
// Sequence React Native SDK Types
// ============================================
// Types for the React Native SDK, matching the web/Swift SDK

// Screen transition animation types
export type ScreenTransition =
  | 'none'
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'fade-slide-left'
  | 'fade-slide-right'
  | 'scale';

// Screen types
export type ScreenType =
  | 'welcome'
  | 'feature'
  | 'carousel'
  | 'permission'
  | 'celebration'
  | 'native'
  | 'filler';

// Button action types
export type ButtonAction =
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'screen'; screenId: string }
  | { type: 'complete' }
  | { type: 'custom'; identifier: string };

// Content block types
export type ContentBlockType =
  | 'text'
  | 'image'
  | 'video'
  | 'lottie'
  | 'icon'
  | 'button'
  | 'spacer'
  | 'divider'
  | 'input'
  | 'checklist'
  | 'progress'
  | 'slider'
  | 'feature-card'
  | 'scroll-container'
  | 'custom';

// Shadow configuration
export interface BoxShadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
  inset?: boolean;
}

// Universal styling properties
export interface BlockStyling {
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  width?: number | 'auto' | 'full';
  height?: number | 'auto';
  minWidth?: number;
  maxWidth?: number;
  borderRadius?: number;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  backgroundColor?: string;
  opacity?: number;
  shadow?: BoxShadow;
  rotation?: number;
}

// Rich text span for inline formatting
export interface TextSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  fontFamily?: string;
  fontSize?: number;
}

// Block content types
export interface TextBlockContent {
  text: string;
  variant: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
  color?: string;
  align?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  richText?: TextSpan[];
}

export interface ImageBlockContent {
  src: string;
  alt?: string;
  width?: number | 'full';
  height?: number | 'auto';
  borderRadius?: number;
  objectFit?: 'cover' | 'contain' | 'fill';
}

export interface VideoBlockContent {
  src: string;
  poster?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  width?: number | 'full';
  borderRadius?: number;
}

export interface LottieBlockContent {
  src: string;
  autoplay?: boolean;
  loop?: boolean;
  width?: number;
  height?: number;
}

export interface IconBlockContent {
  icon: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  color?: string;
}

export type ButtonPreset =
  | 'sign-in-apple'
  | 'sign-in-google'
  | 'sign-in-email'
  | 'continue'
  | 'skip'
  | 'enable-notifications'
  | 'enable-location'
  | 'get-started';

export interface ButtonBlockContent {
  text: string;
  action: ButtonAction;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  backgroundGradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    angle?: number;
  };
  preset?: ButtonPreset;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  paddingHorizontal?: number;
  paddingVertical?: number;
}

export interface SpacerBlockContent {
  height: number;
}

export interface DividerBlockContent {
  color?: string;
  thickness?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  width?: number | 'full';
}

export interface InputBlockContent {
  placeholder?: string;
  placeholderColor?: string;
  label?: string;
  fieldLabel?: string;
  inputType?: 'text' | 'email' | 'number' | 'phone' | 'password';
  required?: boolean;
  fieldName: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  value?: string | number;
  checked?: boolean;
}

export interface ChecklistBlockContent {
  items: ChecklistItem[];
  allowMultiple?: boolean;
  minSelections?: number;
  maxSelections?: number;
  action?: ButtonAction;
  autoAdvance?: boolean;
  style?: 'list' | 'pills' | 'cards';
  columns?: 1 | 2;
  activeColor?: string;
  inactiveColor?: string;
  fieldName?: string;
  fieldLabel?: string;
  fontSize?: number;
  itemPadding?: number;
  itemGap?: number;
  borderRadius?: number;
  itemWidth?: number | 'full';
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  showBorderWhenSelected?: boolean;
  borderWhenUnselected?: 'none' | 'transparent' | string;
  shadow?: boolean;
  hapticEnabled?: boolean;
  hapticIntensity?: 'light' | 'medium' | 'heavy';
}

export interface SliderBlockContent {
  fieldName: string;
  fieldLabel?: string;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  showValue?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  showMinMax?: boolean;
  showTicks?: boolean;
  tickCount?: number;
  fillColor?: string;
  trackColor?: string;
  thumbColor?: string;
  thumbSize?: number;
  trackHeight?: number;
  width?: number | 'full';
  valueColor?: string;
  valueFontSize?: number;
  valueFontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  suffixFontSize?: number;
  labelColor?: string;
}

export interface ProgressBlockContent {
  variant: 'bar' | 'dots' | 'steps' | 'ring';
  fillColor?: string;
  trackColor?: string;
  height?: number;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  dotSize?: number;
  labels?: string[];
  showLabels?: boolean;
  startScreen?: number;
  endScreen?: number;
  animated?: boolean;
}

export interface FeatureCardBlockContent {
  headline?: string;
  headlineRichText?: TextSpan[];
  body?: string;
  bodyRichText?: TextSpan[];
  headlineColor?: string;
  bodyColor?: string;
  headlineFontSize?: number;
  bodyFontSize?: number;
  headlineFontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  bodyFontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  fontFamily?: string;
  lineHeight?: number;
  backgroundColor?: string;
  padding?: number;
  borderWidth?: number;
  borderColor?: string;
  glowingBorder?: boolean;
  glowColor?: string;
  glowIntensity?: number;
  align?: 'left' | 'center' | 'right';
  headlineBodyGap?: number;
}

export interface CustomBlockContent {
  identifier: string;
  props?: Record<string, unknown>;
}

// Forward declaration for scroll container
export interface ScrollContainerBlockContent {
  children: ContentBlock[];
  height: number | 'auto';
  maxHeight?: number;
  backgroundColor?: string;
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  gap?: number;
  borderRadius?: number;
  showScrollIndicator?: boolean;
  scrollSnap?: 'none' | 'start' | 'center';
}

// Union type for all block content
export type BlockContent =
  | TextBlockContent
  | ImageBlockContent
  | VideoBlockContent
  | LottieBlockContent
  | IconBlockContent
  | ButtonBlockContent
  | SpacerBlockContent
  | DividerBlockContent
  | InputBlockContent
  | ChecklistBlockContent
  | SliderBlockContent
  | ProgressBlockContent
  | FeatureCardBlockContent
  | ScrollContainerBlockContent
  | CustomBlockContent;

// Content block
export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  order: number;
  position?: {
    x: number;
    y: number;
  };
  visible?: boolean;
  pinToBottom?: boolean;
  styling?: BlockStyling;
  animation?: {
    type: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'bounce' | 'none';
    delay?: number;
    duration?: number;
  };
  content: BlockContent;
}

// Carousel slide
export interface CarouselSlide {
  icon?: string;
  image?: string;
  title: string;
  body: string;
}

// Screen content
export interface ScreenContent {
  // Legacy fields
  title?: string;
  subtitle?: string;
  body?: string;
  image?: string;
  backgroundColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  buttonText?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  buttonAction?: ButtonAction;
  icon?: string;
  // Block-based content
  blocks?: ContentBlock[];
  useBlocks?: boolean;
  // Background options
  backgroundGradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    angle?: number;
  };
  backgroundImage?: string;
  backgroundOverlay?: string;
  // Carousel specific
  slides?: CarouselSlide[];
  // Permission specific
  permissionType?: 'notifications' | 'location' | 'camera' | 'photos';
  skipText?: string;
  skipAction?: ButtonAction;
  // Native specific
  identifier?: string;
  // Filler specific
  fillerDuration?: number;
  fillerAnimation?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'typewriter' | 'none';
}

// Screen
export interface Screen {
  id: string;
  app_id: string;
  flow_id?: string;
  name: string;
  type: ScreenType;
  order: number;
  content: ScreenContent;
  transition?: ScreenTransition;
  created_at: string;
  updated_at: string;
}

// Flow progress indicator
export interface FlowProgressIndicator {
  enabled: boolean;
  variant: 'bar' | 'dots' | 'steps' | 'minimal';
  position: 'top' | 'bottom';
  fillColor?: string;
  trackColor?: string;
  animated?: boolean;
  startScreen?: number;
  endScreen?: number;
  skipScreens?: number[];
}

// Screen transition config
export interface ScreenTransitionConfig {
  fromScreenId: string;
  toScreenId: string;
  transition: ScreenTransition;
}

// Onboarding config (API response)
export interface OnboardingConfig {
  version: number;
  screens: Screen[];
  progressIndicator?: FlowProgressIndicator;
  transitions?: ScreenTransitionConfig[];
  experiment?: {
    id: string;
    variantId: string;
    variantName: string;
  };
}

// Event types
export type EventType =
  | 'screen_viewed'
  | 'screen_first_viewed'
  | 'screen_completed'
  | 'screen_skipped'
  | 'screen_dropped_off'
  | 'button_tapped'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'experiment_variant_assigned';

// Event payload
export interface TrackingEvent {
  event_type: EventType;
  screen_id?: string;
  user_id?: string;
  device_id: string;
  timestamp: string;
  properties?: Record<string, unknown>;
  experiment_id?: string;
  variant_id?: string;
}

// SDK configuration
export interface SequenceConfig {
  appId: string;
  apiKey: string;
  baseURL?: string;
}

// Collected data from inputs/checklists/sliders
export type CollectedData = Record<string, string | string[] | number>;

// Design constants (matching editor)
export const DESIGN_CANVAS = {
  width: 393,
  height: 852,
  safeAreaTop: 59,
  safeAreaBottom: 34,
} as const;

export const CONTENT_AREA = {
  width: DESIGN_CANVAS.width,
  height: DESIGN_CANVAS.height - DESIGN_CANVAS.safeAreaTop - DESIGN_CANVAS.safeAreaBottom,
  horizontalPadding: 24,
} as const;
