<!-- src/components/vue/forms/SecretForm.vue -->

<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";

// Define the options model
interface SecretOptions {
  expirationTime: boolean;
  addPassphrase: boolean;
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
  expirationTime: false,
});
const passphrase = ref("");
const isLoading = ref(false);
const apiResult = ref<ApiResult | null>(null);
const apiError = ref<string | null>(null);
const copySuccess = ref(false); // State for copy feedback
const copyButtonRef = ref<HTMLButtonElement | null>(null);
const secretTextArea = ref<HTMLTextAreaElement | null>(null);

// Function to focus the textarea
const focusTextArea = () => {
  if (secretTextArea.value && showFormView.value) {
    secretTextArea.value.focus();
  }
};


// --- Computed ---
const showPassphraseInput = computed(() => secretOptions.value.addPassphrase);
const showSuccessView = computed(
  () => apiResult.value?.success && apiResult.value.record,
);
const showFormView = computed(() => !showSuccessView.value);

// --- Methods ---
// Method to reset the form while preserving feedback until next submission
const resetForm = () => {
  // Reset the form inputs and options
  secretText.value = "";
  secretOptions.value = {
    expirationTime: false,
    addPassphrase: false,
  };
  passphrase.value = "";
  isLoading.value = false;
  copySuccess.value = false;
  // We intentionally don't reset apiResult and apiError here
  // This allows region changes to preserve feedback until new form submission
};

// Expose the resetForm method to parent components
defineExpose({ resetForm });

const updateOption = (option: keyof SecretOptions, value: boolean) => {
  secretOptions.value[option] = value;
  if (option === "addPassphrase" && !value) {
    passphrase.value = "";
  }
};
const isTyping = ref(false);
const typingTimerId = ref<number | null>(null);

const showOptions = computed(() => {
  return (
    props.withOptions && !isTyping.value && secretText.value.trim().length > 0
  );
});

