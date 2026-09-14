/**
 * Test harness definitions and fixtures.
 * Verifies the module correctness and output contracts.
 */
import { describe, it, expect } from 'vitest'
import { getComponents, USAGE_VALUES } from './helpers'

describe('Component shape', () => {
  it('every component has the required top-level fields', async () => {
    const components = await getComponents()

    expect(components.length).toBeGreaterThan(0)
    for (const c of components) {
      expect(typeof c.name, `${c.name}.name`).toBe('string')
      if (c.interface === null) {
        expect(c.interface, `${c.name}.interface`).toBeNull()
      } else {
        expect(typeof c.interface.name, `${c.name}.interface.name`).toBe('string')
        expect(typeof c.interface.source, `${c.name}.interface.source`).toBe('string')
      }
      expect(typeof c.source, `${c.name}.source`).toBe('string')
      expect(typeof c.count, `${c.name}.count`).toBe('number')
      expect(c.count, `${c.name}.count`).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(c.props), `${c.name}.props`).toBe(true)
      expect(USAGE_VALUES, `${c.name}.usage`).toContain(c.usage)
    }
  })

  it('optional fields are the right type when present', async () => {
    const components = await getComponents()

    for (const c of components) {
      if (c.examples !== undefined) {
        expect(Array.isArray(c.examples), `${c.name}.examples`).toBe(true)
        for (const ex of c.examples) {
          expect(typeof ex, `${c.name} example entry`).toBe('string')
        }
      }

      if (c.usedWith !== undefined) {
        expect(typeof c.usedWith, `${c.name}.usedWith`).toBe('object')
        for (const [key, u] of Object.entries(c.usedWith)) {
          expect(typeof key).toBe('string')
          expect(USAGE_VALUES, `${c.name}.usedWith["${key}"]`).toContain(u)
        }
      }
    }
  })
})

describe('ComponentProp shape', () => {
  it('every prop has the required fields', async () => {
    const components = await getComponents()

    for (const c of components) {
      for (const p of c.props) {
        expect(typeof p.name, `${c.name}.${p.name}.name`).toBe('string')
        expect(typeof p.count, `${c.name}.${p.name}.count`).toBe('number')
        expect(p.count, `${c.name}.${p.name}.count`).toBeGreaterThanOrEqual(0)
        expect(USAGE_VALUES, `${c.name}.${p.name}.usage`).toContain(p.usage)
      }
    }
  })

  it('values map is the right type when present', async () => {
    const components = await getComponents()

    for (const c of components) {
      for (const p of c.props) {
        if (p.values !== undefined) {
          expect(typeof p.values, `${c.name}.${p.name}.values`).toBe('object')
          for (const [val, u] of Object.entries(p.values)) {
            expect(typeof val).toBe('string')
            expect(USAGE_VALUES, `${c.name}.${p.name}.values["${val}"]`).toContain(u)
          }
        }
      }
    }
  })
})
