#!/usr/bin/env node

/**
 * Generate localized Markdown files from i18n JSON files
 * This script extracts content from the JSON locale files and creates static
 * Markdown files for each language, replacing Vue component i18n calls with
 * actual content.
 *
 * Supported pages:
 * - about.md - About page with company information and FAQ
 * - security.md - Security policy and vulnerability reporting information
 *
 * Usage: pnpm i18n:markdown
 *
 * == How to extend this script ==
 *
 * To add support for a new page type:
 * 1. Create a new generator function (e.g., generateTermsContent)
 * 2. Add logic to extract needed content from translations
 * 3. Add the new generator to the main() function
 *
 * Example:
 *
 * function generateTermsContent(translations, lang) {
 *   // Extract content from translations
 *   // Return a complete markdown string
 * }
 *
 * And in main():
 * const termsContent = generateTermsContent(translations, lang);
 * if (termsContent) {
 *   fs.writeFileSync(path.join(outputDir, "terms.md"), termsContent);
 *   console.log(`✅ Generated ${lang}/terms.md`);
 * }
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const LOCALES_DIR = path.join(__dirname, "../locales");
const CONTENT_DIR = path.join(__dirname, "../content/pages");

// Variables that need replacement in the content
const REPLACEMENTS = {
  name: "Delano",
  githubLink:
    '<a href="https://github.com/onetimesecret/onetimesecret">our code remains open-source</a>',
  privacyPolicyLink: '<a href="/privacy">privacy policy</a>',
  openSourceLink:
    '<a href="https://github.com/onetimesecret/onetimesecret">open source</a>',
  // Plan-related values (these would normally be dynamically calculated)
  anonymousTtlDays: "7",
  anonymousSizeKB: "100",
  defaultTtlDays: "14",
  defaultSizeKB: "1000",
};

/**
 * Apply variable replacements to a string
 * @param {string} text - Text with placeholders like {name}
 * @param {Object} vars - Object with replacement values
 * @returns {string} - Text with replacements applied
 */
function applyReplacements(text, vars = REPLACEMENTS) {
  if (!text) return "";

  // Replace each variable in the format {name} with its value
  let result = text;
  Object.entries(vars).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, "g");
    result = result.replace(regex, value);
  });

  return result;
}

/**
 * Generate the About page content for a specific language
 * This function extracts all the about page content from the translations object
 * and formats it as a complete Markdown document with HTML content.
 *
 * @param {Object} translations - The loaded JSON translations object
 * @param {string} lang - Language code
 * @returns {string} - Generated Markdown content or null if translations are missing
 */
