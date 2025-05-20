// src/composables/useJurisdiction.ts
import { ref, computed, watchEffect, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  availableJurisdictions,
  currentJurisdiction,
  apiBaseUrl as storeApiBaseUrl,
  setJurisdictionByIdentifier
} from '@/stores/jurisdictionStore';
import type { Jurisdiction, Region } from '@/types/jurisdiction';

/**
 * Composable for managing jurisdiction selection and related functionality
 * Handles jurisdiction detection, selection, and provides reactive state
 */
export function useJurisdiction() {
  const { t } = useI18n();

  // Local reactive references to store values
  const jurisdictions = ref(availableJurisdictions.get());
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
    (value) => { jurisdictions.value = value; }
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
   * Detect the appropriate jurisdiction based on the user's location or browser settings
   */
  const detectJurisdiction = async () => {
    isDetecting.value = true;
    try {
      // This would normally use geolocation or IP-based services
      // For now, we'll simulate a detection by returning a random jurisdiction
      await new Promise(resolve => setTimeout(resolve, 500));

      const allJurisdictions = jurisdictions.value;
      const detected = allJurisdictions[Math.floor(Math.random() * allJurisdictions.length)];

      // Only suggest a different jurisdiction if it's not the current one
      if (detected.identifier !== current.value.identifier) {
        detectedJurisdiction.value = detected.identifier;
        suggestedDomain.value = detected.domain;
        return detected;
      }
    } catch (error) {
      console.error('Failed to detect jurisdiction:', error);
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
    getCurrentJurisdictionUrl,
    clearSuggestion,
    cleanup
  };
}
