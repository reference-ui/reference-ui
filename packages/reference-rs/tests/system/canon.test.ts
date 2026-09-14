/**
 * Integration tests verifying single-source-of-truth style props, primitives, and conditions.
 * Ensures only real HTML/Reference primitives and valid style properties are extracted as atomic wants.
 * Verifies non-style attributes and hallucinated component tags are ignored or fail-closed.
 */
import { describe, expect, it } from 'vitest'
import { compileVirtual, hasWant, getWantsForProp } from './helpers.js'

describe('Ground Truth Style Extraction (canon dictionary)', () => {
  it('extracts style props from real Reference primitives from tags.ts', async () => {
    const code = `
      export function App() {
        return (
          <>
            <Div mt="2r" bg="blue.500" />
            <Button px="4r" py="2r" />
            <P color="gray.800" fontSize="16px" />
            <Span display="inline-block" opacity={0.8} />
            <Obj borderTop="1px solid" />
            <Var font="mono" />
          </>
        )
      }
    `
    const res = await compileVirtual({ 'App.tsx': code })
    expect(hasWant(res, 'mt', '2r')).toBe(true)
    expect(hasWant(res, 'bg', 'blue.500')).toBe(true)
    expect(hasWant(res, 'px', '4r')).toBe(true)
    expect(hasWant(res, 'py', '2r')).toBe(true)
    expect(hasWant(res, 'color', 'gray.800')).toBe(true)
    expect(hasWant(res, 'fontSize', '16px')).toBe(true)
    expect(hasWant(res, 'display', 'inline-block')).toBe(true)
    expect(hasWant(res, 'opacity', 0.8)).toBe(true)
    expect(hasWant(res, 'borderTop', '1px solid')).toBe(true)
    expect(hasWant(res, 'font', 'mono')).toBe(true)
  })

  it('does not extract non-style attributes as styling wants', async () => {
    const code = `
      export function App() {
        return (
          <Div
            id="main-container"
            className="custom-class"
            onClick={() => console.log('clicked')}
            title="Tooltip text"
            aria-label="Container"
            tabIndex={0}
          />
        )
      }
    `
    const res = await compileVirtual({ 'App.tsx': code })
    expect(getWantsForProp(res, 'id')).toHaveLength(0)
    expect(getWantsForProp(res, 'className')).toHaveLength(0)
    expect(getWantsForProp(res, 'onClick')).toHaveLength(0)
    expect(getWantsForProp(res, 'title')).toHaveLength(0)
    expect(getWantsForProp(res, 'aria-label')).toHaveLength(0)
    expect(getWantsForProp(res, 'tabIndex')).toHaveLength(0)
  })

  it('extracts Reference-specific public props (r, container, colorMode, variant, rounded, borderX)', async () => {
    const code = `
      export function App() {
        return (
          <Div
            r={{ 300: { p: '1r' } }}
            container="sidebar"
            colorMode="dark"
            variant="solid"
            rounded="md"
            borderX="2px solid"
          />
        )
      }
    `
    const res = await compileVirtual({ 'App.tsx': code })
    expect(hasWant(res, 'container', 'sidebar')).toBe(true)
    expect(hasWant(res, 'colorMode', 'dark')).toBe(true)
    expect(hasWant(res, 'variant', 'solid')).toBe(true)
    expect(hasWant(res, 'rounded', 'md')).toBe(true)
    expect(hasWant(res, 'borderX', '2px solid')).toBe(true)
  })

  it('maps responsive arrays to the canonical breakpoint scale', async () => {
    const code = `
      export function App() {
        return <Div p={['1r', '2r', '4r', '8r']} />
      }
    `
    const res = await compileVirtual({ 'App.tsx': code })
    expect(hasWant(res, 'p', '1r', ['base'])).toBe(true)
    expect(hasWant(res, 'p', '2r', ['sm'])).toBe(true)
    expect(hasWant(res, 'p', '4r', ['md'])).toBe(true)
    expect(hasWant(res, 'p', '8r', ['lg'])).toBe(true)
  })
})
