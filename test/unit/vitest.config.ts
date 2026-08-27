import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['test/unit/**/*.test.ts'],
    exclude: ['test/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../src'),
      '@config': resolve(__dirname, '../../config'),
      // Deno-only specifier used by edge/bunnycdn-country-injection.ts. Vite's
      // import analysis cannot resolve it and fails before vi.mock can
      // intercept, so the edge script is unimportable without this alias. The
      // real SDK exists only inside Bunny's runtime.
      'npm:@bunny.net/edgescript-sdk@0.12.1': resolve(
        __dirname,
        'helpers/bunnyEdgeSdkStub.ts'
      ),
    },
  },
});
