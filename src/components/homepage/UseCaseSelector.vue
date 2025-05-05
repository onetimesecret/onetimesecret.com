<script setup lang="ts">
import {
Listbox,
ListboxButton,
ListboxOption,
ListboxOptions,
} from "@headlessui/vue";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/vue/20/solid";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

interface UseCase {
  id: string;
  title: string;
  icon: string;
  description: string;
  exampleSecret: string;
  benefits: string[];
  complianceInfo: string;
  ctaText: string;
  ctaLink: string;
}

// Define use cases with their specific content
const useCases: UseCase[] = [
  {
    id: "it-professional",
    title: t("web.useCases.it.title", "IT Professional"),
    icon: "computer-desktop",
    description: t(
      "web.useCases.it.description",
      "Securely share credentials and access information with your team",
    ),
    exampleSecret:
      "Username: oracle\nPassword: tiger",
    benefits: [
      t(
        "web.useCases.it.benefits.1",
        "Prevent credential leaks in email and chat logs",
      ),
      t("web.useCases.it.benefits.2", "Audit when secrets are accessed"),
      t(
        "web.useCases.it.benefits.3",
        "Enforce security protocols for sensitive information",
      ),
    ],
    complianceInfo: t(
      "web.useCases.it.compliance",
      "Helps meet SOC 2 and ISO 27001 security requirements for access control",
    ),
    ctaText: t("web.useCases.it.cta", "Secure Your Credentials"),
    ctaLink: "/create",
  },
  {
    id: "developer",
    title: t("web.useCases.developer.title", "Developer"),
    icon: "code-bracket",
    description: t(
      "web.useCases.developer.description",
      "Share API keys and credentials securely during development",
    ),
    exampleSecret:
      "API_KEY=sk_test_EXAMPLE_KEY\nAPI_SECRET=5Up0rS3kRu7",
    benefits: [
      t(
        "web.useCases.developer.benefits.1",
        "Keep API keys and tokens out of code repositories",
      ),
      t(
        "web.useCases.developer.benefits.2",
        "Securely onboard new team members with access credentials",
      ),
      t(
        "web.useCases.developer.benefits.3",
        "Share database connection strings without compromising security",
      ),
    ],
    complianceInfo: t(
      "web.useCases.developer.compliance",
      "Helps enforce security best practices for CI/CD pipelines and infrastructure access",
    ),
    ctaText: t("web.useCases.developer.cta", "Secure Your API Keys"),
    ctaLink: "/create",
  },
  {
    id: "hr-manager",
    title: t("web.useCases.hr.title", "HR Manager"),
    icon: "user-group",
    description: t(
      "web.useCases.hr.description",
      "Securely share sensitive employee information and credentials",
    ),
    exampleSecret:
      "New hire portal: https://onboarding.example.com\nTemp access code: 78532169",
    benefits: [
      t(
        "web.useCases.hr.benefits.1",
        "Safely transmit onboarding credentials to new employees",
      ),
      t(
        "web.useCases.hr.benefits.2",
        "Share confidential information with one-time access",
      ),
      t(
        "web.useCases.hr.benefits.3",
        "Maintain privacy for sensitive HR communications",
      ),
    ],
    complianceInfo: t(
      "web.useCases.hr.compliance",
      "Helps meet GDPR and other privacy regulations for handling personal data",
    ),
    ctaText: t("web.useCases.hr.cta", "Secure HR Communications"),
    ctaLink: "/create",
  },
  {
    id: "legal-team",
    title: t("web.useCases.legal.title", "Legal Team"),
    icon: "scale",
    description: t(
      "web.useCases.legal.description",
      "Share confidential legal documents and information securely",
    ),
    exampleSecret:
      "Case file access: https://legal.example.com/cases/2025-05-04\nAccess code: LGT-7721-CONF",
    benefits: [
      t(
        "web.useCases.legal.benefits.1",
        "Maintain attorney-client privilege in digital communications",
      ),
      t(
        "web.useCases.legal.benefits.2",
        "Securely share case-sensitive information with clients",
      ),
      t(
        "web.useCases.legal.benefits.3",
        "Control access to confidential settlement terms",
      ),
    ],
    complianceInfo: t(
      "web.useCases.legal.compliance",
      "Helps ensure confidentiality required by legal ethics rules and client confidentiality agreements",
    ),
    ctaText: t("web.useCases.legal.cta", "Secure Legal Communications"),
    ctaLink: "/create",
  },
];

