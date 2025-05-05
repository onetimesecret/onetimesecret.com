<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

// Define the options model
interface SecretOptions {
  expirationTime: boolean;
  addPassphrase: boolean;
}

// API Response interface
export interface ApiResult { // Export the interface
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
  message?: string;
  details?: {
    kind?: string;
    recipient?: any[];
    recipient_safe?: any[];
  };
}

interface Props {
  placeholder?: string;
  apiBaseUrl?: string;
  withOptions?: boolean;
}

const props = withDefaults(
  defineProps<Props>(),
  {
    placeholder: "",
    apiBaseUrl: "https://dev.onetime.dev/api",
    withOptions: false,
  },
);

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
  return props.withOptions && !isTyping.value && secretText.value.trim().length > 0;
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
    apiError.value =
      t("web.errors.passphraseRequired") ||
      "Passphrase is required when the option is selected.";
    return;
  }

  isLoading.value = true;
  apiResult.value = null;
  apiError.value = null;

  const payload: any = {
    secret: secretText.value,
    ttl: secretOptions.value.expirationTime ? 0 : 604800,
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
  } catch (error: any) {
    console.error("API call failed:", error);
    apiError.value =
      error.message ||
      t("web.errors.apiGenericError") ||
      "An unexpected error occurred.";
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
        :disabled="isLoading"></textarea>

      <div class="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
        <button
          type="button"
          class="inline-flex items-center rounded-md border border-transparent bg-brand-500 px-3 py-2 m-1 text-sm font-medium text-white font-semibold shadow-sm hover:bg-brand-600 focus:outline-none disabled:opacity-50"
          @click="handleCreateLink"
          :disabled="isLoading || !secretText.trim()">
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

    <!-- API Result/Error Display -->
    <div class="mt-4 mb-10 min-h-[4rem]">
      <div
        v-if="isLoading"
        class="text-center text-gray-500">
        {{ t("web.general.processing") || "Processing..." }}
      </div>
      <div
        v-else-if="apiError"
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert">
        <strong class="font-bold">{{
          t("web.errors.errorTitle") || "Error!"
        }}</strong>
        <span class="block sm:inline"> {{ apiError }}</span>
      </div>
      <div
        v-else-if="apiResult?.success && apiResult.record"
        class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
        <strong class="font-bold">{{
          t("web.secrets.successTitle") || "Success!"
        }}</strong>
        <p class="text-sm">
          {{ t("web.secrets.shareLinkDescription") || "Share this link:" }}
        </p>
        <input
          type="text"
          :value="buildSecretUrl(apiResult)"
          readonly
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm bg-white p-2"
          @focus="($event.target as HTMLInputElement).select()" />
      </div>
    </div>
  </div>
</template>
