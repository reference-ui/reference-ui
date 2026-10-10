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
  //
  // Fan-out contract (STYLE_PROP_EXTERNAL; plan T09): a named style prop on
  // an external/prebuilt component ALWAYS paints — on @reference-ui/icons
  // and on every lib passthrough part alike. The consumer compile keeps the
  // prop on the capitalized non-host tag, resolves it against the CONSUMER's
  // tokens, and emits the deterministic `<system>__<stem>` class the foreign
  // runtime mints into the consumer's own utilities block (one group per
  // composed system, own first). The value lands on the component's
  // outermost element and overrides the package default. There is no
  // "must never cross" ban: that rule is retired, so do not re-add it.
  // Same-compile call-sites inside lib's own src/** and book/** are
  // unaffected (they were already backed), and the non-style channels
  // (size/style/className/native props) keep working as before.
  layers: [iconsBaseSystem],
  debug: false,
  // Hosts are discovered by StyleTrace per compile; jsxElements is the escape hatch for shapes static tracing cannot infer.
})
