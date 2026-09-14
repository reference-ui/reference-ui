/**
 * Vitest configuration for the canon module test suite.
 * Targets fail-closed platform join validation tests under generate/.
 * Runs in isolated project space without leaking into other reference-rs suites.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'canon',
    include: ['generate/**/*.test.ts'],
  },
});
