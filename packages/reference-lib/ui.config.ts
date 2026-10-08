/**
 * Reference Lib - Design system consumer
 *
 * Minimal config for testing the chainable design system pattern.
 * Uses reference-core as the live config/runtime pipeline.
 */

import { defineConfig } from '@reference-ui/neo'
import { baseSystem as iconsBaseSystem } from '@reference-ui/icons/baseSystem'

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
  // Lib re-exports @reference-ui/icons and renders icons inside its own
  // components, so the icons stylesheet must travel with lib's CSS to every
  // consumer (docs inherits it transitively via extends). layers carries
  // the compiled CSS only — tokens and the JSX roster stay icons-local.
  // Style props must never cross into icons at a call-site: the icons
  // runtime mints reference-icons__* classes that only the icons compile
  // can back, so keep icon call-sites to size/style/className/rest.
  layers: [iconsBaseSystem],
  debug: false,
  // Hosts are discovered by StyleTrace per compile; jsxElements is the escape hatch for shapes static tracing cannot infer.
})
