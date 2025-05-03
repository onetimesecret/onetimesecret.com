<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

// Define the options model
interface SecretOptions {
  burnAfterReading: boolean;
  addPassphrase: boolean;
}

const props = withDefaults(defineProps<{
  modelValue?: SecretOptions;
}>(), {
  modelValue: () => ({ burnAfterReading: false, addPassphrase: false })
});

const emit = defineEmits<{
  'update:modelValue': [value: SecretOptions];
  'optionChanged': [option: keyof SecretOptions, value: boolean];
}>();

// Initialize i18n
const { t } = useI18n({
  inheritLocale: true,
  useScope: "global",
});

// Create reactive options that sync with props
const options = ref<SecretOptions>({
  burnAfterReading: props.modelValue?.burnAfterReading ?? false,
  addPassphrase: props.modelValue?.addPassphrase ?? false,
});

// Update options and emit events
const updateOption = (option: keyof SecretOptions, value: boolean) => {
  options.value[option] = value;
  emit('update:modelValue', { ...options.value });
  emit('optionChanged', option, value);
};
</script>

<template>
  <div class="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
    <div class="flex items-center">
      <input
        id="burn-after-reading"
        type="checkbox"
        class="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        :checked="options.burnAfterReading"
        @change="updateOption('burnAfterReading', $event.target.checked)"
      />
      <label for="burn-after-reading" class="ml-2 block text-sm text-gray-600">
        {{ t("web.secrets.burnAfterReading") || "Burn after reading" }}
      </label>
    </div>
    <div class="flex items-center">
      <input
        id="add-passphrase"
        type="checkbox"
        class="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        :checked="options.addPassphrase"
        @change="updateOption('addPassphrase', $event.target.checked)"
      />
      <label for="add-passphrase" class="ml-2 block text-sm text-gray-600">
        {{ t("web.secrets.addPassphrase") || "Add passphrase" }}
      </label>
    </div>
  </div>
</template>
