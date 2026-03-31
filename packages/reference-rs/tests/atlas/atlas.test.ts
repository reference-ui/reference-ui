import { describe, it, expect } from 'vitest'
import type { Usage } from '../../js/atlas/types'
import { getComponents } from './helpers'

const USAGE_VALUES: Usage[] = ['very common', 'common', 'occasional', 'rare', 'unused']

// ─── Type shape ────────────────────────────────────────────────────────────────

describe('Component type shape', () => {
  it('returns an array of Component objects matching types.ts', async () => {
    const components = await getComponents()

    expect(Array.isArray(components)).toBe(true)
    for (const c of components) {
      expect(typeof c.name).toBe('string')
      expect(typeof c.interface.name).toBe('string')
      expect(typeof c.interface.source).toBe('string')
      expect(typeof c.source).toBe('string')
      expect(typeof c.count).toBe('number')
      expect(Array.isArray(c.props)).toBe(true)
      expect(USAGE_VALUES).toContain(c.usage)
    }
  })

  it('ComponentProp entries have the correct shape', async () => {
    const components = await getComponents()
    const button = components.find(c => c.name === 'Button')!

    for (const prop of button.props) {
      expect(typeof prop.name).toBe('string')
      expect(typeof prop.count).toBe('number')
      expect(USAGE_VALUES).toContain(prop.usage)

      if (prop.values !== undefined) {
        for (const [, u] of Object.entries(prop.values)) {
          expect(USAGE_VALUES).toContain(u)
        }
      }
    }
  })
})

// ─── Local-first default ───────────────────────────────────────────────────────

describe('local component indexing (default)', () => {
  it('indexes local components without any config', async () => {
    const components = await getComponents()
    const names = components.map(c => c.name)

    expect(names).toContain('Button')
    expect(names).toContain('AppCard')
    expect(names).toContain('UserBadge')
  })

  it('local component sources are paths, not package names', async () => {
    const components = await getComponents()

    for (const c of components) {
      // local components should have a relative or absolute file path as source
      expect(c.source).toMatch(/^[./]/)
    }
  })

  it('does not index library components without explicit include', async () => {
    const components = await getComponents()
    const libComponents = components.filter(c => c.source === '@fixtures/demo-ui')

    expect(libComponents).toHaveLength(0)
  })
})

// ─── include ──────────────────────────────────────────────────────────────────

describe('include', () => {
  it('indexes library components when included by package name', async () => {
    const components = await getComponents({ include: ['@fixtures/demo-ui'] })
    const sources = components.map(c => c.source)

    expect(sources).toContain('@fixtures/demo-ui')
  })

  it('includes all exported components from a package', async () => {
    const components = await getComponents({ include: ['@fixtures/demo-ui'] })
    const libNames = components
      .filter(c => c.source === '@fixtures/demo-ui')
      .map(c => c.name)

    expect(libNames).toContain('Button')
    expect(libNames).toContain('Card')
    expect(libNames).toContain('Badge')
    expect(libNames).toContain('Stack')
  })

  it('scoped selector includes only the specified component from a package', async () => {
    const components = await getComponents({
      include: ['@fixtures/demo-ui:Button'],
    })
    const libComponents = components.filter(c => c.source === '@fixtures/demo-ui')
    const libNames = libComponents.map(c => c.name)

    expect(libNames).toContain('Button')
    expect(libNames).not.toContain('Card')
    expect(libNames).not.toContain('Badge')
    expect(libNames).not.toContain('Stack')
  })

  it('glob path includes components from matching local directories', async () => {
    const components = await getComponents({
      include: ['src/components/**'],
    })
    // still returns local components — same as default but explicit
    expect(components.find(c => c.name === 'Button')).toBeDefined()
  })
})

// ─── exclude ──────────────────────────────────────────────────────────────────

