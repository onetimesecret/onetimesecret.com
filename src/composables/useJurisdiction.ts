// src/composables/useJurisdiction.ts
import { ref, computed, watchEffect } from 'vue';
import {
  availableJurisdictions,
  currentJurisdiction,
  apiBaseUrl as storeApiBaseUrl,
  setJurisdictionByIdentifier
} from '@/stores/jurisdictionStore';
import type { Region } from '@/types/jurisdiction';

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
   * Detect the appropriate jurisdiction based on the user's country code
   * Uses the country code injected by BunnyCDN edge middleware
   * Falls back to browser geolocation API if country code is not available
   */
  const detectJurisdiction = async () => {
    isDetecting.value = true;
    try {
      // Dynamic import to avoid SSR issues
      const { detectUserCountry, getJurisdictionForCountry } = await import(
        '@/utils/countryToJurisdiction'
      );

      const countryCode = detectUserCountry();

      if (countryCode) {
        const jurisdictionId = getJurisdictionForCountry(countryCode);
        const detected = jurisdictions.value.find((j) => j.identifier === jurisdictionId);

        if (detected) {
          // Only suggest a different jurisdiction if it's not the current one
          if (detected.identifier !== current.value.identifier) {
            detectedJurisdiction.value = detected.identifier;
            suggestedDomain.value = detected.domain;
            return detected;
          }
        }
      } else {
        // Fallback to browser geolocation if country code is not available
        // This is a future enhancement - currently returns null
        console.info('Country code not available, geolocation fallback not implemented');
      }
    } catch (error) {
      console.error('Failed to detect jurisdiction:', error);
    } finally {
      isDetecting.value = false;
    }

    return null;
  };

  /**
   * Auto-select jurisdiction based on user's country code without prompting
   * This is useful for automatic jurisdiction selection on page load
   * @returns The selected jurisdiction or null if detection failed
   */
  const autoSelectJurisdiction = async () => {
    isDetecting.value = true;
    try {
      // Dynamic import to avoid SSR issues
      const { detectUserCountry, getJurisdictionForCountry } = await import(
        '@/utils/countryToJurisdiction'
      );

      const countryCode = detectUserCountry();

      if (countryCode) {
        const jurisdictionId = getJurisdictionForCountry(countryCode);
        const detected = jurisdictions.value.find((j) => j.identifier === jurisdictionId);

        if (detected && detected.identifier !== current.value.identifier) {
          // Automatically set the detected jurisdiction
          setJurisdiction(detected.identifier);
          return detected;
        }
      }
    } catch (error) {
      console.error('Failed to auto-select jurisdiction:', error);
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

    // Legacy compatibility (Region type)
    availableRegions,
    currentRegion,

    // Methods
    setJurisdiction,
    detectJurisdiction,
    autoSelectJurisdiction,
    getCurrentJurisdictionUrl,
    clearSuggestion,
    cleanup
  };
}
