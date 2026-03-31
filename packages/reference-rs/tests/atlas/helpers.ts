import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { analyze } from '../../js/atlas'
import type { Component, AtlasConfig, Usage } from '../../js/atlas/types'

// ─── Case paths ────────────────────────────────────────────────────────────────

/**
 * demo_surface is the baseline Atlas scenario. It mirrors the older atlas
 * fixture, but lives under tests/atlas/cases so Atlas can adopt the same
 * case-oriented shape as Tasty.
 *
 *   input/app/src/components/Button.tsx    — local wrapper around @fixtures/demo-ui Button
 *   input/app/src/components/AppCard.tsx   — local composition of demo-ui Card + Badge
 *   input/app/src/components/UserBadge.tsx — thin wrapper around @fixtures/demo-ui Badge
 *
 *   input/app/src/pages/HomePage.tsx       — Button (solid×2, ghost×1),  AppCard (×2)
 *   input/app/src/pages/SettingsPage.tsx   — Button (outline×2, disabled×1), AppCard (×1)
 *   input/app/src/pages/ProfilePage.tsx    — Button (ghost×1), UserBadge (×2)
 *
 * Button total: 6 call sites
 * AppCard total: 3 call sites
 * UserBadge total: 2 call sites
 */
const TESTS_ATLAS_DIR = fileURLToPath(new URL('.', import.meta.url))

export const CASES_DIR = path.resolve(TESTS_ATLAS_DIR, 'cases')
export const DEMO_SURFACE_CASE = 'demo_surface'
export const FIXTURE = path.join(CASES_DIR, DEMO_SURFACE_CASE, 'input', 'app')

export function getCaseDir(caseName: string): string {
  return path.join(CASES_DIR, caseName)
}

export function getCaseInputDir(caseName: string): string {
  return path.join(getCaseDir(caseName), 'input', 'app')
}

// ─── Usage helpers ─────────────────────────────────────────────────────────────

export const USAGE_VALUES: Usage[] = [
  'very common',
  'common',
  'occasional',
  'rare',
  'unused',
]

/** Lower index = higher usage (very common = 0, unused = 4). */
export function usageRank(u: Usage): number {
  return USAGE_VALUES.indexOf(u)
}

// ─── Cached analysis ───────────────────────────────────────────────────────────
// Each unique config key runs analyze() once across the whole test run.

const cache = new Map<string, Promise<Component[]>>()

export function getComponents(
  config?: AtlasConfig,
  caseName = DEMO_SURFACE_CASE
): Promise<Component[]> {
  const key = JSON.stringify({ caseName, config: config ?? null })
  if (!cache.has(key)) {
    cache.set(key, analyze(getCaseInputDir(caseName), config))
  }
  return cache.get(key)!
}

/**
 * Find a component by name, optionally filtered to a specific source.
 * Throws if not found so tests fail with a clear message rather than
 * cascading `Cannot read properties of undefined` errors.
 */
export async function getComponent(
  name: string,
  config?: AtlasConfig,
  source?: string,
  caseName = DEMO_SURFACE_CASE
): Promise<Component> {
  const components = await getComponents(config, caseName)
  const c = components.find(
    x => x.name === name && (source === undefined || x.source === source)
  )
  if (!c) {
    const qualifier = source ? ` from "${source}"` : ''
    throw new Error(
      `Component "${name}"${qualifier} not found in analysis results.\n` +
        `Available: ${components.map(x => `${x.name}(${x.source})`).join(', ')}`
    )
  }
  return c
}
