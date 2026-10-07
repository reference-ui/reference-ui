import { defineConfig } from '@reference-ui/neo'

/**
 * Aliased-host library fixture.
 *
 * Topology: prebuilt package ──▶ layer ──▶ User space (see chain T16).
 *
 * Contract: the shell renders style props on an `as`-cast alias of `Div`
 * (the `@reference-ui/icons` `IconShell` shape). There is deliberately NO
 * `jsxElements` list — StyleTrace host detection must recognize the alias
 * on its own, or the shell utilities silently drop (CSS composition
 * investigation, H1).
 */
export default defineConfig({
  name: 'aliased-host-library',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
  debug: false,
})
