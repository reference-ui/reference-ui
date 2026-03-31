import path from 'node:path'
import { analyze } from '../../js/atlas'
import type { Component, AtlasConfig, Usage } from '../../js/atlas/types'

// ─── Fixture path ──────────────────────────────────────────────────────────────

/**
 * The atlas-project fixture is a representative "real app":
 *
 *   components/Button.tsx    — local wrapper around @fixtures/demo-ui Button
 *   components/AppCard.tsx   — local composition of demo-ui Card + Badge
 *   components/UserBadge.tsx — thin wrapper around @fixtures/demo-ui Badge
 *
 *   pages/HomePage.tsx       — Button (solid×2, ghost×1),  AppCard (×2)
 *   pages/SettingsPage.tsx   — Button (outline×2, disabled×1), AppCard (×1)
 *   pages/ProfilePage.tsx    — Button (ghost×1), UserBadge (×2)
 *
 * Button total: 6 call sites
 * AppCard total: 3 call sites
 * UserBadge total: 2 call sites
 */
export const FIXTURE = path.resolve(__dirname, '../../../fixtures/atlas-project')

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

export function getComponents(config?: AtlasConfig): Promise<Component[]> {
  const key = JSON.stringify(config ?? null)
  if (!cache.has(key)) {
    cache.set(key, analyze(FIXTURE, config))
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
  source?: string
): Promise<Component> {
  const components = await getComponents(config)
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
