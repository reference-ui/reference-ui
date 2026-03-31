/**
 * Indexing tests — verifies Atlas's source-pattern resolution:
 * - local-first default (no config needed for local components)
 * - include: package names, scoped selectors, glob paths
 * - exclude: scoped selectors, glob paths, non-interference
 */
import { describe, it, expect } from 'vitest'
import { getComponents, getComponent } from './helpers'

const DEMO_UI = '@fixtures/demo-ui'

// ─── Local-first ───────────────────────────────────────────────────────────────

describe('local-first default', () => {
  it('indexes all local components without any config', async () => {
    const names = (await getComponents()).map(c => c.name)

    expect(names).toContain('Button')
    expect(names).toContain('AppCard')
    expect(names).toContain('UserBadge')
  })

  it('local sources are paths, not package names', async () => {
    const components = await getComponents()

    for (const c of components) {
      expect(c.source).toMatch(/^[./]/)
    }
  })

  it('does not index library components without explicit include', async () => {
    const components = await getComponents()
    const lib = components.filter(c => c.source === DEMO_UI)

    expect(lib).toHaveLength(0)
  })
})

// ─── include ──────────────────────────────────────────────────────────────────

describe('include: package name', () => {
  it('adds library components to the result set', async () => {
    const sources = (await getComponents({ include: [DEMO_UI] })).map(c => c.source)

    expect(sources).toContain(DEMO_UI)
  })

  it('includes all exported components from the package', async () => {
    const libNames = (await getComponents({ include: [DEMO_UI] }))
      .filter(c => c.source === DEMO_UI)
      .map(c => c.name)

    expect(libNames).toContain('Button')
    expect(libNames).toContain('Card')
    expect(libNames).toContain('Badge')
    expect(libNames).toContain('Stack')
  })

  it('local components are still included alongside library ones', async () => {
    const names = (await getComponents({ include: [DEMO_UI] })).map(c => c.name)

    // local wrappers should still be present
    expect(names).toContain('AppCard')
    expect(names).toContain('UserBadge')
  })
})

describe('include: scoped selector', () => {
  it('includes only the named component from the package', async () => {
    const libNames = (await getComponents({ include: [`${DEMO_UI}:Button`] }))
      .filter(c => c.source === DEMO_UI)
      .map(c => c.name)

    expect(libNames).toContain('Button')
    expect(libNames).not.toContain('Card')
    expect(libNames).not.toContain('Badge')
    expect(libNames).not.toContain('Stack')
  })

  it('scoped selector does not suppress local components', async () => {
    const names = (await getComponents({ include: [`${DEMO_UI}:Button`] })).map(
      c => c.name
    )

    expect(names).toContain('AppCard')
    expect(names).toContain('UserBadge')
  })
})

describe('include: glob path', () => {
  it('explicitly including a local glob still returns local components', async () => {
    const button = await getComponent('Button', { include: ['src/components/**'] })

    expect(button).toBeDefined()
  })
})

// ─── exclude ──────────────────────────────────────────────────────────────────

describe('exclude: scoped selector', () => {
  const config = { include: [DEMO_UI], exclude: [`${DEMO_UI}:Badge`] }

  it('removes the named library component', async () => {
    const components = await getComponents(config)
    const libBadge = components.find(c => c.name === 'Badge' && c.source === DEMO_UI)

    expect(libBadge).toBeUndefined()
  })

  it('does not remove other components from the same source', async () => {
    const libNames = (await getComponents(config))
      .filter(c => c.source === DEMO_UI)
      .map(c => c.name)

    expect(libNames).toContain('Button')
    expect(libNames).toContain('Card')
    expect(libNames).toContain('Stack')
  })
})

describe('exclude: glob path', () => {
  it('removes matched local components', async () => {
    const components = await getComponents({ exclude: ['src/components/UserBadge*'] })

    expect(components.find(c => c.name === 'UserBadge')).toBeUndefined()
  })

  it('does not remove non-matching local components', async () => {
    const components = await getComponents({ exclude: ['src/components/UserBadge*'] })

    expect(components.find(c => c.name === 'Button')).toBeDefined()
    expect(components.find(c => c.name === 'AppCard')).toBeDefined()
  })
})
