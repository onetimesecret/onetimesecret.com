/**
 * Dark mode utility function for toggling the theme.
 */

// Constants
const STORAGE_KEY = "darkMode";
const DARK_CLASS = "dark";
const TRANSITION_CLASS = "transitioning"; // Keep for smooth transitions if desired
const TRANSITION_DURATION = 200; // Match CSS

/**
 * Toggles dark mode on/off, updates localStorage, and handles transitions.
 * @returns {boolean} The new state (true if dark mode is enabled).
 */
export function toggleDarkMode(): boolean {
  const htmlElement = document.documentElement;

  // Apply transition class
  htmlElement.classList.add(TRANSITION_CLASS);

  // Determine the new state
  const isDark = !htmlElement.classList.contains(DARK_CLASS);

  // Toggle the class
  htmlElement.classList.toggle(DARK_CLASS, isDark);

  // Store preference
  try {
    localStorage.setItem(STORAGE_KEY, String(isDark));
  } catch (e) {
    console.error("Failed to save dark mode preference:", e);
  }

  // Remove transition class after animation completes
  // Use requestAnimationFrame for potentially smoother timing
  requestAnimationFrame(() => {
    setTimeout(() => {
      htmlElement.classList.remove(TRANSITION_CLASS);
    }, TRANSITION_DURATION);
  });

  // Update color-scheme meta tag if it exists
  const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  if (colorSchemeMeta) {
    colorSchemeMeta.setAttribute(
      "content",
      isDark ? "dark light" : "light dark",
    );
  }

  return isDark;
}
