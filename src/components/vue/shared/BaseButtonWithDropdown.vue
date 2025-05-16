<!-- src/components/vue/shared/BaseButtonWithDropdown.vue -->

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import { ChevronDownIcon } from "@heroicons/vue/20/solid";

// Define props with defaults
const props = withDefaults(
  defineProps<{
    buttonText?: string;
    items?: Array;
  }>(),
  {
    buttonText: "Actions", // Default button text
    items: () => [], // Default to an empty array
  },
);

// Define emits
const emit = defineEmits(["item-click"]);

// Handle item click
function handleItemClick(item) {
  if (item.action) {
    item.action(); // Execute action if provided
  }
  emit("item-click", item); // Emit event with the clicked item
}
</script>

<template>
  <div class="inline-flex rounded-md shadow-xs">
    <button
      type="button"
      class="relative inline-flex font-brand items-center rounded-l-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-10">
      {{ props.buttonText }}
    </button>
    <Menu
      as="div"
      class="relative -ml-px block">
      <MenuButton
        class="relative inline-flex items-center rounded-r-md bg-white px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-10">
        <span class="sr-only">Open options</span>
        <ChevronDownIcon
          class="size-5"
          aria-hidden="true" />
      </MenuButton>
      <transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95">
        <MenuItems
          class="absolute right-0 z-10 mt-2 -mr-1 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-hidden">
          <div class="py-1">
            <MenuItem
              v-for="item in props.items"
              :key="item.name"
              v-slot="{ active }">
              <a
                :href="item.href || '#'"
                :class="[
                  active
                    ? 'bg-gray-100 text-gray-900 outline-hidden'
                    : 'text-gray-700',
                  'block px-4 py-2 text-sm',
                ]"
                @click.prevent="handleItemClick(item)">
                {{ item.name }}
              </a>
            </MenuItem>
          </div>
        </MenuItems>
      </transition>
    </Menu>
  </div>
</template>