function generateAboutContent(translations, lang) {
  // Early return if translations are missing
  if (!translations || !translations.web || !translations.web.about) {
    console.warn(`Missing required translations for about page in ${lang}`);
    return null;
  }

  const about = translations.web.about;

  let content = `---
title: ${applyReplacements(about.title || "About Us")}
---

<article class="prose dark:prose-invert md:prose-lg lg:prose-xl">
  <h2>
    ${applyReplacements(about.title || "About Us")}
  </h2>

`;

  // Add intro paragraphs
  if (about.intro) {
    content += `  <p>
    ${applyReplacements(about.intro.paragraph1)}
  </p>

  <p>
    ${applyReplacements(about.intro.paragraph2)}
  </p>

  <p>
    ${applyReplacements(about.intro.paragraph3)}
  </p>

  <p>
    ${applyReplacements(about.intro.paragraph4)}
  </p>

  <p>
    ${applyReplacements(about.intro.feedback_hint)}
  </p>

  <p>
    ${applyReplacements(about.intro.signature)}
  </p>

  <p style="margin-left: 40%; margin-right: 40%">
    <a
      href="https://delanotes.com/"
      title="${translations["delano-mandelbaum"] || "Delano Mandelbaum"}"><img
        src="/public/etc/img/delano-g.png"
        width="95"
        height="120"
        border="0"
      /></a>
  </p>

`;
  }

  // Add FAQ section
  if (about.faq) {
    content += `  <h3>F.A.Q.</h3>

`;

    // Why use section
    if (about.faq.why_use_title && about.faq.why_use_description) {
      content += `  <h4>${applyReplacements(about.faq.why_use_title)}</h4>
  <p>
    ${applyReplacements(about.faq.why_use_description)}
  </p>

`;
    }

    // File limitation section
    if (
      about.faq.file_limitation_title &&
      about.faq.file_limitation_description
    ) {
      content += `  <h4>${applyReplacements(about.faq.file_limitation_title)}</h4>
  <p>
    ${applyReplacements(about.faq.file_limitation_description)}
  </p>

`;
    }

    // Text copy section
    if (about.faq.text_copy_title && about.faq.text_copy_description) {
      content += `  <h4>${applyReplacements(about.faq.text_copy_title)}</h4>
  <p>
    ${applyReplacements(about.faq.text_copy_description)}
  </p>

`;
    }

    // Secret retrieval section
    if (
      about.faq.secret_retrieval_title &&
      about.faq.secret_retrieval_description
    ) {
      content += `  <h4>${applyReplacements(about.faq.secret_retrieval_title)}</h4>
  <p>
    ${applyReplacements(about.faq.secret_retrieval_description)}
  </p>

`;
    }

    // Account difference section
    if (
      about.faq.account_difference_title &&
      about.faq.account_difference_description
    ) {
      content += `  <h4>${applyReplacements(about.faq.account_difference_title)}</h4>
  <p>
    ${applyReplacements(about.faq.account_difference_description)}
  </p>

`;
    }

    // Law enforcement section
    if (
      about.faq.law_enforcement_title &&
      about.faq.law_enforcement_description
    ) {
      content += `  <h4>${applyReplacements(about.faq.law_enforcement_title)}</h4>
  <p>
    ${applyReplacements(about.intro.paragraph3)}
  </p>
  <p>
    ${applyReplacements(about.faq.law_enforcement_description)}
  </p>

`;
    }

    // Trust section
    if (about.faq.trust_title && about.faq.trust_description) {
      content += `  <h4>${applyReplacements(about.faq.trust_title)}</h4>
  <p>
    ${applyReplacements(about.faq.trust_description)}
  </p>
  <ul>
`;

      // Add trust points if available
      if (about.faq.trust_points && Array.isArray(about.faq.trust_points)) {
        about.faq.trust_points.forEach((point) => {
          if (point) {
            content += `    <li>${applyReplacements(point)}</li>\n`;
          }
        });
      }

      content += `  </ul>

`;
    }

    // Passphrase section
    if (about.faq.passphrase_title && about.faq.passphrase_description) {
      content += `  <h4>${applyReplacements(about.faq.passphrase_title)}</h4>
  <p>
    ${applyReplacements(about.faq.passphrase_description)}
  </p>
  <ul>
`;

      // Add passphrase points if available
      if (
        about.faq.passphrase_points &&
        Array.isArray(about.faq.passphrase_points)
      ) {
        about.faq.passphrase_points.forEach((point) => {
          if (point) {
            content += `    <li>${applyReplacements(point)}</li>\n`;
          }
        });
      }

      content += `  </ul>
  <p>
    ${applyReplacements(about.faq.passphrase_final_note || "")}
  </p>
`;
    }
  }

  content += `</article>
`;

  return content;
}

/**
 * Ensure directory exists, creating it if necessary
 * @param {string} dir - Directory path
 */
/**
 * Ensure directory exists, creating it if necessary
 * @param {string} dir - Directory path
 */
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Process existing files that have template variables and convert them to static content
 * This function checks if files contain Vue template variables (like $t() or {{ $t() }})
 * and marks them for replacement with static content.
 *
 * Note: The actual replacement is done by the specific generator functions.
 *
 * @param {string} outputDir - The directory containing the markdown files
 * @param {Object} translations - The loaded JSON translations object
 * @param {string} lang - Language code
 */
async function processExistingFiles(outputDir, translations, lang) {
  // List of files to check for conversion from templates to static content
  const templateFiles = ['about.md', 'security.md'];

  for (const file of templateFiles) {
    const filePath = path.join(outputDir, file);

    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Check if the file contains Vue template variables
        if (content.includes('$t(') || content.includes('{{ $t(') || content.includes('v-html="$t(')) {
          console.log(`🔄 Converting template in ${lang}/${file} to static content`);

          // We'll generate a new file with static content in the next steps
          // Just making note here that it needs conversion
        }
      } catch (error) {
        console.error(`Error processing existing file ${lang}/${file}:`, error.message);
      }
    }
  }
}

/**
 * Generate the Security page content for a specific language
 * This function creates a static security.md file with all the security policy
 * content directly embedded, replacing any template variables.
 *
 * The security page includes:
 * - Security policy overview
 * - Supported versions table
 * - Vulnerability reporting instructions
 * - What to expect after reporting
 * - Resolution process and confidentiality
 *
 * @param {Object} translations - The loaded JSON translations object
 * @param {string} lang - Language code
 * @returns {string} - Generated Markdown content or null if translations are missing
 */
