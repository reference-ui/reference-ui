/**
 * Reference Lib - Design system consumer
 *
 * Minimal config for testing the chainable design system pattern.
 * Uses reference-core as the live config/runtime pipeline.
 */

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'reference-ui',
  // The barrel re-exports every component but holds no style call-sites of
  // its own, so excluding it drops ~330ms of redundant StyleTrace edge
  // resolution with byte-identical output (Obj-3, LOG-3.md). Every target
  // stays covered as a direct compile entry. WARNING: if a style call-site
  // ever lands in src/index.ts, this negation silently drops it — the guard
  // test ../reference-neo/src/sync/lib-barrel-negation.test.ts fails loudly
  // in that case. Keep both.
  include: ['src/**/*.{ts,tsx}', 'book/**/*.{ts,tsx}', '!src/index.ts'],
  extends: [],
  debug: false,
  // Hosts are discovered by StyleTrace per compile; jsxElements is the escape hatch for shapes static tracing cannot infer.
})
