import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  OnboardingConfig,
  Screen,
  CollectedData,
  SequenceConfig,
} from './types';
import { Sequence } from './SequenceClient';

interface SequenceContextValue {
  // State
  isConfigured: boolean;
  isLoading: boolean;
  error: Error | null;
  config: OnboardingConfig | null;
  screens: Screen[];
  isOnboardingCompleted: boolean;
  experimentInfo: { id: string; variantId: string; variantName: string } | null;

  // Actions
  configure: (config: SequenceConfig) => Promise<void>;
  fetchConfig: () => Promise<OnboardingConfig>;
  identify: (userId: string) => Promise<void>;
  reset: () => Promise<void>;
  markOnboardingCompleted: (collectedData?: CollectedData) => Promise<void>;
}

const SequenceContext = createContext<SequenceContextValue | null>(null);

interface SequenceProviderProps {
  children: ReactNode;
  // Optional: auto-configure on mount
  config?: SequenceConfig;
  // Optional: auto-fetch config after configuring
  autoFetch?: boolean;
}

export function SequenceProvider({
  children,
  config: initialConfig,
  autoFetch = true,
}: SequenceProviderProps) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [config, setConfig] = useState<OnboardingConfig | null>(null);

  // Configure the SDK
  const configure = useCallback(async (sdkConfig: SequenceConfig) => {
    try {
      setIsLoading(true);
      setError(null);
      await Sequence.configure(sdkConfig);
      setIsConfigured(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Configuration failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch the onboarding configuration
  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedConfig = await Sequence.fetchConfig();
      setConfig(fetchedConfig);
      return fetchedConfig;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch config');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Identify a user
  const identify = useCallback(async (userId: string) => {
    await Sequence.identify(userId);
  }, []);

  // Reset the SDK
  const reset = useCallback(async () => {
    await Sequence.reset();
    setConfig(null);
  }, []);

  // Mark onboarding as completed
  const markOnboardingCompleted = useCallback(async (collectedData?: CollectedData) => {
    await Sequence.trackOnboardingCompleted(collectedData);
  }, []);

  // Auto-configure if initial config provided
  useEffect(() => {
    if (initialConfig && !isConfigured) {
      configure(initialConfig).then(() => {
        if (autoFetch) {
          fetchConfig().catch(console.error);
        }
      }).catch(console.error);
    }
  }, [initialConfig, isConfigured, configure, fetchConfig, autoFetch]);

  const value = useMemo<SequenceContextValue>(
    () => ({
      isConfigured,
      isLoading,
      error,
      config,
      screens: config?.screens || [],
      isOnboardingCompleted: Sequence.getIsOnboardingCompleted(),
      experimentInfo: Sequence.getExperimentInfo(),
      configure,
      fetchConfig,
      identify,
      reset,
      markOnboardingCompleted,
    }),
    [
      isConfigured,
      isLoading,
      error,
      config,
      configure,
      fetchConfig,
      identify,
      reset,
      markOnboardingCompleted,
    ]
  );

  return (
    <SequenceContext.Provider value={value}>
      {children}
    </SequenceContext.Provider>
  );
}

/**
 * Hook to access the Sequence context
 */
export function useSequence(): SequenceContextValue {
  const context = useContext(SequenceContext);
  if (!context) {
    throw new Error('useSequence must be used within a SequenceProvider');
  }
  return context;
}

/**
 * Hook to get the onboarding screens
 */
export function useOnboardingScreens(): Screen[] {
  const { screens } = useSequence();
  return screens;
}

/**
 * Hook to check if onboarding should be shown
 */
export function useShouldShowOnboarding(): boolean {
  const { isOnboardingCompleted, screens } = useSequence();
  return !isOnboardingCompleted && screens.length > 0;
}
