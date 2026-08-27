/**
 * Ambient type declarations for vitest.
 *
 * Vitest is installed as a devDependency. These ambient declarations provide a
 * lightweight type surface for unit test files so that TypeScript can
 * type-check them even when node_modules is absent (e.g. in CI lint-only
 * steps). When vitest is installed, the real package types take precedence.
 */

declare module 'vitest' {
  // -------------------------------------------------------------------------
  // Mock / spy
  // -------------------------------------------------------------------------

  interface MockInstance<T = unknown, Y extends unknown[] = unknown[]> {
    (...args: Y): T;
    mock: {
      calls: Y[];
      results: Array<{ type: string; value: T }>;
    };
    mockReturnValue(val: T): this;
    mockImplementation(fn: (...args: Y) => T): this;
    mockReset(): this;
    mockClear(): this;
  }

  // Declared as an interface so generic method syntax is unambiguous
  interface Vi {
    fn<T = unknown, Y extends unknown[] = unknown[]>(
      impl?: (...args: Y) => T
    ): MockInstance<T, Y> & ((...args: Y) => T);
    spyOn<O extends object, K extends keyof O>(obj: O, method: K): MockInstance;
    clearAllMocks(): void;
    resetAllMocks(): void;
    restoreAllMocks(): void;
    /** Clears the module registry so the next import re-evaluates a module. */
    resetModules(): void;
    /** Retries the callback until it stops throwing or the timeout elapses. */
    waitFor<T>(
      fn: () => T | Promise<T>,
      options?: number | { timeout?: number; interval?: number }
    ): Promise<T>;
  }

  const vi: Vi;

  // -------------------------------------------------------------------------
  // Matchers — the shape returned by expect()
  // -------------------------------------------------------------------------

  interface Matchers {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toHaveLength(n: number): void;
    toContain(item: unknown): void;
    toMatch(pattern: RegExp | string): void;
    toHaveProperty(key: string, value?: unknown): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeNull(): void;
    toThrow(expected?: RegExp | string | Error): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeGreaterThan(n: number): void;
    toBeGreaterThanOrEqual(n: number): void;
    toBeLessThanOrEqual(n: number): void;
    toHaveBeenCalled(): void;
    toHaveBeenCalledTimes(times: number): void;
    toHaveBeenCalledWith(...args: unknown[]): void;
    toHaveCount(n: number): void;
    toBeAttached(): void;
    toBeVisible(): void;
    readonly not: Matchers;
  }

  // Asymmetric matchers (static methods on expect)
  interface AsymmetricMatcher {
    readonly _isMatcher: true;
  }

  // ExpectStatic is both callable and carries asymmetric-matcher statics.
  // Declaring it as an interface with a call signature avoids the inline-object
  // generic-method parse ambiguity.
  interface ExpectStatic {
    (actual: unknown, message?: string): Matchers;
    any(constructor: unknown): AsymmetricMatcher;
    anything(): AsymmetricMatcher;
    arrayContaining(arr: unknown[]): AsymmetricMatcher;
    objectContaining(obj: Record<string, unknown>): AsymmetricMatcher;
    stringContaining(str: string): AsymmetricMatcher;
    stringMatching(pattern: RegExp | string): AsymmetricMatcher;
  }

  const expect: ExpectStatic;

  // -------------------------------------------------------------------------
  // Test lifecycle
  // -------------------------------------------------------------------------

  /**
   * `it.each` / `test.each`. Rows that are themselves arrays are spread into
   * the callback's parameters; scalar rows arrive as a single argument.
   */
  interface EachFn {
    <T extends readonly unknown[]>(
      cases: readonly T[]
    ): (name: string, fn: (...args: T) => void | Promise<void>) => void;
    <T>(
      cases: readonly T[]
    ): (name: string, fn: (testCase: T) => void | Promise<void>) => void;
  }

  interface TestFn {
    (name: string, fn: () => void | Promise<void>): void;
    each: EachFn;
    skip(name: string, fn: () => void | Promise<void>): void;
    only(name: string, fn: () => void | Promise<void>): void;
  }

  function describe(name: string, fn: () => void): void;
  const it: TestFn;
  const test: TestFn;
  function beforeEach(fn: () => void | Promise<void>): void;
  function afterEach(fn: () => void | Promise<void>): void;
  function beforeAll(fn: () => void | Promise<void>): void;
  function afterAll(fn: () => void | Promise<void>): void;
}