// State for selected use case
const selectedUseCase = ref(useCases[0]);
</script>

<template>
  <section class="py-12 bg-gray-50 rounded-xl shadow-sm mx-auto max-w-7xl">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:max-w-5xl lg:px-8">
      <h2 class="text-3xl font-bold text-center text-gray-900 mb-8">
        {{ t("web.useCases.sectionTitle", "How can we help you?") }}
      </h2>

      <p class="text-center text-lg text-gray-600 mb-8">
        {{
          t(
            "web.useCases.sectionSubtitle",
            "Select your role to see how Onetime Secret can address your specific needs",
          )
        }}
      </p>

      <!-- Role Selector -->
      <div class="relative w-full max-w-md mx-auto mb-12">
        <Listbox v-model="selectedUseCase">
          <div class="relative">
            <ListboxButton
              class="
                relative w-full cursor-default rounded-lg bg-white py-3 pl-4 pr-10
                text-left border border-gray-300 shadow-sm
                focus:outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-300
                text-base">
              <span class="block truncate font-medium text-slate-800">
                {{ selectedUseCase.title }}
              </span>
              <span
                class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronUpDownIcon
                  class="h-5 w-5 text-gray-400"
                  aria-hidden="true" />
              </span>
            </ListboxButton>

            <transition
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0">
              <ListboxOptions
                class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                <ListboxOption
                  v-for="useCase in useCases"
                  :key="useCase.id"
                  :value="useCase"
                  v-slot="{ active, selected }"
                  as="template">
                  <li
                    :class="[
                      active ? 'bg-brand-100 text-brand-900' : 'text-gray-900',
                      'relative cursor-default select-none py-3 pl-10 pr-4',
                    ]">
                    <span
                      :class="[
                        selected ? 'font-medium' : 'font-normal',
                        'block truncate',
                      ]">
                      {{ useCase.title }}
                    </span>
                    <span
                      v-if="selected"
                      class="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-600">
                      <CheckIcon
                        class="h-5 w-5"
                        aria-hidden="true" />
                    </span>
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </transition>
          </div>
        </Listbox>
      </div>

      <!-- Dynamic Content Based on Selection -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left Column: Example & Benefits -->
        <div class="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <h3 class="text-xl font-semibold text-gray-900 mb-4">
            {{ selectedUseCase.description }}
          </h3>

          <!-- Example Secret -->
          <div class="mb-6">
            <h4
              class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
              {{ t("web.useCases.exampleSecret", "Example Secret") }}
            </h4>
            <div
              class="bg-gray-50 rounded-md p-4 font-mono text-sm text-gray-800 whitespace-pre-line">
              {{ selectedUseCase.exampleSecret }}
            </div>
          </div>

          <!-- Benefits -->
          <div>
            <h4
              class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
              {{ t("web.useCases.keyBenefits", "Key Benefits") }}
            </h4>
            <ul class="space-y-2">
              <li
                v-for="(benefit, index) in selectedUseCase.benefits"
                :key="index"
                class="flex items-start">
                <span class="flex-shrink-0 h-5 w-5 text-brand-500 mr-2">
                  <CheckIcon class="h-5 w-5" />
                </span>
                <span class="text-gray-700">{{ benefit }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Right Column: Compliance & CTA -->
        <div
          class="bg-gradient-to-br from-brand-50 to-brand-100 rounded-lg shadow-md p-6 border border-brand-200 flex flex-col">
          <!-- Compliance Info -->
          <div class="mb-8">
            <h4
              class="text-sm font-medium text-brand-600 uppercase tracking-wider mb-2">
              {{ t("web.useCases.complianceInfo", "Compliance Information") }}
            </h4>
            <p class="text-gray-700">
              {{ selectedUseCase.complianceInfo }}
            </p>
          </div>

          <!-- CTA -->
          <div class="mt-auto">
            <a
              :href="selectedUseCase.ctaLink"
              class="block w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 px-4 rounded-md text-center transition-colors duration-150 ease-in-out">
              {{ selectedUseCase.ctaText }}
            </a>
            <p class="text-xs text-center text-gray-500 mt-3">
              {{
                t(
                  "web.useCases.privacyNote",
                  "Your secrets are encrypted, never stored in logs, and automatically deleted after viewing.",
                )
              }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
