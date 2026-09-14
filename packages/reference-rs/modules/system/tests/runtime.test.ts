/**
 * Contract test suite for CSS runtime metadata, class mapping dictionaries, and single namer parity.
 * Confirms that compilation produces expected runtime dictionary shapes and exact class mappings.
 * Protects the structural contract between native compilation output and browser runtime consumers.
 */
import { describe, expect, it } from 'vitest'
import { compileFixture, compileVirtualSync, SEED_CONTRACT_DIR } from './helpers.js'

describe('system runtime heartbeat and class mapping', () => {
  it('provides default empty classes map for seed baseline', async () => {
    const result = await compileFixture(SEED_CONTRACT_DIR)
    expect(result.css).toBeDefined()
    expect(result.css.classes ?? {}).toEqual({})
  })

  it('matches expected seed contract shape', async () => {
    const result = await compileFixture(SEED_CONTRACT_DIR)
    expect(result).toHaveProperty('stylesheet')
    expect(result).toHaveProperty('css')
    expect(result).toHaveProperty('diagnostics')
  })

  it('emits bijective runtime class mappings matching stylesheet classes', () => {
    const code = `
      export const Card = () => (
        <Div
          mt="2r"
          bg="blue.600"
          _hover={{ color: "red.500" }}
        />
      )
    `
    const result = compileVirtualSync({ 'src/Card.tsx': code })
    const classes = result.css.classes ?? {}

    // Runtime dictionary maps prop:value to canonical class name
    expect(classes['mt:2r']).toBe('mt_2r')
    expect(classes['bg:blue.600']).toBe('bg_blue.600')
    expect(classes['_hover:color:red.500']).toBe('hover:c_red.500')

    // Stylesheet contains exact matching class selectors
    expect(result.stylesheet).toContain('.mt_2r {')
    expect(result.stylesheet).toContain('.bg_blue\\.600 {')
    expect(result.stylesheet).toContain('.hover\\:c_red\\.500:is(:hover, [data-hover]) {')
  })
})