function generateSecurityContent(translations, lang) {
  // Check for both security keys in web.security or directly in the root translations object
  const hasSecurity = (translations?.web?.security && Object.keys(translations.web.security).length > 0) ||
                     (translations && 'security-policy' in translations);

  if (!hasSecurity) {
    console.warn(`Missing required translations for security page in ${lang}`);
    return null;
  }

  // Use web.security if available, otherwise look for top-level keys
  const security = translations.web?.security || {};
  const commonTranslations = {
    version: translations.version || "Version",
    supported: translations.supported || "Supported",
    emoji_checkmark: translations["emoji-checkmark"] || "✅",
    emoji_x: translations["emoji-x"] || "❌",
  };

  let content = `---
title: ${security["security-policy"] || "Security Policy"}
---

<article class="prose dark:prose-invert">
  <h2 class="mb-4 text-2xl font-bold dark:text-white">
    ${security["security-policy"] || "Security Policy"}
  </h2>
  <p class="mb-4 dark:text-gray-300">
    ${security["we-take-the-security-of-this-project-seriously-a"] || "We take the security of this project seriously and appreciate your efforts to responsibly disclose vulnerabilities. This document outlines our security policy and provides guidelines on how to report vulnerabilities."}
  </p>
  <h3 class="mb-2 text-xl font-semibold dark:text-white">
    ${security["supported-versions"] || "Supported Versions"}
  </h3>
  <p class="mb-4 dark:text-gray-300">
    ${security["we-provide-security-updates-for-the-following-ve"] || "We provide security updates for the following versions:"}
  </p>
  <table class="mb-4 w-full">
    <thead>
      <tr class="bg-gray-100 dark:bg-gray-700">
        <th class="p-2 text-left dark:text-white">
          ${commonTranslations.version}
        </th>
        <th class="p-2 text-left dark:text-white">
          ${commonTranslations.supported}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr class="border-b dark:border-gray-600">
        <td class="p-2 dark:text-gray-300">
          0.21.x+
        </td>
        <td class="p-2 dark:text-gray-300">
          ${commonTranslations.emoji_checkmark}
        </td>
      </tr>
      <tr class="border-b dark:border-gray-600">
        <td class="p-2 dark:text-gray-300">
          0.20.x
        </td>
        <td class="p-2 dark:text-gray-300">
          ${commonTranslations.emoji_checkmark}
        </td>
      </tr>
      <tr>
        <td class="p-2 dark:text-gray-300">
          &lt; 0.19.x
        </td>
        <td class="p-2 dark:text-gray-300">
          ${commonTranslations.emoji_x}
        </td>
      </tr>
    </tbody>
  </table>
  <p class="mb-4 dark:text-gray-300">
    ${security["if-you-are-using-an-unsupported-version-we-stron"] || "If you are using an unsupported version, we strongly recommend upgrading to a supported version to ensure you receive the latest security updates."}
  </p>
  <h3 class="mb-2 text-xl font-semibold dark:text-white">
    ${security["reporting-a-vulnerability"] || "Reporting a Vulnerability"}
  </h3>
  <p class="mb-4 dark:text-gray-300">
    ${security["if-you-discover-a-security-vulnerability-within-"] || "If you discover a security vulnerability within our project, we appreciate your help in disclosing it to us in a responsible manner."}
  </p>
  <h4 class="mb-2 text-lg font-semibold dark:text-white">
    ${security["how-to-report"] || "How to Report"}
  </h4>
  <ol class="mb-4 list-decimal pl-6 dark:text-gray-300">
    <li class="mb-2">
      <strong>${translations.web?.COMMON?.field_email || "Email"}</strong>${security["send-an-email-to"] || " : Send an email to "}
      <a href="mailto:security@onetimesecret.com?subject=Vulnerability%20Report%3A%20%5BBrief%20Description%5D">security@onetimesecret.com</a>
      ${security["with-the-subject-line-vulnerability-report-brief"] || ' with the subject line "Vulnerability Report: [Brief Description]"'}
    </li>
    <li>
      <strong>${translations.web?.LABELS?.details || "Details"}</strong>${security["include-as-much-information-as-possible-about-th"] || " : Include as much information as possible about the vulnerability. This should include:"}
      <ul class="mt-2 list-disc pl-6">
        <li>${security["a-detailed-description-of-the-vulnerability"] || "A detailed description of the vulnerability"}</li>
        <li>${security["steps-to-reproduce-the-issue"] || "Steps to reproduce the issue"}</li>
        <li>${security["any-potential-impact"] || "Any potential impact"}</li>
        <li>${security["your-contact-information-for-follow-up-questions"] || "Your contact information for follow-up questions"}</li>
      </ul>
    </li>
  </ol>
  <h4 class="mb-2 text-lg font-semibold dark:text-white">
    ${security["what-to-expect"] || "What to Expect"}
  </h4>
  <ol class="dark:text-gray-300">
    <li>
      <strong>${security["acknowledgment"] || "Acknowledgment"}</strong>${security["you-will-receive-an-acknowledgment-of-your-repor"] || " : You will receive an acknowledgment of your report within 5 business days."}
    </li>
    <li>
      <strong>${security["initial-assessment"] || "Initial Assessment"}</strong>${security["we-will-conduct-an-initial-assessment-of-the-vul"] || " : We will conduct an initial assessment of the vulnerability within 14 business days."}
    </li>
    <li>
      <strong>${security["updates"] || "Updates"}</strong>${security["you-can-expect-to-receive-updates-on-the-status-"] || " : You can expect to receive updates on the status of your report at least once every 7 days until the issue is resolved or a decision is made."}
    </li>
  </ol>
  <h4 class="mb-2 text-lg font-semibold dark:text-white">
    ${security["resolution-process"] || "Resolution Process"}
  </h4>
  <ol class="dark:text-gray-300">
    <li>
      <strong>${security["accepted-vulnerabilities"] || "Accepted Vulnerabilities"}</strong>${security["if-the-vulnerability-is-accepted-we-will-work-on"] || " : If the vulnerability is accepted, we will work on a fix and aim to release it as soon as possible. You will be notified once the fix is deployed."}
    </li>
    <li>
      <strong>${security["declined-vulnerabilities"] || "Declined Vulnerabilities"}</strong>${security["if-the-vulnerability-is-declined-we-will-provide"] || " : If the vulnerability is declined, we will provide a detailed explanation as to why it was not accepted."}
    </li>
  </ol>
  <h4 class="mb-2 text-lg font-semibold dark:text-white">
    ${security["confidentiality"] || "Confidentiality"}
  </h4>
  <p class="prose dark:text-gray-300">
    ${security["we-take-your-privacy-seriously-all-reports-will-"] || "We take your privacy seriously. All reports will be kept confidential, and we will work with you to ensure that any details of the vulnerability are not disclosed until a fix is in place."}
  </p>
  <p class="prose dark:text-gray-300">
    ${security["thank-you-for-helping-us-keep-onetime-secret-sec"] || "Thank you for helping us keep Onetime Secret secure and excellent!"}
  </p>
</article>
`;

  return content;
}

