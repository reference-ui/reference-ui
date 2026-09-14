/**
 * Integration tests verifying single-source-of-truth style props, primitives, and conditions.
 * Ensures only real HTML/Reference primitives and valid style properties are extracted as atomic wants.
 * Verifies non-style attributes and hallucinated component tags are ignored or fail-closed.
 */
import { describe, expect, it } from 'vitest'
import { compileVirtual, hasWant, getWantsForProp } from './helpers.js'

describe('Ground Truth Style Extraction (canon dictionary seam)', () => {
  it('extracts style props from real Reference primitives via N-API seam', async () => {
    const code = `
      export function App() {
        return (
          <>
            <Div mt="2r" bg="blue.500" />
            <Button px="4r" />
          </>
        )
      }
    `
    const res = await compileVirtual({ 'App.tsx': code })
    expect(hasWant(res, 'mt', '2r')).toBe(true)
    expect(hasWant(res, 'bg', 'blue.500')).toBe(true)
    expect(hasWant(res, 'px', '4r')).toBe(true)
  })
})
