import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  SequenceConfig,
  OnboardingConfig,
  TrackingEvent,
  EventType,
  CollectedData,
} from './types';

// Storage keys
const STORAGE_KEYS = {
  DEVICE_ID: '@sequence_device_id',
  USER_ID: '@sequence_user_id',
  ONBOARDING_COMPLETED: '@sequence_onboarding_completed',
  CACHED_CONFIG: '@sequence_cached_config',
  PENDING_EVENTS: '@sequence_pending_events',
} as const;

// Generate a UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Singleton Sequence client
class SequenceClient {
  private static instance: SequenceClient;

  private config: SequenceConfig | null = null;
  private deviceId: string | null = null;
  private userId: string | null = null;
  private isOnboardingCompleted: boolean = false;
  private pendingEvents: TrackingEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private experimentInfo: { id: string; variantId: string; variantName: string } | null = null;

  // Event batch settings
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL_MS = 10000; // 10 seconds

  private constructor() {}

  static getInstance(): SequenceClient {
    if (!SequenceClient.instance) {
      SequenceClient.instance = new SequenceClient();
    }
    return SequenceClient.instance;
  }

  /**
   * Configure the Sequence SDK
   */
  async configure(config: SequenceConfig): Promise<void> {
    this.config = {
      ...config,
      baseURL: config.baseURL || 'https://api.usesequence.com',
    };

    // Initialize device ID
    await this.initializeDeviceId();

    // Load persisted state
    await this.loadPersistedState();

    // Start event flush timer
    this.startFlushTimer();
  }

  /**
   * Identify a user (for analytics and personalization)
   */
  async identify(userId: string): Promise<void> {
    this.userId = userId;
    await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  }

  /**
   * Reset the SDK state (e.g., on logout)
   */
  async reset(): Promise<void> {
    this.userId = null;
    this.isOnboardingCompleted = false;
    this.experimentInfo = null;

    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_ID,
      STORAGE_KEYS.ONBOARDING_COMPLETED,
      STORAGE_KEYS.CACHED_CONFIG,
    ]);
  }

  /**
   * Check if onboarding has been completed
   */
  getIsOnboardingCompleted(): boolean {
    return this.isOnboardingCompleted;
  }

  /**
   * Get the current experiment info (if any)
   */
  getExperimentInfo(): { id: string; variantId: string; variantName: string } | null {
    return this.experimentInfo;
  }

  /**
   * Fetch the onboarding configuration from the server
   */
  async fetchConfig(): Promise<OnboardingConfig> {
    if (!this.config) {
      throw new Error('Sequence SDK not configured. Call configure() first.');
    }

    const url = `${this.config.baseURL}/api/v1/config/${this.config.appId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'x-device-id': this.deviceId || '',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`);
      }

      const config: OnboardingConfig = await response.json();

      // Store experiment info if present
      if (config.experiment) {
        this.experimentInfo = config.experiment;
      }

      // Cache the config
      await AsyncStorage.setItem(STORAGE_KEYS.CACHED_CONFIG, JSON.stringify(config));

      return config;
    } catch (error) {
      // Try to use cached config on error
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_CONFIG);
      if (cached) {
        console.warn('[Sequence] Using cached config due to network error');
        return JSON.parse(cached);
      }
      throw error;
    }
  }

  /**
   * Track an event
   */
  async track(
    eventType: EventType,
    screenId?: string,
    properties?: Record<string, unknown>
  ): Promise<void> {
    if (!this.config) {
      console.warn('[Sequence] SDK not configured. Event not tracked.');
      return;
    }

    const event: TrackingEvent = {
      event_type: eventType,
      screen_id: screenId,
      user_id: this.userId || undefined,
      device_id: this.deviceId || '',
      timestamp: new Date().toISOString(),
      properties,
      experiment_id: this.experimentInfo?.id,
      variant_id: this.experimentInfo?.variantId,
    };

    this.pendingEvents.push(event);

    // Flush if batch size reached
    if (this.pendingEvents.length >= this.BATCH_SIZE) {
      await this.flushEvents();
    }
  }

  /**
   * Track onboarding completion with collected data
   */
  async trackOnboardingCompleted(collectedData?: CollectedData): Promise<void> {
    this.isOnboardingCompleted = true;
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');

    await this.track('onboarding_completed', undefined, {
      collected_data: collectedData,
    });

    // Force flush on completion
    await this.flushEvents();
  }

  /**
   * Flush pending events to the server
   */
  async flushEvents(): Promise<void> {
    if (!this.config || this.pendingEvents.length === 0) {
      return;
    }

    const eventsToSend = [...this.pendingEvents];
    this.pendingEvents = [];

    try {
      const response = await fetch(`${this.config.baseURL}/api/v1/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
        },
        body: JSON.stringify({ events: eventsToSend }),
      });

      if (!response.ok) {
        // Re-add events on failure
        this.pendingEvents = [...eventsToSend, ...this.pendingEvents];
        console.warn('[Sequence] Failed to flush events:', response.status);
      }
    } catch (error) {
      // Re-add events on error
      this.pendingEvents = [...eventsToSend, ...this.pendingEvents];
      console.warn('[Sequence] Error flushing events:', error);

      // Persist pending events for later
      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_EVENTS,
        JSON.stringify(this.pendingEvents)
      );
    }
  }

  // Private methods

  private async initializeDeviceId(): Promise<void> {
    let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);

    if (!deviceId) {
      deviceId = generateUUID();
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }

    this.deviceId = deviceId;
  }

  private async loadPersistedState(): Promise<void> {
    const [completed, userId, pendingEvents] = await AsyncStorage.multiGet([
      STORAGE_KEYS.ONBOARDING_COMPLETED,
      STORAGE_KEYS.USER_ID,
      STORAGE_KEYS.PENDING_EVENTS,
    ]);

    this.isOnboardingCompleted = completed[1] === 'true';
    this.userId = userId[1];

    if (pendingEvents[1]) {
      try {
        this.pendingEvents = JSON.parse(pendingEvents[1]);
      } catch {
        this.pendingEvents = [];
      }
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.FLUSH_INTERVAL_MS);
  }
}

// Export singleton instance
export const Sequence = SequenceClient.getInstance();
