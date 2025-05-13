<!-- src/components/shared/BaseSecretFormLite.vue -->

<script setup lang="ts">
import { computed, ref, watch } from "vue";
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
  expirationTime: false,
  addPassphrase: false,
});
const passphrase = ref("");
const isLoading = ref(false);
const apiResult = ref<ApiResult | null>(null);
const apiError = ref<string | null>(null);
const copySuccess = ref(false); // State for copy feedback

// --- Computed ---
const showPassphraseInput = computed(() => secretOptions.value.addPassphrase);

// --- Methods ---
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
  if (!props.withOptions) return;

  // Set typing state to true immediately
  isTyping.value = true;

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
  console.log('apiUrl', apiUrl, props.apiBaseUrl, import.meta.env.PUBLIC_API_URL)

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
      const minLen = 6;
      const maxLen = 32;
      const fuzzyLen = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
      secretText.value = "*".repeat(fuzzyLen);
    }

  } catch (error: any) {
    console.error("API call failed:", error);
    apiError.value =
      (error.message ||
      t("web.errors.apiGenericError") ||
      "An unexpected error occurred.") +
      ` (API URL: ${props.apiBaseUrl})`;
    // Emit failure result
    emit("createLink", { success: false, message: apiError.value });
  } finally {
    isLoading.value = false;
  }
};

const buildSecretUrl = (result: ApiResult): string => {
  // Get the metadata shortkey from the response
  // const metadataKey = result.record?.metadata?.key ?? ""; // Use metadata key for receipt link
  const secretKey = result.record?.secret?.key ?? ""; // Use secret key for direct secret link

  // Build the base URL - use the provided apiBaseUrl prop which should exclude /api
  const baseUrl = props.apiBaseUrl.replace(/\/api$/, ""); // Remove /api if present

  // Construct the secret URL
  // return `${baseUrl}/receipt/${metadataKey}`; // Receipt link
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
</script>

<template>
  <div class="mx-auto max-w-xl">
    <!-- Text Area Input -->
    <div class="relative">
      <textarea
        v-model="secretText"
        rows="3"
        class="block w-full rounded-md border-0 py-3 pl-4 pr-16 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-500 sm:text-sm disabled:opacity-50"
        :placeholder="props.placeholder || t('web.secrets.secretPlaceholder')"
        :disabled="isLoading || apiResult?.success"></textarea>

      <div class="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
        <button
          type="button"
          class="inline-flex font-brand items-center justify-center min-w-[7rem] rounded-md border border-transparent bg-brand-500 px-3 py-2 m-1 text-base font-medium text-white font-semibold shadow-sm hover:bg-brand-600 focus:outline-none disabled:opacity-50 disabled:bg-gray-400"
          :disabled="isLoading || !secretText.trim() || apiResult?.success"
          @click="handleCreateLink">
          <span v-if="!isLoading">{{
            t("web.secrets.createLink") || "Create Link"
          }}</span>
          <span v-else>{{ t("web.general.loading") || "Loading..." }}</span>
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
              :disabled="isLoading || apiResult?.success" />
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
              :disabled="isLoading || apiResult?.success" />
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
            :disabled="isLoading || apiResult?.success" />
        </div>
      </div>
    </div>

    <!-- API Result/Error Display -->
    <div class="mt-4 mb-10 min-h-[4rem]">
      <div
        v-if="isLoading"
        class="text-center text-gray-500">
        {{ t("LABELS.processing") }}...
      </div>
      <div
        v-else-if="apiError"
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert">
        <strong class="font-bold">{{
          t("web.errors.errorTitle")
        }}</strong>
        <span class="block sm:inline sm:pl-2"> {{ apiError }}</span>
      </div>
      <div
        v-else-if="apiResult?.success && apiResult.record"
        class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
        <!-- Open in New Tab Icon Button -->
        <a
          :href="buildSecretUrl(apiResult)"
          target="_blank"
          rel="noopener noreferrer"
          type="button"
          class="absolute top-2 right-2 p-1 text-green-600 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
          :title="t('web.actions.openNewTab') || 'Open in new tab'">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
        <strong class="font-bold block mb-1">{{ t("web.secrets.successTitle") }}</strong>
        <p class="text-sm pr-8">
          {{ t("web.secrets.shareLinkDescription") }}
        </p>
        <div class="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            :value="buildSecretUrl(apiResult)"
            readonly
            class="block w-full rounded-none rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm bg-white p-2"
            @focus="($event.target as HTMLInputElement).select()" />
          <button
            @click="copyUrlToClipboard"
            type="button"
            class="relative -ml-px min-w-[6rem] inline-flex items-center justify-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            :class="{
              'bg-green-200 text-green-800 hover:bg-green-300': copySuccess,
            }">
            <span v-if="!copySuccess">{{
              t("LABELS.copy")
            }}</span>
            <span v-else>{{ t("LABELS.copied") }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
