<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

// Define the options model
interface SecretOptions {
  expirationTime: boolean;
  addPassphrase: boolean;
}

const props = withDefaults(defineProps<{
  modelValue?: SecretOptions;
}>(), {
  modelValue: () => ({ expirationTime: false, addPassphrase: false })
});

const emit = defineEmits<{
  'update:modelValue': [value: SecretOptions];
}>();

// Initialize i18n
const { t } = useI18n({
  inheritLocale: true,
  useScope: "global",
});

// Create reactive options that sync with props
const options = ref<SecretOptions>({
  expirationTime: props.modelValue?.expirationTime ?? false,
  addPassphrase: props.modelValue?.addPassphrase ?? false,
});

// Update options and emit events
const updateOption = (option: keyof SecretOptions, value: boolean) => {
  options.value[option] = value;
  emit('update:modelValue', { ...options.value });
};
</script>

<template>
  <div class="bg-gray-50 rounded-md p-3">
    <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{{ t("web.secrets.optionsHeading") || "Secret Options" }}</h3>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm text-gray-600">
    <div class="flex items-center">
      <input
        id="burn-after-reading"
        type="checkbox"
        class="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        :checked="options.expirationTime"
        @change="updateOption('expirationTime', $event.target.checked)"
      />
      <label for="burn-after-reading" class="ml-2 block text-sm text-gray-600">
        {{ t("web.secrets.expirationTime") || "Burn after reading" }}
      </label>
    </div>
    <div class="flex items-center">
      <input
        id="add-passphrase"
        type="checkbox"
        class="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        :checked="options.addPassphrase"
        @change="updateOption('addPassphrase', $event.target.checked)">
      <label for="add-passphrase" class="ml-2 block text-sm text-gray-600">
        {{ t("web.secrets.addPassphrase") || "Add passphrase" }}
      </label>
    </div>
    </div>
  </div>
</template>
