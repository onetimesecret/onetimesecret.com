/**
 * Ambient type declarations for @playwright/test.
 *
 * @playwright/test is not yet installed (see test/README.md for install
 * instructions). These declarations let TypeScript type-check E2E spec files
 * without the package being present. When @playwright/test is installed these
 * declarations are superseded by the real package types.
 */

declare module '@playwright/test' {
  // -------------------------------------------------------------------------
  // Core browser types
  // -------------------------------------------------------------------------

  interface ConsoleMessage {
    type(): string;
    text(): string;
  }

  interface Response {
    status(): number;
    url(): string;
  }

  interface Locator {
    getAttribute(name: string): Promise<string | null>;
    textContent(): Promise<string | null>;
    allTextContents(): Promise<string[]>;
    count(): Promise<number>;
    all(): Promise<Locator[]>;
    // evaluate accepts an optional second argument (serialisable arg passed to page context)
    evaluate<T, Arg = undefined>(
      fn: Arg extends undefined ? (el: Element) => T : (el: Element, arg: Arg) => T,
      arg?: Arg
    ): Promise<T>;
    click(): Promise<void>;
    fill(value: string): Promise<void>;
    filter(options: { hasText?: string | RegExp; has?: Locator }): Locator;
    locator(selector: string): Locator;
    getByRole(role: string, options?: { name?: string | RegExp; exact?: boolean }): Locator;
    getByText(text: string | RegExp, options?: { exact?: boolean }): Locator;
    getByTestId(testId: string): Locator;
    first(): Locator;
    nth(index: number): Locator;
    isVisible(): Promise<boolean>;
    isAttached(): Promise<boolean>;
    boundingBox(): Promise<{ x: number; y: number; width: number; height: number } | null>;
  }

  interface Page {
    goto(
      url: string,
      options?: { waitUntil?: string; timeout?: number }
    ): Promise<Response | null>;
    title(): Promise<string>;
    locator(selector: string): Locator;
    getByRole(role: string, options?: { name?: string | RegExp; exact?: boolean }): Locator;
    getByText(text: string | RegExp, options?: { exact?: boolean }): Locator;
    getByTestId(testId: string): Locator;
    on(event: 'console', handler: (msg: ConsoleMessage) => void): void;
    on(event: 'pageerror', handler: (err: Error) => void): void;
    // evaluate is overloaded: single-arg fn, or fn + serialisable arg
    evaluate<T>(fn: () => T): Promise<T>;
    evaluate<T, Arg>(fn: (arg: Arg) => T, arg: Arg): Promise<T>;
    reload(): Promise<Response | null>;
    addInitScript(script: () => void): Promise<void>;
    setViewportSize(size: { width: number; height: number }): Promise<void>;
    emulateMedia(options: {
      colorScheme?: 'light' | 'dark' | 'no-preference';
    }): Promise<void>;
    keyboard: { press(key: string): Promise<void> };
  }

  // -------------------------------------------------------------------------
  // Test fixtures
  // -------------------------------------------------------------------------

  interface TestFixtures {
    page: Page;
  }

  // -------------------------------------------------------------------------
  // Matchers
  // -------------------------------------------------------------------------

  interface LocatorAssertions {
    toBeVisible(options?: { timeout?: number }): Promise<void>;
    toBeAttached(options?: { timeout?: number }): Promise<void>;
    toBeHidden(options?: { timeout?: number }): Promise<void>;
    toHaveCount(count: number, options?: { timeout?: number }): Promise<void>;
    toHaveText(text: string | RegExp, options?: { timeout?: number }): Promise<void>;
    toHaveAttribute(name: string, value: string | RegExp): Promise<void>;
    readonly not: LocatorAssertions;
  }

  interface GenericAssertions {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeNull(): void;
    toContain(item: unknown): void;
    toMatch(pattern: RegExp | string): void;
    toHaveLength(n: number): void;
    toBeGreaterThan(n: number): void;
    toBeGreaterThanOrEqual(n: number): void;
    toBeLessThan(n: number): void;
    toBeLessThanOrEqual(n: number): void;
    toBeVisible(options?: { timeout?: number }): Promise<void>;
    toBeAttached(options?: { timeout?: number }): Promise<void>;
    toHaveCount(count: number, options?: { timeout?: number }): Promise<void>;
    readonly not: GenericAssertions;
  }

  // expect() is overloaded: Locator → LocatorAssertions, else → GenericAssertions.
  // The optional second argument is a custom failure message (Playwright extension).
  interface ExpectFunction {
    (locator: Locator, message?: string): LocatorAssertions;
    (value: unknown, message?: string): GenericAssertions;
  }

  const expect: ExpectFunction;

  // -------------------------------------------------------------------------
  // Test API
  // -------------------------------------------------------------------------

  interface TestFunction {
    (title: string, fn: (fixtures: TestFixtures) => Promise<void> | void): void;
    describe(title: string, fn: () => void): void;
    beforeEach(fn: (fixtures: TestFixtures) => Promise<void> | void): void;
    afterEach(fn: (fixtures: TestFixtures) => Promise<void> | void): void;
    skip(title: string, fn: (fixtures: TestFixtures) => Promise<void> | void): void;
  }

  const test: TestFunction;
}
