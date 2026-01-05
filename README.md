# Sequence React Native SDK

Beautiful onboarding flows for React Native apps. Display onboarding exactly as designed in the Sequence editor with pixel-perfect rendering.

## Installation

```bash
npm install @anthropic/sequence-react-native
# or
yarn add @anthropic/sequence-react-native
```

### Peer Dependencies

The SDK requires the following peer dependencies:

```bash
npm install react-native-safe-area-context react-native-reanimated @react-native-async-storage/async-storage @react-native-community/slider react-native-svg react-native-linear-gradient
```

For Expo projects:
```bash
npx expo install react-native-safe-area-context react-native-reanimated @react-native-async-storage/async-storage @react-native-community/slider react-native-svg expo-linear-gradient expo-haptics
```

## Quick Start

### 1. Wrap your app with SequenceProvider

```tsx
import { SequenceProvider } from '@anthropic/sequence-react-native';

export default function App() {
  return (
    <SequenceProvider
      config={{
        appId: 'your-app-id',
        apiKey: 'your-api-key',
      }}
    >
      <YourApp />
    </SequenceProvider>
  );
}
```

### 2. Show the onboarding modal

```tsx
import { useState } from 'react';
import { OnboardingModal, useShouldShowOnboarding } from '@anthropic/sequence-react-native';

function YourApp() {
  const shouldShowOnboarding = useShouldShowOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding);

  return (
    <>
      <YourMainContent />

      <OnboardingModal
        visible={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={(collectedData) => {
          console.log('Onboarding completed!', collectedData);
          setShowOnboarding(false);
        }}
      />
    </>
  );
}
```

## Advanced Usage

### Using FlowRenderer directly

For more control, use the `FlowRenderer` component directly:

```tsx
import { FlowRenderer, useSequence } from '@anthropic/sequence-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function OnboardingScreen() {
  const { config } = useSequence();

  if (!config) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaProvider>
      <FlowRenderer
        screens={config.screens}
        progressIndicator={config.progressIndicator}
        transitions={config.transitions}
        onComplete={(data) => {
          console.log('Completed with data:', data);
        }}
        onCustomAction={(identifier) => {
          if (identifier === 'signInWithApple') {
            // Handle Apple Sign In
          }
        }}
      />
    </SafeAreaProvider>
  );
}
```

### Custom Native Screens

Handle native screen types for platform-specific implementations:

```tsx
<OnboardingModal
  visible={visible}
  onClose={handleClose}
  onNativeScreen={(screen) => {
    // Return a React Native component for native screens
    if (screen.content.identifier === 'permissions') {
      return <PermissionsScreen />;
    }
    return null;
  }}
/>
```

### Custom Block Components

Register custom block types to extend the SDK:

```tsx
<OnboardingModal
  visible={visible}
  onClose={handleClose}
  renderCustomBlock={(identifier, props) => {
    if (identifier === 'my-custom-widget') {
      return <MyCustomWidget {...props} />;
    }
    return null;
  }}
/>
```

### Manual Configuration

Configure the SDK manually for more control:

```tsx
import { Sequence, SequenceProvider } from '@anthropic/sequence-react-native';

// Configure manually (useful for dynamic configuration)
await Sequence.configure({
  appId: 'your-app-id',
  apiKey: 'your-api-key',
  baseURL: 'https://custom-api.example.com', // Optional custom API URL
});

// Identify a user
await Sequence.identify('user-123');

// Fetch config manually
const config = await Sequence.fetchConfig();

// Track custom events
await Sequence.track('custom_event', 'screen-id', { custom: 'data' });
```

## Hooks

### useSequence

Access the full Sequence context:

```tsx
const {
  isConfigured,  // SDK is configured
  isLoading,     // Currently loading config
  error,         // Any error that occurred
  config,        // The onboarding configuration
  screens,       // Shortcut to config.screens
  isOnboardingCompleted,  // User has completed onboarding
  experimentInfo,         // A/B test experiment info

  // Actions
  configure,     // Configure the SDK
  fetchConfig,   // Fetch onboarding config
  identify,      // Identify a user
  reset,         // Reset SDK state
  markOnboardingCompleted,  // Mark onboarding complete
} = useSequence();
```

