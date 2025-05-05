<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

// Define the options model
interface SecretOptions {
  expirationTime: boolean;
  addPassphrase: boolean;
}

const props = withDefaults(defineProps<{ // Use withDefaults
  placeholder?: string;
}>(), {
  placeholder: '', // Provide a default value
});

const emit = defineEmits<{
  createLink: [secretText: string, options: SecretOptions]; // Use imported type
}>();

// Initialize i18n
const { t } = useI18n({
  inheritLocale: true,
  useScope: "global",
});

// Secret text state
const secretText = ref("");

// Secret options state
const secretOptions = ref<SecretOptions>({ // Use imported type
  expirationTime: false,
  addPassphrase: false,
});

// Update options and emit events (from SecretOptions.vue logic)
const updateOption = (option: keyof SecretOptions, value: boolean) => {
  secretOptions.value[option] = value;
  // No need to emit update:modelValue here, it's internal state now
};

// Handle create link button click
const handleCreateLink = () => {
  if (secretText.value.trim()) {
    emit("createLink", secretText.value, secretOptions.value);
  }
};
</script>

<template>
  <div class="mt-8 mx-auto max-w-xl">
    <!-- Text Area Input (from SecretInput.vue) -->
    <div class="relative">
      <textarea
        v-model="secretText"
        rows="3"
        class="block w-full rounded-md border-0 py-3 pl-4 pr-16 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-500 sm:text-sm"
        :placeholder="props.placeholder || t('web.secrets.secretPlaceholder')"
      ></textarea>

      <div class="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
        <button
          type="button"
          class="inline-flex items-center rounded-md border border-transparent bg-brand-500 px-3 py-2 m-1 text-sm font-medium text-white shadow-sm hover:bg-brand-600 focus:outline-none"
          @click="handleCreateLink"
        >
          {{ t("web.secrets.createLink") || "Create Link" }}
        </button>
      </div>
    </div>

    <!-- Secret Options (from SecretOptions.vue) -->
    <div class="mt-3 mb-10">
       <div class="bg-gray-50 rounded-md p-3">
        <h3
          class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          {{ t("web.secrets.optionsHeading") || "Secret Options" }}
        </h3>
        <div
          class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm text-gray-600">
          <div class="flex items-center">
            <input
              id="burn-after-reading"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              :checked="secretOptions.expirationTime"
              @change="updateOption('expirationTime', ($event.target as HTMLInputElement).checked)" />
            <label
              for="burn-after-reading"
              class="ml-2 block text-sm text-gray-600">
              {{ t("web.secrets.expirationTime") || "Burn after reading" }}
            </label>
          </div>
          <div class="flex items-center">
            <input
              id="add-passphrase"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              :checked="secretOptions.addPassphrase"
              @change="updateOption('addPassphrase', ($event.target as HTMLInputElement).checked)" />
            <label
              for="add-passphrase"
              class="ml-2 block text-sm text-gray-600">
              {{ t("web.secrets.addPassphrase") || "Add passphrase" }}
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
