<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import HomepageAttempt1 from "./attempt1/Homepage.vue";
import HomepageAttempt3 from "./attempt3/Homepage.vue";

// Ref to store the version determined on the client
const version = ref("1"); // Default version

// This code runs only in the browser after the component mounts
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const paramVersion = urlParams.get("version");
  if (paramVersion === "3") {
    version.value = "3";
  } else {
    version.value = "1"; // Default to '1' if param is missing or invalid
  }
});

// Dynamically compute which component to render
const ActiveComponent = computed(() => {
  return version.value === "3" ? HomepageAttempt3 : HomepageAttempt1;
});
</script>

<template>
  <!-- Render the selected component -->
  <component :is="ActiveComponent" />
</template>