watch(secretText, () => {
  // Set typing state to true immediately
  isTyping.value = true;

  // If user starts typing again after a success or error, reset for a new submission
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

  // Clear any existing timer
  if (typingTimerId.value !== null) {
    clearTimeout(typingTimerId.value);
  }

  // Set a new timer to turn off the typing state after 600ms of inactivity
  typingTimerId.value = window.setTimeout(() => {
    isTyping.value = false;
    typingTimerId.value = null;
  }, 600);
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
    ttl: secretOptions.value.expirationTime ? 0 : 604800, // 7 days
    passphrase: null,
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
      mode="out-in"
      @after-enter="focusTextArea">
      <!-- Form View -->
      <div
        v-if="showFormView"
        key="form-view"
        @click="focusTextArea">
        <!-- Text Area Input -->
        <div class="relative">
          <textarea
            v-model="secretText"
            ref="secretTextArea"
            rows="6"
            autofocus
            @focus="focusTextArea"
            :aria-label="t('web.secrets.secret-label')"
            aria-describedby="secret-description"
            class="block w-full rounded-md border-0 py-2 sm:py-3 pl-3 xs:pl-4 pr-28 xs:pr-32 sm:pr-36 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 placeholder:text-sm text-sm disabled:opacity-50 bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50"
            :placeholder="
              props.placeholder || t('web.secrets.secret_placeholder')"
            :disabled="isLoading"></textarea>
          <div id="secret-description" class="sr-only">
            {{ t('web.secrets.secret-description') }}
          </div>

          <div class="absolute inset-y-0 right-0 flex py-1.5 pr-1.5 z-10">
            <button
              type="button"
              class="inline-flex font-brand items-center justify-center min-w-[4rem] xs:min-w-[5rem] sm:min-w-[7rem] rounded-md border border-transparent bg-brand-500 px-1 xs:px-2 sm:px-3 py-1 sm:py-2 m-1 text-base xs:text-sm text-white font-semibold shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 disabled:opacity-50 disabled:bg-gray-400"
              :disabled="isLoading || !secretText.trim()"
              @click="handleCreateLink">
              <span v-if="!isLoading">
                <span class="hidden sm:inline">{{t("web.secrets.create_link")}}</span>
                <span class="sm:hidden inline">{{t("LABELS.create")}}</span>
              </span>
              <span v-else>{{ t("LABELS.loading") }}</span>
            </button>
          </div>
        </div>

        <!-- Secret Options -->
        <div
          v-if="showOptions"
          class="mt-3 mb-4">
          <div class="bg-gray-50 rounded-md p-3">
            <h3
              class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {{ t("web.secrets.optionsHeading") || "Secret Options" }}
            </h3>
            <div
              class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm text-gray-600">
              <!-- Expiration Time Option -->
              <div class="flex items-center">
                <input
                  id="burn-after-reading"
                  type="checkbox"
                  class="size-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 disabled:opacity-50"
                  :checked="secretOptions.expirationTime"
                  @change="
                    updateOption(
                      'expirationTime',
                      ($event.target as HTMLInputElement).checked,
                    )
                  "
                  :disabled="isLoading" />
                <label
                  for="burn-after-reading"
                  class="ml-2 block text-sm text-gray-600">
                  {{ t("web.secrets.expirationTime") || "Burn after reading" }}
                </label>
              </div>
              <!-- Add Passphrase Option -->
              <div class="flex items-center">
                <input
                  id="add-passphrase"
                  type="checkbox"
                  class="size-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 disabled:opacity-50"
                  :checked="secretOptions.addPassphrase"
                  @change="
                    updateOption(
                      'addPassphrase',
                      ($event.target as HTMLInputElement).checked,
                    )
                  "
                  :disabled="isLoading" />
                <label
                  for="add-passphrase"
                  class="ml-2 block text-sm text-gray-600">
                  {{ t("web.secrets.addPassphrase") || "Add passphrase" }}
                </label>
              </div>
            </div>
            <!-- Passphrase Input (Conditional) -->
            <div
              v-if="showPassphraseInput"
              class="mt-3">
              <label
                for="passphrase-input"
                class="block text-sm font-medium text-gray-700">
                {{ t("web.secrets.passphraseLabel") || "Passphrase" }}
              </label>
              <input
                type="password"
                id="passphrase-input"
                v-model="passphrase"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm disabled:opacity-50"
                :placeholder="
                  t('web.secrets.passphrasePlaceholder') || 'Enter passphrase'
                "
                :disabled="isLoading" />
            </div>
          </div>
        </div>

        <!-- Error Display -->
        <div
          v-if="apiError"
          class="mt-4 mb-10">
          <div
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert">
            <strong class="font-bold">{{ t("web.errors.errorTitle") }}</strong>
            <span class="block sm:inline sm:pl-2"> {{ apiError }}</span>
          </div>
        </div>

        <!-- Loading Indicator -->
        <div
          v-if="isLoading"
          class="mt-4 mb-10 text-center text-gray-500">
          {{ t("LABELS.processing") }}...
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
            class="ml-auto p-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
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
            class="block w-full rounded-none rounded-l-md border-gray-300 dark:border-gray-600 shadow-md focus:border-green-500 focus:ring-green-500 sm:text-sm bg-white text-black dark:bg-gray-700 dark:text-white p-2"
            @focus="($event.target as HTMLInputElement).select()" />
          <button
            ref="copyButtonRef"
            @click="copyUrlToClipboard"
            type="button"
            class="relative -ml-px min-w-[6rem] inline-flex items-center justify-center space-x-2 rounded-r-md shadow-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            :class="{
              'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 hover:bg-green-300 dark:hover:bg-green-700':
                copySuccess,
            }">
            <span v-if="!copySuccess">{{ t("LABELS.copy") }}</span>
            <span v-else>{{ t("LABELS.copied") }}</span>
          </button>
        </div>

        <!-- Create Another Secret Button -->
        <div
          class="text-center border-t border-gray-100 dark:border-gray-700 pt-4">
          <button
            @click="createAnotherSecret"
            type="button"
            class="inline-flex font-brand items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">
            {{ t("web.secrets.createAnother") || "Create Another Secret" }}
          </button>
          <!-- Region hint message -->
          <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {{
              t("web.secrets.regionSwitchHint") ||
              "Try creating secrets in different regions for your various needs."
            }}
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
