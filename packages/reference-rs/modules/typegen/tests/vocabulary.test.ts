/**
 * Native Node-API seam tests for the typegen StyleProps vocabulary.
 * Verifies that primitivesVocabulary returns the assembled PropDefs names as JSON.
 * Asserts prop domains, condition keys, aliases, and dialect keys round-trip intact.
 * Pins the vocabulary props equal to the StyleProps keys of the style golden.
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { primitivesVocabulary } from '../js/index.js'

const here = dirname(fileURLToPath(import.meta.url))

function goldenStylePropKeys(): string[] {
  const golden = readFileSync(resolve(here, 'goldens/styles.d.ts'), 'utf8')
  const lines = golden.split('\n')
  const head = lines.findIndex(line => line === 'export type StyleProps = FontProps & {')
  const keys: string[] = []
  for (const line of lines.slice(head + 1)) {
    if (line === '};') break
    const match = /^  (\S+?)\?: StylePropValue/.exec(line)
    if (!match || match[1].startsWith('[K in')) continue
    keys.push(match[1].replace(/^'|'$/g, ''))
  }
  return keys.sort()
}

describe('typegen vocabulary seam', () => {
  it('TYP-VOCAB-01 returns prop names with domains, conditions, aliases, and dialect keys', () => {
    const vocab = primitivesVocabulary()

    expect([...vocab.props].sort()).toEqual(vocab.props)
    expect(vocab.props).toContain('backgroundColor')
    expect(vocab.props).toContain('bg')
    expect(vocab.props).toContain('color')
    expect(vocab.props).toContain('container')
    expect(vocab.props).toContain('r')
    expect(vocab.props).toContain('size')
    expect(vocab.props).not.toContain('variant')
    expect(vocab.props).not.toContain('colorMode')
    expect(vocab.props).not.toContain('font')
    expect(vocab.props).not.toContain('weight')

    expect(vocab.domains['color']).toBe('color')
    expect(vocab.domains['bg']).toBe('color')
    expect(vocab.domains['p']).toBe('spacing')
    expect(vocab.domains['mt']).toBe('spacing')
    expect(vocab.domains['container']).toBe('container')
    expect(vocab.domains['r']).toBe('rhythm')
    expect(vocab.domains['display']).toBe('open')
    expect(Object.keys(vocab.domains).sort()).toEqual(vocab.props)

    expect(vocab.conditions).toContain('_dark')
    expect(vocab.conditions).toContain('_hover')
    expect(vocab.conditions.every(key => !key.startsWith('@'))).toBe(true)

    expect(vocab.aliases['bg']).toBe('background')
    expect(vocab.aliases['mt']).toBe('marginTop')
    expect(vocab.aliases['p']).toBe('padding')

    expect(vocab.dialect).toContain('r')
    expect(vocab.dialect).toContain('size')
    expect(vocab.dialect).toContain('variant')
    expect(vocab.dialect).toContain('colorMode')
  })

  it('TYP-VOCAB-02 round-trips deterministically across repeated calls', () => {
    const first = primitivesVocabulary()
    const second = primitivesVocabulary()

    expect(second).toEqual(first)
    expect(JSON.parse(JSON.stringify(first))).toEqual(first)
  })

  it('TYP-VOCAB-03 vocabulary props equal the style golden StyleProps key set', () => {
    const vocab = primitivesVocabulary()

    expect(vocab.props).toEqual(goldenStylePropKeys())
  })
})
