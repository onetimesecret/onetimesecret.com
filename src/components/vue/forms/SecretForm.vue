<!-- src/components/vue/forms/SecretForm.vue -->

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

// Define the options model
interface SecretOptions {
  ttl: number; // Time to live in seconds
  addPassphrase: boolean;
}

// TTL options for the dropdown
interface TtlOption {
  value: number;
  label: string;
}

// API Response interface
export interface ApiResult {
  // Export the interface
  success: boolean;
  shrimp?: string;
  custid?: string;
  record?: {
    metadata?: {
      identifier?: string;
      key?: string;
      shortkey?: string;
      has_passphrase?: boolean;
      // Other metadata fields
    };
    secret?: {
      identifier?: string;
      key?: string;
      shortkey?: string;
      // Other secret fields
    };
    share_domain?: string | null;
  };
  message?: string | null;
  details?: {
    kind?: string;
    recipient?: any[];
    recipient_safe?: any[];
  };
}

interface Props {
  apiBaseUrl: string;
  placeholder?: string;
  withOptions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "",
  withOptions: false,
});

const emit = defineEmits<{
  createLink: [result: ApiResult];
}>();

// Initialize i18n
const { t } = useI18n({
  inheritLocale: true,
  useScope: "global",
});

// --- State ---
const secretText = ref("");
const secretOptions = ref<SecretOptions>({
  addPassphrase: false,
  ttl: 604800, // Default to 7 days
});
const passphrase = ref("");
const showPassphrase = ref(false);
const isLoading = ref(false);
const apiResult = ref<ApiResult | null>(null);
const apiError = ref<string | null>(null);
const copySuccess = ref(false);
const copyButtonRef = ref<HTMLButtonElement | null>(null);

// TTL options
const ttlOptions = ref<TtlOption[]>([
  { value: 1800, label: t("web.secrets.ttl.30minutes") || "30 minutes" },
  { value: 3600, label: t("web.secrets.ttl.1hour") || "1 hour" },
  { value: 14400, label: t("web.secrets.ttl.4hours") || "4 hours" },
  { value: 86400, label: t("web.secrets.ttl.1day") || "1 day" },
  { value: 259200, label: t("web.secrets.ttl.3days") || "3 days" },
  { value: 604800, label: t("web.secrets.ttl.7days") || "7 days" },
]);

const showTtlDropdown = ref(false);
const ttlDropdownRef = ref<HTMLElement | null>(null);
const showPassphrasePopover = ref(false);
const passphrasePopoverRef = ref<HTMLElement | null>(null);
const passphraseInputRef = ref<HTMLInputElement | null>(null);

// Close popovers on click outside
const handleClickOutside = (event: PointerEvent) => {
  const target = event.target as HTMLElement;
  if (
    showTtlDropdown.value &&
    ttlDropdownRef.value &&
    !ttlDropdownRef.value.contains(target)
  ) {
    showTtlDropdown.value = false;
  }
  if (
    showPassphrasePopover.value &&
    passphrasePopoverRef.value &&
    !passphrasePopoverRef.value.contains(target)
  ) {
    showPassphrasePopover.value = false;
  }
};

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    showTtlDropdown.value = false;
    showPassphrasePopover.value = false;
  }
};

const togglePassphrasePopover = async () => {
  showPassphrasePopover.value = !showPassphrasePopover.value;
  if (showPassphrasePopover.value) {
    secretOptions.value.addPassphrase = true;
    showTtlDropdown.value = false;
    await nextTick();
    passphraseInputRef.value?.focus();
  }
};

const toggleTtlDropdown = () => {
  showTtlDropdown.value = !showTtlDropdown.value;
  if (showTtlDropdown.value) {
    showPassphrasePopover.value = false;
  }
};

const clearPassphrase = () => {
  secretOptions.value.addPassphrase = false;
  passphrase.value = "";
  showPassphrase.value = false;
  showPassphrasePopover.value = false;
};

onMounted(() => {
  document.addEventListener("pointerdown", handleClickOutside);
  document.addEventListener("keydown", handleEscape);
});

onUnmounted(() => {
  document.removeEventListener("pointerdown", handleClickOutside);
  document.removeEventListener("keydown", handleEscape);
});

