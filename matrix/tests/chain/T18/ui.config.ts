/**
 * T18 — Ownership: a tag imported from a package is never an own host.
 *
 * Topology:
 *   @reference-ui/lib ──────────────────▶ extend ──┐  (lib itself layers icons)
 *   @fixtures/primitive-named-library ──▶ extend ──┼──▶ chain-t18 (user space)
 *   @reference-ui/icons ────────────────▶ layer  ──┘
 *
 * Contract: a style prop on a component that renders through another
 * package's bundled runtime is backed under THAT package's system name
 * (`reference-ui__`, `primitive-named-library__`, `reference-icons__`), never
 * under `chain-t18__`, whatever the tag is called and however it reaches the
 * file: a direct import, a namespace import, a relative barrel, a same-file
 * `css` wrapper, or a name the package published in `jsxElements`. Nothing
 * here configures `jsxElements`; ownership must come from provenance alone.
 *
 * Icons are composed directly in `layers` (component-ownership plan §9.5): a
 * style prop on an icon paints because its baseSystem is composed. The
 * uncomposed twin, which must warn `ATM-W-EXTERNAL-UNBACKED`, is the sync-level
 * project under `tests/sync/unbacked` (`tests/unit/icons-composition.test.ts`).
 *
 * Novel probe tokens live in `src/tokens.ts`, one per probe, so no probe's
 * rule can back another probe's class by coincidence.
 */

import { defineConfig } from '@reference-ui/core'
import { baseSystem as libSystem } from '@reference-ui/lib/baseSystem'
import { baseSystem as iconsSystem } from '@reference-ui/icons/baseSystem'
import { baseSystem as primitiveNamedSystem } from '@fixtures/primitive-named-library/baseSystem'

export default defineConfig({
  name: 'chain-t18',
  include: ['src/**/*.{ts,tsx}'],
  extends: [libSystem, primitiveNamedSystem],
  layers: [iconsSystem],
})
