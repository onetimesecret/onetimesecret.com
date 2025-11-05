/**
 * Global type definitions for Onetime Secret
 */

// Theme types
export type Theme = 'light' | 'dark' | 'high-contrast' | 'dyslexic';

// Locale types
export type SupportedLocale = 'en' | 'fr' | 'de';
export type LocaleDirection = 'ltr' | 'rtl';

// SEO types
export interface SeoConfig {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  keywords?: string;
  structuredData?: object;
}

// Common utility types
export type Optional<T> = T | null | undefined;
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

// User preference types
export interface UserPreferences {
  theme: Theme;
  locale: SupportedLocale;
}

// API response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  status: number;
}