// --- Computed ---
const currentTtlLabel = computed(() => {
  const option = ttlOptions.value.find(o => o.value === secretOptions.value.ttl);
  return option ? option.label : "";
});
const showSuccessView = computed(
  () => apiResult.value?.success && apiResult.value.record,
);
const showFormView = computed(() => !showSuccessView.value);
const showOptions = computed(() => {
  return props.withOptions && secretText.value.trim().length > 0;
});

// --- Methods ---
// Method to reset the form while preserving feedback until next submission
const resetForm = () => {
  secretText.value = "";
  secretOptions.value = {
    ttl: 604800, // Reset to default 7 days
    addPassphrase: false,
  };
  passphrase.value = "";
  showPassphrase.value = false;
  isLoading.value = false;
  copySuccess.value = false;
  // We intentionally don't reset apiResult and apiError here
  // This allows region changes to preserve feedback until new form submission
};

// Expose the resetForm method to parent components
defineExpose({ resetForm });

// Clear feedback when user starts typing new content
watch(secretText, () => {
  if (secretText.value.trim() && (apiResult.value || apiError.value)) {
    // Check if this is real user input (not the asterisks from a success state)
    const isAllAsterisks = secretText.value
      .split("")
      .every((char) => char === "*");
    if (!isAllAsterisks) {
      apiResult.value = null;
      apiError.value = null;
    }
  }
});

const handleCreateLink = async () => {
  if (!secretText.value.trim() || isLoading.value) {
    return;
  }
  if (secretOptions.value.addPassphrase && !passphrase.value.trim()) {
    apiError.value = t("web.errors.passphraseRequired");
    return;
  }

  isLoading.value = true;
  // Clear previous feedback messages when submitting the form
  apiResult.value = null;
  apiError.value = null;

  const payload: any = {
    secret: secretText.value,
    ttl: secretOptions.value.ttl,
  };

  if (secretOptions.value.addPassphrase) {
    payload.passphrase = passphrase.value;
  }

  // Construct the full API endpoint URL using the provided base URL
  const apiUrl = `${props.apiBaseUrl}/api/v2/secret/conceal`;
  const headers = new Headers();
  headers.append("Content-Type", "application/json");

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ secret: payload }),
    });

    const resultData: ApiResult = await response.json();

    if (!response.ok || !resultData.success) {
      throw new Error(
        resultData.message || `API Error: ${response.statusText}`,
      );
    }

    apiResult.value = resultData;
    emit("createLink", resultData);

    // Obscure the secret text on success by replacing it with a variable number of asterisks.
    // This visually confirms success while hiding the content and obfuscating its original length.
    if (resultData.success) {
      // Store the API base URL used for this secret creation
      // This ensures URLs don't change when switching regions later
      createdWithBaseUrl.value = props.apiBaseUrl;

      // Obscure the secret text with asterisks
      const minLen = 6;
      const maxLen = 32;
      const fuzzyLen =
        Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
      secretText.value = "*".repeat(fuzzyLen);
    }
  } catch (error: any) {
    console.error("API call failed:", error);
    apiError.value =
      (error.message ||
        t("web.errors.apiGenericError") ||
        "An unexpected error occurred.") + ` (API URL: ${props.apiBaseUrl})`;
    // Emit failure result
    emit("createLink", { success: false, message: apiError.value });
  } finally {
    isLoading.value = false;
  }
};

// Store the original API base URL used when creating the secret
// This ensures the URL doesn't change when regions change
const createdWithBaseUrl = ref("");

const buildSecretUrl = (result: ApiResult): string => {
  // Get the metadata shortkey from the response
  const secretKey = result.record?.secret?.key ?? "";

  // Use the stored original base URL if available, otherwise use current base URL
  // This ensures the URL doesn't change when switching regions
  const baseUrl = (createdWithBaseUrl.value || props.apiBaseUrl).replace(
    /\/api$/,
    "",
  ); // Remove /api if present

  // Construct the secret URL
  return `${baseUrl}/secret/${secretKey}`; // Direct secret link
};

const buildReceiptUrl = (result: ApiResult): string => {
  const metadataKey = result.record?.metadata?.key ?? "";
  const baseUrl = (createdWithBaseUrl.value || props.apiBaseUrl).replace(
    /\/api$/,
    "",
  );
  return `${baseUrl}/receipt/${metadataKey}`;
};

