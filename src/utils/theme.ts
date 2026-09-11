/**
 * Available theme options for the application
 */
export const AVAILABLE_THEMES = [
  "light",
  "dark",
  // 'high-contrast',
  // 'dyslexic',
] as const;

// Define Theme type based on available themes
export type ThemeOption = (typeof AVAILABLE_THEMES)[number];

/**
 * Theme manager utility for handling theme preferences and application
 */
export const ThemeManager = {
  /**
   * Read the stored theme preference, or null when storage is unreachable.
   *
   * Every read of the stored theme goes through here. A browser that denies site
   * data throws SecurityError from the `localStorage` property itself, not just
   * from getItem, so an unguarded read escapes as an uncaught error — including
   * from inside the media-query listener in initialize(), where there is no call
   * stack to catch it.
   *
   * Returns the raw value: callers decide whether an unrecognised string counts
   * as an explicit preference.
   */
  readStoredTheme(): string | null {
    try {
      return localStorage.getItem("theme");
    } catch (error) {
      // Handle errors (localStorage might be unavailable)
      console.error("Failed to access theme preferences:", error);
      return null;
    }
  },

  /**
   * Get user's preferred theme based on local storage or system preferences
   */
  getPreferredTheme(): ThemeOption {
    if (typeof window === "undefined") {
      return "dark"; // Default for SSR
    }

    // Check for stored theme preference
    const storedTheme = this.readStoredTheme();

    if (storedTheme && AVAILABLE_THEMES.includes(storedTheme as ThemeOption)) {
      return storedTheme as ThemeOption;
    }

    // Check system preference
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    return prefersDark ? "dark" : "light";
  },

  /**
   * Set theme and persist to localStorage
   */
  setTheme(theme: ThemeOption): void {
    if (typeof window === "undefined") {
      return; // Early return for SSR
    }

    try {
      // Store in localStorage
      localStorage.setItem("theme", theme);

      // Apply to document
      this.applyTheme(theme);
    } catch (error) {
      console.error("Failed to set theme:", error);
    }
  },

  /**
   * Apply theme classes to HTML element
   */
  applyTheme(theme: ThemeOption): void {
    if (typeof document === "undefined") {
      return; // Early return for SSR
    }

    // Remove all theme classes
    AVAILABLE_THEMES.forEach((t) => {
      document.documentElement.classList.remove(t);
    });

    // Add the selected theme class
    document.documentElement.classList.add(theme);

    // Special case for dark mode (for Tailwind)
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  },

  /**
   * Initialize theme based on user preferences
   * Call this on initial page load
   */
  initialize(): void {
    if (typeof window === "undefined") {
      return; // Early return for SSR
    }

    const theme = this.getPreferredTheme();
    this.applyTheme(theme);

    // Listen for system preference changes
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (!this.readStoredTheme()) {
          // Only update if user hasn't explicitly set a theme
          this.applyTheme(e.matches ? "dark" : "light");
        }
      });
  },
};

// Export default for convenience
export default ThemeManager;
