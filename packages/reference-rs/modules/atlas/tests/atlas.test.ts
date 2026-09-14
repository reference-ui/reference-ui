/**
 * Atlas usage statistics, example extraction, and co-usage test suite.
 * Verifies call site metrics, usage tier rankings, string union distributions,
 * JSX element example truncation, and component co-appearance analysis.
 * Complements station specifications with cross-cutting feature verification.
 */
import { describe, expect, it } from 'vitest'
import type { Usage } from '../js/types.js'
import { getComponents, USAGE_VALUES } from './helpers.js'

// ─── Usage stats ──────────────────────────────────────────────────────────────

describe('usage stats', () => {
  it('counts call sites across pages', async () => {
    const components = await getComponents()
    const button = components.find(c => c.name === 'Button')!

    // 3 on HomePage + 2 on SettingsPage + 1 on ProfilePage
    expect(button.count).toBe(6)
  })

  it('assigns higher usage to more-used components', async () => {
    const components = await getComponents()
    const button = components.find(c => c.name === 'Button')!
    const userBadge = components.find(c => c.name === 'UserBadge')!

    const rank = (u: Usage) => USAGE_VALUES.indexOf(u)
    expect(rank(button.usage)).toBeLessThan(rank(userBadge.usage))
  })

  it('tracks prop usage counts', async () => {
    const components = await getComponents()
    const button = components.find(c => c.name === 'Button')!
    const variantProp = button.props.find(p => p.name === 'variant')!

    expect(variantProp.count).toBe(6)
    expect(USAGE_VALUES).toContain(variantProp.usage)
  })

  it('records value distribution for string-literal union props', async () => {
    const components = await getComponents()
    const button = components.find(c => c.name === 'Button')!
    const variantProp = button.props.find(p => p.name === 'variant')!

    expect(variantProp.values).toBeDefined()
    expect(variantProp.values!['solid']).toBeDefined()
    expect(variantProp.values!['outline']).toBeDefined()
    expect(variantProp.values!['ghost']).toBeDefined()
  })

  it('marks optional props with lower usage than always-passed ones', async () => {
    const components = await getComponents()
    const button = components.find(c => c.name === 'Button')!

    const variantProp = button.props.find(p => p.name === 'variant')!
    const loadingProp = button.props.find(p => p.name === 'loading')!

    const rank = (u: Usage) => USAGE_VALUES.indexOf(u)
    expect(rank(variantProp.usage)).toBeLessThanOrEqual(rank(loadingProp.usage))
  })
})

// ─── Examples ─────────────────────────────────────────────────────────────────

describe('examples', () => {
  it('call-site snippets are capped at 5', async () => {
    const components = await getComponents()
    const button = components.find(c => c.name === 'Button')!

    if (button.examples) {
      expect(button.examples.length).toBeLessThanOrEqual(5)
    }
  })

  it('each example is a JSX element string, not a full file', async () => {
    const components = await getComponents()
    const button = components.find(c => c.name === 'Button')!

    if (button.examples) {
      for (const ex of button.examples) {
        expect(typeof ex).toBe('string')
        expect(ex).toMatch(/<Button/)
        expect(ex).not.toMatch(/^import /)
      }
    }
  })

  it('examples capture only the mounting signature, not nested JSX children', async () => {
    const components = await getComponents()
    const appCard = components.find(c => c.name === 'AppCard')!
    const button = components.find(c => c.name === 'Button')!

    for (const ex of appCard.examples) {
      expect(ex).toMatch(/<AppCard/)
      expect(ex).not.toMatch(/<Button/)
      expect(ex).not.toMatch(/<\/AppCard>/)
    }

    for (const ex of button.examples) {
      expect(ex).toMatch(/<Button/)
      expect(ex).not.toMatch(/<\/Button>/)
    }
  })

  it('examples are deduplicated by prop shape (no identical snippets)', async () => {
    const components = await getComponents()
    const button = components.find(c => c.name === 'Button')!

    if (button.examples) {
      const unique = new Set(button.examples)
      expect(unique.size).toBe(button.examples.length)
    }
  })
})

// ─── usedWith ─────────────────────────────────────────────────────────────────

describe('usedWith', () => {
  it('usedWith values are valid Usage ratings', async () => {
    const components = await getComponents()

    for (const c of components) {
      if (c.usedWith) {
        for (const [, u] of Object.entries(c.usedWith)) {
          expect(USAGE_VALUES).toContain(u)
        }
      }
    }
  })

  it('Button and AppCard co-appear frequently (both on 2 pages)', async () => {
    const components = await getComponents()
    const button = components.find(c => c.name === 'Button')!

    expect(button.usedWith?.['AppCard']).toBeDefined()
  })
})
