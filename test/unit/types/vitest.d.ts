/**
 * Ambient type declarations for vitest.
 *
 * Vitest is not yet installed (see test/README.md for install instructions).
 * These declarations let TypeScript type-check test files without the package
 * being present. When vitest is installed these declarations are superseded by
 * the real package types.
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
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeGreaterThan(n: number): void;
    toBeGreaterThanOrEqual(n: number): void;
    toBeLessThanOrEqual(n: number): void;
    toHaveBeenCalled(): void;
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

  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void | Promise<void>): void;
  function test(name: string, fn: () => void | Promise<void>): void;
  function beforeEach(fn: () => void | Promise<void>): void;
  function afterEach(fn: () => void | Promise<void>): void;
  function beforeAll(fn: () => void | Promise<void>): void;
  function afterAll(fn: () => void | Promise<void>): void;
}