const copyUrlToClipboard = async () => {
  if (!apiResult.value || !apiResult.value.record) return;

  const urlToCopy = buildSecretUrl(apiResult.value);
  try {
    await navigator.clipboard.writeText(urlToCopy);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000); // Reset after 2 seconds
  } catch (err) {
    console.error("Failed to copy URL: ", err);
    // Optionally, provide error feedback to the user
  }
};

// Focus the copy button when success view is shown
watch(showSuccessView, async (newValue) => {
  if (newValue) {
    // Wait for DOM to update before focusing
    await nextTick();
    // Focus the copy button for better a11y
    if (copyButtonRef.value) {
      copyButtonRef.value.focus();
    }
  }
});

// Function to reset form and create another secret
const createAnotherSecret = () => {
  resetForm();
  apiResult.value = null;
  apiError.value = null;
};
</script>

<template>
  <div class="mx-auto max-w-xl w-full px-0 xs:px-1 sm:px-0">
    <transition
      name="fade"
      mode="out-in">
      <!-- Form View -->
      <div
        v-if="showFormView"
        key="form-view">
        <!-- Text Area Input -->
        <div>
          <textarea
            v-model="secretText"
            rows="5"
            autofocus
            :aria-label="t('web.secrets.secret-label')"
            aria-describedby="secret-description"
            class="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 placeholder:text-sm text-sm disabled:opacity-50 bg-white dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600 focus-visible:outline-2 focus-visible:outline-brand-500/50 resize-y"
            :placeholder="props.placeholder || t('web.secrets.secret_placeholder')"
            :disabled="isLoading"></textarea>
          <div
            id="secret-description"
            class="sr-only">
            {{ t('web.secrets.secret-description') }}
          </div>
        </div>

        <!-- Footer bar: TTL + Passphrase indicators (left), Create Link button (right) -->
        <div
          v-if="showOptions"
          class="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-4">
            <!-- TTL popover -->
            <div ref="ttlDropdownRef" class="relative">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
                @click="toggleTtlDropdown">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                {{ currentTtlLabel }}
              </button>
              <!-- TTL popover panel -->
              <div
                v-if="showTtlDropdown"
                class="absolute bottom-full left-0 mb-2 z-50 w-52 rounded-md bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black/10 dark:ring-white/10 divide-y divide-gray-100 dark:divide-gray-700">
                <div class="py-1">
                  <button
                    v-for="option in ttlOptions"
                    :key="option.value"
                    type="button"
                    class="block w-full px-3 py-1.5 text-left text-sm transition-colors"
                    :class="secretOptions.ttl === option.value
                      ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'"
                    @click="secretOptions.ttl = option.value; showTtlDropdown = false">
                    {{ option.label }}
                  </button>
                </div>
                <div class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                  {{ t("web.secrets.ttlHint") }}
                </div>
              </div>
            </div>

            <!-- Passphrase popover -->
            <div ref="passphrasePopoverRef" class="relative">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 text-sm transition-colors"
                :class="passphrase.trim()
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-text-tertiary hover:text-text-secondary'"
                @click="togglePassphrasePopover">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                {{ t("web.secrets.passphraseInputLabel") || "Passphrase" }}
              </button>
              <!-- Passphrase popover panel -->
              <div
                v-if="showPassphrasePopover"
                class="absolute bottom-full left-0 mb-2 z-50 w-64 rounded-md bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black/10 dark:ring-white/10 divide-y divide-gray-100 dark:divide-gray-700">
                <div class="p-3">
                  <div class="relative">
                    <input
                      ref="passphraseInputRef"
                      v-model="passphrase"
                      :type="showPassphrase ? 'text' : 'password'"
                      maxlength="80"
                      autocomplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                      data-protonpass-ignore
                      class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm py-2 pl-3 pr-10 focus:border-brand-500 focus-visible:outline-brand-500"
                      :placeholder="t('web.secrets.passphrasePlaceholder') || 'Enter passphrase'"
                      :disabled="isLoading"
                      @keydown.enter="showPassphrasePopover = false" />
                    <button
                      type="button"
                      class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                      :aria-label="showPassphrase ? 'Hide passphrase' : 'Show passphrase'"
                      @click="showPassphrase = !showPassphrase">
                      <svg
                        v-if="!showPassphrase"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="size-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                      <svg
                        v-else
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="size-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    </button>
                  </div>
                  <button
                    v-if="passphrase"
                    type="button"
                    class="mt-2 text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                    @click="clearPassphrase">
                    {{ t("web.secrets.removePassphrase") || "Remove passphrase" }}
                  </button>
                </div>
                <div class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                  {{ t("web.secrets.passphraseInputHint") }}
                </div>
              </div>
            </div>
          </div>

          <!-- Create Link button -->
          <button
            type="button"
            class="inline-flex font-brand items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm text-white font-semibold shadow-sm hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-brand-400 focus-visible:outline-offset-2 disabled:opacity-50 disabled:bg-gray-400 transition-colors"
            :disabled="isLoading || !secretText.trim()"
            @click="handleCreateLink">
            <span v-if="!isLoading">{{ t("web.secrets.create_link") }}</span>
            <span v-else>{{ t("LABELS.loading") }}</span>
          </button>
        </div>

        <!-- Minimal create button when no text entered yet -->
        <div
          v-if="!showOptions"
          class="mt-4 flex justify-end">
          <button
            type="button"
            class="inline-flex font-brand items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm text-white font-semibold shadow-sm hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-brand-400 focus-visible:outline-offset-2 disabled:opacity-50 disabled:bg-gray-400 transition-colors"
            :disabled="true">
            {{ t("web.secrets.create_link") }}
          </button>
        </div>

        <!-- Error Display -->
        <div
          v-if="apiError"
          class="mt-4">
          <div
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert">
            <strong class="font-bold">{{ t("web.errors.errorTitle") }}</strong>
            <span class="block sm:inline sm:pl-2"> {{ apiError }}</span>
          </div>
        </div>
      </div>

      <!-- Success View -->
      <div
        v-else-if="showSuccessView"
        key="success-view"
        class="p-5 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800 rounded-lg shadow-md"
        role="status"
        aria-live="polite">
        <!-- Success Header with Animation -->
        <div class="mb-4 flex items-center">
          <div class="bg-green-100 dark:bg-green-900/30 rounded-full p-2 mr-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6 text-green-600 dark:text-green-400">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-800 dark:text-white">
            {{ t("web.secrets.successTitle") }}
          </h2>
          <!-- Open in New Tab Button -->
          <a
            :href="buildSecretUrl(apiResult as ApiResult)"
            target="_blank"
            rel="noopener noreferrer"
            class="ml-auto p-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 focus-visible:outline-2 focus-visible:outline-green-500 rounded"
            :title="t('web.help.open-new-tab')">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-5">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>

        <!-- Description -->
        <p class="mb-4 text-gray-700 dark:text-gray-300">
          {{ t("web.secrets.shareLinkDescription") }}
        </p>

        <!-- URL Field with Copy Button -->
        <div class="flex rounded-md shadow-sm mb-6">
          <input
            type="text"
            :value="buildSecretUrl(apiResult as ApiResult)"
            readonly
            aria-label="Secret URL"
            class="block w-full rounded-none rounded-l-md border-gray-300 dark:border-gray-600 shadow-md focus:border-green-500 focus-visible:outline-green-500 sm:text-sm bg-white text-black dark:bg-gray-700 dark:text-white p-2"
            @focus="($event.target as HTMLInputElement).select()" />
          <button
            ref="copyButtonRef"
            type="button"
            class="relative -ml-px min-w-[6rem] inline-flex items-center justify-center space-x-2 rounded-r-md shadow-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 focus:border-green-500 focus-visible:outline-1 focus-visible:outline-green-500"
            :class="{
              'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 hover:bg-green-300 dark:hover:bg-green-700':
                copySuccess,
            }"
            @click="copyUrlToClipboard">
            <span v-if="!copySuccess">{{ t("LABELS.copy") }}</span>
            <span v-else>{{ t("LABELS.copied") }}</span>
          </button>
        </div>

        <!-- Create Another Secret Button -->
        <div
          class="text-center border-t border-gray-100 dark:border-gray-700 pt-4">
          <button
            type="button"
            class="inline-flex font-brand items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            @click="createAnotherSecret">
            {{ t("web.secrets.createAnother") || "Create Another Secret" }}
          </button>
          <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {{ t("web.secrets.receiptHint") || "Your" }}
            <a
              :href="buildReceiptUrl(apiResult as ApiResult)"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors">
              {{ t("web.secrets.receiptLink") || "receipt" }}
            </a>
            {{ t("web.secrets.receiptHintSuffix") || "tracks when the secret is viewed or expires." }}
          </p>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