/**
 * Main function to process all locale files
 *
 * This is the entry point for the script that:
 * 1. Loads all locale JSON files from src/locales/
 * 2. Processes each language to generate static Markdown content
 * 3. Saves the generated content to src/content/pages/[lang]/
 *
 * To add support for new page types:
 * - Create a generator function for the page type
 * - Add a section in this function to call the generator and save the output
 */
async function main() {
  try {
    // Get all locale JSON files
    const localeFiles = await glob(`${LOCALES_DIR}/*.json`, { nodir: true });

    if (localeFiles.length === 0) {
      console.warn("No locale files found!");
      return;
    }

    console.log(`Found ${localeFiles.length} locale files to process...`);

    // Process each locale file
    for (const localeFile of localeFiles) {
      const lang = path.basename(localeFile, ".json");
      console.log(`Processing ${lang}...`);

      try {
        // Load the translations
        const translations = JSON.parse(fs.readFileSync(localeFile, "utf8"));

        // Create the output directory if it doesn't exist
        const outputDir = path.join(CONTENT_DIR, lang);
        ensureDirectoryExists(outputDir);

        // Check if the directories exist first, create if they don't
        ensureDirectoryExists(outputDir);

        // Check if the existing files have template variables and need conversion
        await processExistingFiles(outputDir, translations, lang);

        // === ABOUT PAGE GENERATION ===
        // Generate and save the about page content
        const aboutContent = generateAboutContent(translations, lang);
        if (aboutContent) {
          fs.writeFileSync(path.join(outputDir, "about.md"), aboutContent);
          console.log(`✅ Generated ${lang}/about.md`);
        } else {
          console.warn(`⚠️ Skipping ${lang}/about.md: Missing content`);
        }

        // === SECURITY PAGE GENERATION ===
        // Generate and save the security page content
        const securityContent = generateSecurityContent(translations, lang);
        if (securityContent) {
          fs.writeFileSync(path.join(outputDir, "security.md"), securityContent);
          console.log(`✅ Generated ${lang}/security.md`);
        } else {
          console.warn(`⚠️ Skipping ${lang}/security.md: Missing content`);
        }

        // === ADD NEW PAGE TYPES HERE ===
        // Example:
        // const termsContent = generateTermsContent(translations, lang);
        // if (termsContent) {
        //   fs.writeFileSync(path.join(outputDir, "terms.md"), termsContent);
        //   console.log(`✅ Generated ${lang}/terms.md`);
        // }

      } catch (error) {
        console.error(`Error processing ${lang}:`, error.message);
      }
    }

    console.log("Content generation complete!");
  } catch (error) {
    console.error("Generation failed:", error);
    process.exit(1);
  }
}

// Run the script
main();
