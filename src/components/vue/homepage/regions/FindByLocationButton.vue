<template>
  <div class="find-by-location-container">
    <button
      type="button"
      :disabled="isDetecting"
      :aria-label="$t('web.secrets.regionSelector.findByLocation')"
      class="find-location-button"
      @click="handleFindLocation"
    >
      <OIcon
        v-if="!isDetecting"
        collection="fa6-solid"
        name="location-crosshairs"
        class="location-icon"
      />
      <OIcon
        v-else
        collection="fa6-solid"
        name="spinner"
        class="spinner-icon"
      />
      <span class="button-text">
        {{
          isDetecting
            ? $t('web.secrets.regionSelector.detecting')
            : $t('web.secrets.regionSelector.findByLocation')
        }}
      </span>
    </button>

    <!-- Detection result message -->
    <div v-if="detectionMessage" class="detection-message" :class="messageType">
      <OIcon
        :collection="messageIcon.collection"
        :name="messageIcon.name"
        class="message-icon"
      />
      <span>{{ detectionMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import OIcon from '@/components/vue/icons/OIcon.vue';
import { useJurisdiction } from '@/composables/useJurisdiction';

const { t } = useI18n();

const {
  detectJurisdiction,
  isDetecting,
  detectedJurisdiction,
  detectedCountryCode,
  detectionError,
  isVPNDetected,
  current,
} = useJurisdiction();

const showMessage = ref(false);
const messageTimeout = ref<number | null>(null);

/**
 * Handle the find location button click
 */
const handleFindLocation = async () => {
  // Clear any previous message
  clearMessage();

  // Trigger detection
  await detectJurisdiction();

  // Show message for 5 seconds
  showMessage.value = true;

  // Auto-hide message after 5 seconds
  if (messageTimeout.value) {
    clearTimeout(messageTimeout.value);
  }
  messageTimeout.value = setTimeout(() => {
    showMessage.value = false;
  }, 5000) as unknown as number;

  // If detected and different from current, optionally auto-switch
  // For now, we just show the message and let user decide
};

/**
 * Clear the detection message
 */
const clearMessage = () => {
  showMessage.value = false;
  if (messageTimeout.value) {
    clearTimeout(messageTimeout.value);
    messageTimeout.value = null;
  }
};

/**
 * Computed message type for styling
 */
const messageType = computed(() => {
  if (detectionError.value) return 'error';
  if (isVPNDetected.value) return 'warning';
  if (detectedJurisdiction.value === current.value.identifier) return 'success';
  if (detectedJurisdiction.value) return 'info';
  return 'info';
});

/**
 * Computed icon for the message
 */
const messageIcon = computed(() => {
  if (detectionError.value) {
    return { collection: 'fa6-solid', name: 'circle-exclamation' };
  }
  if (isVPNDetected.value) {
    return { collection: 'fa6-solid', name: 'shield-halved' };
  }
  if (detectedJurisdiction.value === current.value.identifier) {
    return { collection: 'fa6-solid', name: 'circle-check' };
  }
  if (detectedJurisdiction.value) {
    return { collection: 'fa6-solid', name: 'location-dot' };
  }
  return { collection: 'fa6-solid', name: 'circle-info' };
});

/**
 * Computed detection message
 */
const detectionMessage = computed(() => {
  if (!showMessage.value) return '';

  if (detectionError.value) {
    return t('web.secrets.regionSelector.detectionFailed');
  }

  if (detectedJurisdiction.value) {
    if (detectedJurisdiction.value === current.value.identifier) {
      return t('web.secrets.regionSelector.alreadyOptimal');
    }

    const message = t('web.secrets.regionSelector.detectionSuccess', {
      country: detectedCountryCode.value,
      jurisdiction: detectedJurisdiction.value,
    });

    if (isVPNDetected.value) {
      return `${message} - ${t('web.secrets.regionSelector.vpnDetected')}`;
    }

    return message;
  }

  return '';
});
</script>

<style scoped>
.find-by-location-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.find-location-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(55 65 81);
  background-color: rgb(249 250 251);
  border: 1px solid rgb(209 213 219);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.find-location-button:hover:not(:disabled) {
  background-color: rgb(243 244 246);
  border-color: rgb(156 163 175);
}

.find-location-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.find-location-button:focus {
  outline: 2px solid rgb(59 130 246);
  outline-offset: 2px;
}

.location-icon {
  width: 1rem;
  height: 1rem;
  color: rgb(59 130 246);
}

.spinner-icon {
  width: 1rem;
  height: 1rem;
  color: rgb(59 130 246);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.button-text {
  line-height: 1;
}

.detection-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detection-message.success {
  color: rgb(5 150 105);
  background-color: rgb(236 253 245);
  border: 1px solid rgb(167 243 208);
}

.detection-message.info {
  color: rgb(30 64 175);
  background-color: rgb(239 246 255);
  border: 1px solid rgb(191 219 254);
}

.detection-message.warning {
  color: rgb(161 98 7);
  background-color: rgb(254 252 232);
  border: 1px solid rgb(253 224 71);
}

.detection-message.error {
  color: rgb(185 28 28);
  background-color: rgb(254 242 242);
  border: 1px solid rgb(252 165 165);
}

.message-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .find-location-button {
    color: rgb(229 231 235);
    background-color: rgb(31 41 55);
    border-color: rgb(75 85 99);
  }

  .find-location-button:hover:not(:disabled) {
    background-color: rgb(55 65 81);
    border-color: rgb(107 114 128);
  }

  .detection-message.success {
    color: rgb(110 231 183);
    background-color: rgb(6 78 59);
    border-color: rgb(5 150 105);
  }

  .detection-message.info {
    color: rgb(147 197 253);
    background-color: rgb(30 58 138);
    border-color: rgb(59 130 246);
  }

  .detection-message.warning {
    color: rgb(253 224 71);
    background-color: rgb(113 63 18);
    border-color: rgb(202 138 4);
  }

  .detection-message.error {
    color: rgb(252 165 165);
    background-color: rgb(127 29 29);
    border-color: rgb(220 38 38);
  }
}
</style>
