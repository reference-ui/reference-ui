import { describe, expect, it } from 'vitest'
import { flattenCssCascadeLayersForTests } from './setup'

describe('flattenCssCascadeLayersForTests', () => {
  it('removes @layer prelude statements', () => {
    const css = '@layer base, tokens;\n.x{color:red}'
    const out = flattenCssCascadeLayersForTests(css)
    expect(out).not.toMatch(/@layer base/)
    expect(out).toMatch(/\.x\{color:red\}/)
  })

  it('unwraps nested @layer blocks so rules are not inside @layer', () => {
    const css = '@layer outer { @layer inner { .box { background-color: rgb(1, 2, 3); } } }'
    const out = flattenCssCascadeLayersForTests(css)
    expect(out).not.toContain('@layer')
    expect(out).toMatch(/\.box/)
    expect(out).toMatch(/rgb\(1,\s*2,\s*3\)/)
  })
})
