import { defineConfig } from '@reference-ui/neo'
import { baseSystem as libSystem } from '@reference-ui/lib/baseSystem'
import { baseSystem as aliasedHostSystem } from '@fixtures/aliased-host-library'

/**
 * T16 — Compose a prebuilt aliased-host package.
 *
 * Topology: Library A ──▶ extend ──┐
 *                                    ├──▶ User space
 *           Library B ──▶ layer  ───┘
 *
 * Library A is the real `@reference-ui/lib`, which itself layers the real
 * `@reference-ui/icons` — the transitive docs topology. Library B is the
 * `@fixtures/aliased-host-library` prebuilt fixture, whose components render
 * style props on an `as`-cast alias behind a `forwardRef` factory.
 *
 * Contract: every class the page emits has a backing rule in the loaded
 * stylesheets, the runtime logs zero `no compiled class` warnings, and the
 * shell computed styles apply — for the transitive icons path, the direct
 * layers path, and both icon import shapes (lib re-export and direct).
 * The icons rules additionally arrive exactly once: their loaded count
 * equals the icons baseSystem's published utilities count, pinning the
 * lib→icons layer coupling against duplication and drops.
 */
export default defineConfig({
  name: 'chain-t16',
  include: ['src/**/*.{ts,tsx}'],
  extends: [libSystem],
  layers: [aliasedHostSystem],
  debug: false,
})
