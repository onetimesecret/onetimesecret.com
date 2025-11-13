// src/composables/useJurisdiction.ts
import { computed, ref, watchEffect } from 'vue';
import {
  apiBaseUrl as storeApiBaseUrl,
  availableJurisdictions,
  currentJurisdiction,
  setJurisdictionByIdentifier,
} from '@/stores/jurisdictionStore';
import type { Region } from '@/types/jurisdiction';
import { detectLocationWithRetry, isProbablyVPN } from '@/utils/locationDetection';
import type { LocationDetectionResult } from '@/utils/locationDetection';

/**
 * Composable for managing jurisdiction selection and related functionality
 * Handles jurisdiction detection, selection, and provides reactive state
 */
export function useJurisdiction() {

  // Local reactive references to store values
  const jurisdictions = ref([...availableJurisdictions.get()]);
  const current = ref(currentJurisdiction.get());
  const apiBaseUrl = ref(storeApiBaseUrl.get());
  const detectedJurisdiction = ref<string>('');
  const suggestedDomain = ref<string>('');
  const isDetecting = ref(false);
  const detectionError = ref<string>('');
  const detectedCountryCode = ref<string>('');
  const isVPNDetected = ref(false);

  // Create a watcher to keep local refs in sync with the store
  watchEffect(() => {
    jurisdictions.value = availableJurisdictions.get();
    current.value = currentJurisdiction.get();
    apiBaseUrl.value = storeApiBaseUrl.get();
  });

  // Subscribe to store changes
  const unsubscribeAvailable = availableJurisdictions.subscribe(
    (value) => { jurisdictions.value = [...value]; }
  );

  const unsubscribeCurrent = currentJurisdiction.subscribe(
    (value) => { current.value = value; }
  );

  const unsubscribeApiBaseUrl = storeApiBaseUrl.subscribe(
    (value) => { apiBaseUrl.value = value; }
  );

  /**
   * Set the current jurisdiction by its identifier
   */
  const setJurisdiction = (identifier: string) => {
    const jurisdiction = setJurisdictionByIdentifier(identifier);
    return jurisdiction;
  };

  /**
   * Detect the appropriate jurisdiction based on the user's location using BunnyCDN headers
   */
  const detectJurisdiction = async () => {
    isDetecting.value = true;
    detectionError.value = '';

    try {
      const result: LocationDetectionResult = await detectLocationWithRetry();

      if (!result.detected) {
        detectionError.value = result.error || 'Failed to detect location';
        return null;
      }

      // Store the detected country code
      detectedCountryCode.value = result.countryCode || '';

      if (result.jurisdiction) {
        const detected = jurisdictions.value.find(
          (j) => j.identifier === result.jurisdiction
        );

        if (detected) {
          // Check if user might be on VPN
          if (typeof window !== 'undefined') {
            isVPNDetected.value = isProbablyVPN(
              result.jurisdiction,
              window.location.hostname
            );
          }

          // Only suggest a different jurisdiction if it's not the current one
          if (detected.identifier !== current.value.identifier) {
            detectedJurisdiction.value = detected.identifier;
            suggestedDomain.value = detected.domain;
            return detected;
          }

          // If detected jurisdiction matches current, still set the values for display
          detectedJurisdiction.value = detected.identifier;
          suggestedDomain.value = detected.domain;
          return detected;
        }
      }

      detectionError.value = 'Could not map location to a jurisdiction';
    } catch (error) {
      console.error('Failed to detect jurisdiction:', error);
      detectionError.value =
        error instanceof Error ? error.message : 'Unknown error occurred';
    } finally {
      isDetecting.value = false;
    }

    return null;
  };

  /**
   * Check if the current domain matches the selected jurisdiction
   */
  const isDomainMismatched = computed(() => {
    if (typeof window === 'undefined') return false;

    const currentDomain = window.location.hostname;
    return currentDomain !== current.value.domain;
  });

  /**
   * Get URL for the current jurisdiction
   */
  const getCurrentJurisdictionUrl = (path = ''): string => {
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
    return `${protocol}//${current.value.domain}${path}`;
  };

  /**
   * Reset suggestion after it has been handled
   */
  const clearSuggestion = () => {
    detectedJurisdiction.value = '';
    suggestedDomain.value = '';
    detectionError.value = '';
    detectedCountryCode.value = '';
    isVPNDetected.value = false;
  };

  /**
   * Cleanup function to unsubscribe from stores
   */
  const cleanup = () => {
    unsubscribeAvailable();
    unsubscribeCurrent();
    unsubscribeApiBaseUrl();
  };

  // Type compatibility with legacy Region type
  const availableRegions = computed((): Region[] => jurisdictions.value);
  const currentRegion = computed((): Region => current.value);

  return {
    // Main jurisdiction data
    jurisdictions,
    current,
    apiBaseUrl,

    // Reactive state
    detectedJurisdiction,
    suggestedDomain,
    isDetecting,
    isDomainMismatched,
    detectionError,
    detectedCountryCode,
    isVPNDetected,

    // Legacy compatibility (Region type)
    availableRegions,
    currentRegion,

    // Methods
    setJurisdiction,
    detectJurisdiction,
    getCurrentJurisdictionUrl,
    clearSuggestion,
    cleanup,
  };
}
