#!/usr/bin/env node

/**
 * Generate localized Markdown files from i18n JSON files
 * This script extracts content from the JSON locale files and creates static
 * Markdown files for each language, replacing Vue component i18n calls with
 * actual content.
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
 * @param {Object} translations - The loaded JSON translations object
 * @param {string} lang - Language code
 * @returns {string} - Generated Markdown content
 */
function generateAboutContent(translations, lang) {
  // Early return if translations are missing
  if (!translations || !translations.web || !translations.web.about) {
    console.warn(`Missing required translations for ${lang}`);
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
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Main function to process all locale files
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

        // Generate the about page content
        const aboutContent = generateAboutContent(translations, lang);

        if (!aboutContent) {
          console.warn(`Skipping ${lang}: Could not generate content`);
          continue;
        }

        // Create the output directory if it doesn't exist
        const outputDir = path.join(CONTENT_DIR, lang);
        ensureDirectoryExists(outputDir);

        // Write the markdown file
        fs.writeFileSync(path.join(outputDir, "about.md"), aboutContent);
        console.log(`✅ Generated ${lang}/about.md`);
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
