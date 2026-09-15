/**
 * Proof stations for locked canon aliases and responsive array scales in atomic.
 * Asserts that locked aliases (mt, px, w, flexDir) extract as style props,
 * while refused shortcuts (rounded, c, pos, ps, borderX) do not.
 * Asserts responsive array mapping against default and custom token scales.
 */
import { describe, expect, it } from 'vitest'
import { compile } from '../js/index.js'
import { hasWant } from './helpers.js'

describe('canon locked alias consumption', () => {
  it('extracts locked authoring aliases into style wants', async () => {
    const result = await compile({
      files: [
        {
          path: 'test.tsx',
          content: `
            export const Comp = () => (
              <Div
                mt="2r"
                px="4r"
                w="100px"
                flexDir="column"
                bg="blue.500"
              />
            )
          `,
        },
      ],
    })

    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(hasWant(result, 'px', '4r')).toBe(true)
    expect(hasWant(result, 'w', '100px')).toBe(true)
    expect(hasWant(result, 'flexDir', 'column')).toBe(true)
    expect(hasWant(result, 'bg', 'blue.500')).toBe(true)
  })

  it('refuses non-canonical shortcuts from extracting as style props', async () => {
    const result = await compile({
      files: [
        {
          path: 'test.tsx',
          content: `
            export const Comp = () => (
              <Div
                rounded="md"
                c="red"
                pos="absolute"
                ps="16px"
                borderX="1px solid"
                shadow="sm"
                ring="2px solid"
                b="1px solid"
              />
            )
          `,
        },
      ],
    })

    expect(result.wants ?? []).toHaveLength(0)
    expect(hasWant(result, 'rounded', 'md')).toBe(false)
    expect(hasWant(result, 'c', 'red')).toBe(false)
    expect(hasWant(result, 'pos', 'absolute')).toBe(false)
    expect(hasWant(result, 'ps', '16px')).toBe(false)
    expect(hasWant(result, 'borderX', '1px solid')).toBe(false)
    expect(hasWant(result, 'shadow', 'sm')).toBe(false)
    expect(hasWant(result, 'ring', '2px solid')).toBe(false)
    expect(hasWant(result, 'b', '1px solid')).toBe(false)
  })

  it('supports custom array-slot breakpoint scales from compile request', async () => {
    const result = await compile({
      files: [
        {
          path: 'test.tsx',
          content: `export const Comp = () => <Div mt={['1r', '2r', '4r']} />`,
        },
      ],
      breakpoints: ['tablet', 'desktop'],
    })

    expect(hasWant(result, 'mt', '1r', ['base'])).toBe(true)
    expect(hasWant(result, 'mt', '2r', ['tablet'])).toBe(true)
    expect(hasWant(result, 'mt', '4r', ['desktop'])).toBe(true)
  })

  it('supports custom array-slot breakpoint scales from tokens configuration', async () => {
    const result = await compile({
      files: [
        {
          path: 'test.tsx',
          content: `export const Comp = () => <Div p={['10px', '20px', '30px']} />`,
        },
      ],
      tokens: {
        breakpoints: {
          wide: '1200px',
          ultra: '1800px',
        },
      },
    })

    expect(hasWant(result, 'p', '10px', ['base'])).toBe(true)
    expect(hasWant(result, 'p', '20px', ['wide'])).toBe(true)
    expect(hasWant(result, 'p', '30px', ['ultra'])).toBe(true)
    expect(result.stylesheet).toContain('@container (min-width: 1200px)')
    expect(result.stylesheet).toContain('@container (min-width: 1800px)')
  })
})
