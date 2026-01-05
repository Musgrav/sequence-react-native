import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Screen, CollectedData, OnboardingConfig } from '../types';
import { FlowRenderer } from './FlowRenderer';
import { useSequence } from '../SequenceProvider';

interface OnboardingModalProps {
  // Control visibility
  visible: boolean;
  onClose: () => void;

  // Callbacks
  onComplete?: (collectedData: CollectedData) => void;
  onNativeScreen?: (screen: Screen) => React.ReactNode;
  onCustomAction?: (identifier: string) => void;
  renderCustomBlock?: (identifier: string, props?: Record<string, unknown>) => React.ReactNode;

  // Custom loading/error UI
  renderLoading?: () => React.ReactNode;
  renderError?: (error: Error, retry: () => void) => React.ReactNode;

  // Optional: use external config instead of fetching
  config?: OnboardingConfig;
}

export function OnboardingModal({
  visible,
  onClose,
  onComplete,
  onNativeScreen,
  onCustomAction,
  renderCustomBlock,
  renderLoading,
  renderError,
  config: externalConfig,
}: OnboardingModalProps) {
  const {
    isLoading,
    error,
    config: contextConfig,
    fetchConfig,
    experimentInfo,
  } = useSequence();

  const config = externalConfig || contextConfig;

  // Fetch config when modal becomes visible (if not using external config)
  useEffect(() => {
    if (visible && !externalConfig && !contextConfig && !isLoading && !error) {
      fetchConfig().catch(console.error);
    }
  }, [visible, externalConfig, contextConfig, isLoading, error, fetchConfig]);

  const handleComplete = (collectedData: CollectedData) => {
    onComplete?.(collectedData);
    onClose();
  };

  const handleRetry = () => {
    fetchConfig().catch(console.error);
  };

  // Render loading state
  const renderLoadingState = () => {
    if (renderLoading) {
      return renderLoading();
    }

    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  };

  // Render error state
  const renderErrorState = () => {
    if (renderError && error) {
      return renderError(error, handleRetry);
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>
          {error?.message || 'Failed to load onboarding'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render content based on state
  const renderContent = () => {
    if (isLoading) {
      return renderLoadingState();
    }

    if (error) {
      return renderErrorState();
    }

    if (!config || !config.screens || config.screens.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorMessage}>No onboarding screens available</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlowRenderer
        screens={config.screens}
        progressIndicator={config.progressIndicator}
        transitions={config.transitions}
        onComplete={handleComplete}
        onNativeScreen={onNativeScreen}
        onCustomAction={onCustomAction}
        renderCustomBlock={renderCustomBlock}
        experimentInfo={experimentInfo}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <View style={styles.container}>{renderContent()}</View>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  closeButtonText: {
    color: '#666666',
    fontSize: 16,
  },
});
