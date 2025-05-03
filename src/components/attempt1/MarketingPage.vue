<script setup lang="ts">
import Header from "./Header.vue";
import Hero from "./Hero.vue";

/**
 * Marketing Page layout combining Header and Hero components
 * Used for landing pages and other marketing content
 * Supports dark mode and includes accessibility enhancements
 */
defineProps({
  // Navigation props
  navigation: {
    type: Array,
    default: () => [
      { name: "Product", href: "#" },
      { name: "Features", href: "#" },
      { name: "Marketplace", href: "#" },
      { name: "Company", href: "#" },
    ],
  },
  logoSrc: {
    type: String,
    default:
      "https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600",
  },
  logoAlt: {
    type: String,
    default: "Onetime Secret",
  },

  // Hero props
  headline: {
    type: String,
    default: "Share sensitive information securely",
  },
  description: {
    type: String,
    default:
      "Generate links to secret messages that can only be viewed once. Perfect for sending passwords, API keys, or sensitive information that shouldn't be stored in email or chat logs.",
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
    default:
      "https://images.unsplash.com/photo-1483389127117-b6a2102724ae?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1587&q=80",
  },
  bannerText: {
    type: String,
    default: "Now with unlimited fortune telling.",
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

  <div class="bg-white dark:bg-gray-900">
     <Header
      :navigation="navigation"
      :logoSrc="logoSrc"
      :logoAlt="logoAlt"
    /> <Hero
      :headline="headline"
      :description="description"
      :primaryButtonText="primaryButtonText"
      :primaryButtonLink="primaryButtonLink"
      :secondaryButtonText="secondaryButtonText"
      :secondaryButtonLink="secondaryButtonLink"
      :imageUrl="imageUrl"
      :bannerText="bannerText"
      :bannerLinkText="bannerLinkText"
      :bannerLinkUrl="bannerLinkUrl"
      :showBanner="showBanner"
    />
  </div>

</template>
