<script setup>
import MarketingPage from './MarketingPage.vue';

/**
 * MarketingLayout component
 * This component is a wrapper for MarketingPage to maintain backward compatibility with existing code
 * Simply forwards all props to the MarketingPage component
 */
defineProps({
  navigation: {
    type: Array,
    default: () => []
  },
  logoSrc: {
    type: String,
    default: "https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
  },
  logoAlt: {
    type: String,
    default: "One Time Secret"
  },
  headline: {
    type: String,
    default: "Share sensitive information securely",
  },
  description: {
    type: String,
    default: "Generate links to secret messages that can only be viewed once. Perfect for sending passwords, API keys, or sensitive information that shouldn't be stored in email or chat logs.",
  },
  primaryButtonText: {
    type: String,
    default: "Create a secret",
  },
  primaryButtonLink: {
    type: String,
    default: "/create",
  },
  secondaryButtonText: {
    type: String,
    default: "How it works",
  },
  secondaryButtonLink: {
    type: String,
    default: "#how-it-works",
  },
  imageUrl: {
    type: String,
    default: "https://images.unsplash.com/photo-1483389127117-b6a2102724ae?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1587&q=80",
  },
  bannerText: {
    type: String,
    default: "Now with end-to-end encryption and metadata protection.",
  },
  bannerLinkText: {
    type: String,
    default: "Learn about our security",
  },
  bannerLinkUrl: {
    type: String,
    default: "#security",
  },
  showBanner: {
    type: Boolean,
    default: true,
  },
});
</script>

<template>
  <MarketingPage v-bind="$props" />
</template>
