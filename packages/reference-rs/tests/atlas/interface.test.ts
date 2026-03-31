/**
 * Interface mapping tests — the core contract between Atlas and Tasty.
 *
 * Atlas identifies WHICH interface a component's props satisfy, and WHERE
 * that interface is declared. Tasty consumes ComponentInterface to resolve
 * the full member list, JSDoc, defaults, and optionality — Atlas doesn't
 * need to carry any of that itself.
 *
 * These tests cover only the Atlas side:
 *   - component.interface.name is correct
 *   - component.interface.source points to where the type is declared
 *   - component.props contains the right prop names (coverage, not metadata)
 *   - no duplicate prop names within a component
 *
 * Fixture component → expected interface:
 *
 *   Local wrapper (Button)      → { name: 'ButtonProps',  source: '@fixtures/demo-ui' }
 *   Local composition (AppCard) → { name: 'AppCardProps', source: local file path }
 *   Thin wrapper (UserBadge)    → { name: 'BadgeProps',   source: '@fixtures/demo-ui' }
 *   Library Button              → { name: 'ButtonProps',  source: '@fixtures/demo-ui' }
 *   Library Card                → { name: 'CardProps',    source: '@fixtures/demo-ui' }
 *   Library Badge               → { name: 'BadgeProps',   source: '@fixtures/demo-ui' }
 *   Library Stack               → { name: 'StackProps',   source: '@fixtures/demo-ui' }
 */
import { describe, it, expect } from 'vitest'
import { getComponent, getComponents } from './helpers'

const DEMO_UI = '@fixtures/demo-ui'

// ─── Shape ────────────────────────────────────────────────────────────────────

describe('ComponentInterface shape', () => {
  it('every component has a non-empty interface.name', async () => {
    const components = await getComponents()

    for (const c of components) {
      expect(
        c.interface.name.length,
        `${c.name}.interface.name should not be empty`
      ).toBeGreaterThan(0)
    }
  })

  it('every component has a non-empty interface.source', async () => {
    const components = await getComponents()

    for (const c of components) {
      expect(
        c.interface.source.length,
        `${c.name}.interface.source should not be empty`
      ).toBeGreaterThan(0)
    }
  })
})

// ─── Local components ─────────────────────────────────────────────────────────

describe('local component → interface', () => {
  it('local wrapper Button: interface name is ButtonProps, source is @fixtures/demo-ui', async () => {
    // Button re-exports ButtonProps from @fixtures/demo-ui — the type lives in
    // the library even though the component is local.
    const button = await getComponent('Button')

    expect(button.interface.name).toBe('ButtonProps')
    expect(button.interface.source).toBe(DEMO_UI)
  })

  it('local composition AppCard: interface is AppCardProps declared locally', async () => {
    // AppCardProps is defined in the project itself as CardProps & { status?, statusLabel? }
    const appCard = await getComponent('AppCard')

    expect(appCard.interface.name).toBe('AppCardProps')
    // source should be the local file, not a package name
    expect(appCard.interface.source).toMatch(/^[./]/)
  })

  it('thin wrapper UserBadge: interface is BadgeProps from @fixtures/demo-ui', async () => {
    // UserBadge accepts BadgeProps directly — the type lives in the library.
    const userBadge = await getComponent('UserBadge')

    expect(userBadge.interface.name).toBe('BadgeProps')
    expect(userBadge.interface.source).toBe(DEMO_UI)
  })
})

// ─── Library components ───────────────────────────────────────────────────────

describe('library component → interface', () => {
  it('library Button: ButtonProps from @fixtures/demo-ui', async () => {
    const button = await getComponent('Button', { include: [DEMO_UI] }, DEMO_UI)

    expect(button.interface.name).toBe('ButtonProps')
    expect(button.interface.source).toBe(DEMO_UI)
  })

  it('library Card: CardProps from @fixtures/demo-ui', async () => {
    const card = await getComponent('Card', { include: [DEMO_UI] }, DEMO_UI)

    expect(card.interface.name).toBe('CardProps')
    expect(card.interface.source).toBe(DEMO_UI)
  })

  it('library Badge: BadgeProps from @fixtures/demo-ui', async () => {
    const badge = await getComponent('Badge', { include: [DEMO_UI] }, DEMO_UI)

    expect(badge.interface.name).toBe('BadgeProps')
    expect(badge.interface.source).toBe(DEMO_UI)
  })

  it('library Stack: StackProps from @fixtures/demo-ui', async () => {
    const stack = await getComponent('Stack', { include: [DEMO_UI] }, DEMO_UI)

    expect(stack.interface.name).toBe('StackProps')
    expect(stack.interface.source).toBe(DEMO_UI)
  })
})

// ─── Props coverage ───────────────────────────────────────────────────────────
// Atlas surfaces every prop name from the interface — even ones never passed at
// a call site (count = 0). The MCP consumer needs the full list, not just the
// popular ones, because Tasty will add the rich metadata on top.

describe('component.props covers all interface members', () => {
  it('Button props contain every ButtonProps member', async () => {
    const button = await getComponent('Button')
    const names = button.props.map(p => p.name)

    expect(names).toContain('variant')
    expect(names).toContain('size')
    expect(names).toContain('disabled')
    expect(names).toContain('loading')
    expect(names).toContain('onClick')
    expect(names).toContain('children')
  })

  it('AppCard props include both CardProps members and its own', async () => {
    const appCard = await getComponent('AppCard')
    const names = appCard.props.map(p => p.name)

    // Inherited from CardProps
    expect(names).toContain('title')
    expect(names).toContain('padding')
    expect(names).toContain('elevated')
    expect(names).toContain('children')
    // Own members
    expect(names).toContain('status')
    expect(names).toContain('statusLabel')
  })

  it('no duplicate prop names within a single component', async () => {
    const components = await getComponents()

    for (const c of components) {
      const names = c.props.map(p => p.name)
      const unique = new Set(names)
      expect(unique.size, `${c.name} has duplicate prop names`).toBe(names.length)
    }
  })
})

// ─── Interface provenance ─────────────────────────────────────────────────────
// The source field is what lets Tasty look up the type. These tests verify the
// routing is correct for different declaration patterns.

describe('interface source provenance', () => {
  it('a type declared in a library resolves to that package name', async () => {
    // ButtonProps is declared in @fixtures/demo-ui — both local wrapper and
    // library component should point there.
    const localButton = await getComponent('Button')
    const libButton = await getComponent('Button', { include: [DEMO_UI] }, DEMO_UI)

    expect(localButton.interface.source).toBe(DEMO_UI)
    expect(libButton.interface.source).toBe(DEMO_UI)
  })

  it('a type declared locally resolves to a file path, not a package name', async () => {
    const appCard = await getComponent('AppCard')

    expect(appCard.interface.source).not.toBe(DEMO_UI)
    expect(appCard.interface.source).toMatch(/^[./]/)
  })

  it('local wrapper and library original share the same ComponentInterface', async () => {
    // The local Button wraps @fixtures/demo-ui Button and re-uses ButtonProps.
    // Both should point to the same interface — same name, same source.
    // This is the key signal Tasty uses to avoid resolving the same type twice.
    const localButton = await getComponent('Button')
    const libButton = await getComponent('Button', { include: [DEMO_UI] }, DEMO_UI)

    expect(localButton.interface.name).toBe(libButton.interface.name)
    expect(localButton.interface.source).toBe(libButton.interface.source)
  })
})