describe('exclude', () => {
  it('suppresses a library component by scoped selector', async () => {
    const components = await getComponents({
      include: ['@fixtures/demo-ui'],
      exclude: ['@fixtures/demo-ui:Badge'],
    })
    const libBadge = components.find(
      c => c.name === 'Badge' && c.source === '@fixtures/demo-ui'
    )

    expect(libBadge).toBeUndefined()
  })

  it('suppresses a local component by glob path', async () => {
    const components = await getComponents({
      exclude: ['src/components/UserBadge*'],
    })

    expect(components.find(c => c.name === 'UserBadge')).toBeUndefined()
  })

  it('exclude does not affect other components from the same source', async () => {
    const components = await getComponents({
      include: ['@fixtures/demo-ui'],
      exclude: ['@fixtures/demo-ui:Badge'],
    })
    const libNames = components
      .filter(c => c.source === '@fixtures/demo-ui')
      .map(c => c.name)

    expect(libNames).toContain('Button')
    expect(libNames).toContain('Card')
    expect(libNames).toContain('Stack')
  })
})

// ─── Usage stats ──────────────────────────────────────────────────────────────

describe('usage stats', () => {
  it('counts call sites (Button appears on all 3 pages → count 6)', async () => {
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
    // Button (6 sites) should rank higher usage than UserBadge (2 sites)
    expect(rank(button.usage)).toBeLessThan(rank(userBadge.usage))
  })

  it('tracks prop usage counts', async () => {
    const components = await getComponents()
    const button = components.find(c => c.name === 'Button')!
    const variantProp = button.props.find(p => p.name === 'variant')!

    // variant is passed at every Button call site
    expect(variantProp.count).toBe(6)
    expect(USAGE_VALUES).toContain(variantProp.usage)
  })

  it('records value distribution for string-literal union props', async () => {
    const components = await getComponents()
    const button = components.find(c => c.name === 'Button')!
    const variantProp = button.props.find(p => p.name === 'variant')!

    // variant is a ButtonVariant union — should have per-value breakdown
    expect(variantProp.values).toBeDefined()
    expect(variantProp.values!['solid']).toBeDefined()
    expect(variantProp.values!['outline']).toBeDefined()
    expect(variantProp.values!['ghost']).toBeDefined()
  })

  it('marks optional props with lower usage than always-passed ones', async () => {
    const components = await getComponents()
    const button = components.find(c => c.name === 'Button')!

    // variant always passed, loading never passed in fixture → loading should rank lower
    const variantProp = button.props.find(p => p.name === 'variant')!
    const loadingProp = button.props.find(p => p.name === 'loading')!

    const rank = (u: Usage) => USAGE_VALUES.indexOf(u)
    expect(rank(variantProp.usage)).toBeLessThanOrEqual(rank(loadingProp.usage))
  })
})

// ─── Interface mapping ─────────────────────────────────────────────────────────

describe('interface mapping', () => {
  it('records the TypeScript interface name for local components', async () => {
    const components = await getComponents()
    const button = components.find(c => c.name === 'Button')!

    // Local Button re-exports ButtonProps from @fixtures/demo-ui
    expect(button.interface.name).toBe('ButtonProps')
  })

  it('records the interface name for library components', async () => {
    const components = await getComponents({ include: ['@fixtures/demo-ui'] })
    const card = components.find(
      c => c.name === 'Card' && c.source === '@fixtures/demo-ui'
    )!

    expect(card.interface.name).toBe('CardProps')
  })
})

// ─── Wrapper detection ─────────────────────────────────────────────────────────

describe('wrapper detection', () => {
  it('local Button is indexed with a local source path', async () => {
    const components = await getComponents({ include: ['@fixtures/demo-ui'] })
    const localButton = components.find(
      c => c.name === 'Button' && c.source !== '@fixtures/demo-ui'
    )!

    expect(localButton.source).toMatch(/^[./]/)
  })

  it('both local wrapper and library original are indexed when library is included', async () => {
    const components = await getComponents({ include: ['@fixtures/demo-ui'] })
    const buttons = components.filter(c => c.name === 'Button')

    // One from local path, one from @fixtures/demo-ui
    expect(buttons.length).toBeGreaterThanOrEqual(2)
    expect(buttons.some(c => c.source === '@fixtures/demo-ui')).toBe(true)
    expect(buttons.some(c => c.source !== '@fixtures/demo-ui')).toBe(true)
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
        // should not contain a full module — no import statements
        expect(ex).not.toMatch(/^import /)
      }
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

    // AppCard should show up in Button's usedWith
    expect(button.usedWith?.['AppCard']).toBeDefined()
  })
})
