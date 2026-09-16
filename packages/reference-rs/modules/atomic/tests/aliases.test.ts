/**
 * Proof stations for locked canon aliases and responsive array scales in atomic.
 * Asserts that locked aliases (mt, px, w, flexDir) extract as style props,
 * while refused shortcuts (rounded, c, pos, ps, borderX) do not.
 * Asserts responsive array mapping against the profile scale with authored names appended.
 */
import { describe, expect, it } from 'vitest'
import { compile } from '../js/index.js'
import type { EvaluatedSystemSpec } from '../js/types.js'
import evaluatedSystemSpecJson from '../../../contracts/fixtures/evaluated-system-spec.json'
import { hasWant } from './helpers.js'

const specSystem = evaluatedSystemSpecJson as EvaluatedSystemSpec

describe('canon locked alias consumption', () => {
  it('extracts locked authoring aliases into style wants', async () => {
    const result = await compile({
      baseSystem: specSystem,
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
      baseSystem: { ...specSystem, staticCss: {} },
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

  it('maps array slots onto the profile scale with authored names appended', async () => {
    const result = await compile({
      baseSystem: {
        ...specSystem,
        name: 'custom-scale',
        breakpoints: { tablet: '700px', desktop: '1400px' },
      },
      files: [
        {
          path: 'test.tsx',
          content: `export const Comp = () => <Div mt={['1r', '1r', '1r', '1r', '1r', '1r', '2r', '4r']} />`,
        },
      ],
    })

    expect(hasWant(result, 'mt', '1r', ['base'])).toBe(true)
    expect(hasWant(result, 'mt', '1r', ['sm'])).toBe(true)
    expect(hasWant(result, 'mt', '2r', ['tablet'])).toBe(true)
    expect(hasWant(result, 'mt', '4r', ['desktop'])).toBe(true)
  })

  it('maps array slots onto profile widths with authored widths appended', async () => {
    const result = await compile({
      baseSystem: {
        ...specSystem,
        name: 'custom-widths',
        breakpoints: { wide: '1200px', ultra: { value: '1800px' } },
      },
      files: [
        {
          path: 'test.tsx',
          content: `export const Comp = () => <Div p={['10px', '10px', '10px', '10px', '10px', '10px', '20px', '30px']} />`,
        },
      ],
    })

    expect(hasWant(result, 'p', '10px', ['base'])).toBe(true)
    expect(hasWant(result, 'p', '20px', ['wide'])).toBe(true)
    expect(hasWant(result, 'p', '30px', ['ultra'])).toBe(true)
  })
})