### useShouldShowOnboarding

Simple hook to check if onboarding should be displayed:

```tsx
const shouldShow = useShouldShowOnboarding();
// Returns true if not completed AND screens are available
```

### useOnboardingScreens

Get just the screens array:

```tsx
const screens = useOnboardingScreens();
```

## Components

### OnboardingModal

Full-screen modal for displaying onboarding:

| Prop | Type | Description |
|------|------|-------------|
| `visible` | `boolean` | Control modal visibility |
| `onClose` | `() => void` | Called when modal should close |
| `onComplete` | `(data: CollectedData) => void` | Called when onboarding completes |
| `onNativeScreen` | `(screen: Screen) => ReactNode` | Render native screens |
| `onCustomAction` | `(identifier: string) => void` | Handle custom button actions |
| `renderCustomBlock` | `(id: string, props?) => ReactNode` | Render custom block types |
| `renderLoading` | `() => ReactNode` | Custom loading UI |
| `renderError` | `(error, retry) => ReactNode` | Custom error UI |
| `config` | `OnboardingConfig` | Use external config instead of fetching |

### FlowRenderer

Core renderer component:

| Prop | Type | Description |
|------|------|-------------|
| `screens` | `Screen[]` | Array of screens to render |
| `progressIndicator` | `FlowProgressIndicator` | Progress bar configuration |
| `transitions` | `ScreenTransitionConfig[]` | Screen transition settings |
| `initialScreenIndex` | `number` | Starting screen index |
| `onComplete` | `(data: CollectedData) => void` | Completion callback |
| `onNativeScreen` | `(screen: Screen) => ReactNode` | Native screen renderer |
| `onCustomAction` | `(identifier: string) => void` | Custom action handler |
| `renderCustomBlock` | `(id: string, props?) => ReactNode` | Custom block renderer |

## Collected Data

Data collected from user inputs during onboarding is passed to the `onComplete` callback:

```tsx
onComplete={(collectedData) => {
  // collectedData is a Record<string, string | string[] | number>
  // Keys are the fieldName values from input/checklist/slider blocks

  console.log(collectedData.user_name);     // Input field
  console.log(collectedData.interests);     // Checklist (array)
  console.log(collectedData.daily_budget);  // Slider value
}}
```

## Event Tracking

The SDK automatically tracks these events:

- `onboarding_started` - When onboarding begins
- `screen_viewed` - Each time a screen is displayed
- `screen_completed` - When user advances from a screen
- `onboarding_completed` - When user finishes the flow

For custom tracking:

```tsx
import { Sequence } from '@anthropic/sequence-react-native';

Sequence.track('custom_event', 'screen-id', {
  custom_property: 'value',
});
```

## A/B Testing

The SDK automatically handles A/B test experiments:

```tsx
const { experimentInfo } = useSequence();

if (experimentInfo) {
  console.log('Experiment:', experimentInfo.id);
  console.log('Variant:', experimentInfo.variantName);
}
```

## Styling

The SDK scales content to match the design canvas (iPhone 15 Pro dimensions: 393×852 points). Content automatically scales to fit any device while maintaining aspect ratio.

For custom styling utilities:

```tsx
import { scale, getStylingStyles, getScaleFactor } from '@anthropic/sequence-react-native';

// Scale a pixel value
const scaledPadding = scale(24); // Scales 24px to device

// Get current scale factor
const factor = getScaleFactor(); // e.g., 1.0 on iPhone 15 Pro

// Convert BlockStyling to React Native styles
const styles = getStylingStyles(block.styling);
```

## TypeScript

The SDK is fully typed. Import types as needed:

```tsx
import type {
  Screen,
  ContentBlock,
  OnboardingConfig,
  CollectedData,
  ButtonAction,
} from '@anthropic/sequence-react-native';
```

## Requirements

- React Native 0.72+
- React 18+
- iOS 13+ / Android API 21+

## License

MIT
