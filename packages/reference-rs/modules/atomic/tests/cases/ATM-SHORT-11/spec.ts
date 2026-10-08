/**
 * Flex station (ATM-SHORT-11, RS-39). The four Panda flex utility keywords
 * map to their emitted triples; every other value passes through raw. No
 * flex value ever decomposes into grow/shrink/basis longhands (the border
 * family gate refuses the len-3 flex trio).
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SHORT-11',
  verify(result) {
    expect(hasWant(result, 'flex', '1')).toBe(true)
    expect(hasWant(result, 'flex', 1)).toBe(true)
    expect(hasWant(result, 'flex', '1 1 0%')).toBe(true)
    expect(hasWant(result, 'flex', '0 0 auto')).toBe(true)
    expect(hasWant(result, 'flex', 'auto')).toBe(true)
    expect(hasWant(result, 'flex', '2 30px')).toBe(true)

    const sheet = result.stylesheet
    // Panda triple shapes: string '1', numeric 1, and the literal triple
    // converge on one declaration; auto/initial/none map per the table.
    expect(sheet).toContain('flex: 1 1 0%;')
    expect(sheet).toContain('flex: 1 1 auto;')
    expect(sheet).toContain('flex: 0 1 auto;')
    expect(sheet).toContain('flex: none;')
    // Raw passthrough: multi-token and unmapped values print authored.
    expect(sheet).toContain('flex: 0 0 auto;')
    expect(sheet).toContain('flex: 2 30px;')
    expect(sheet).toContain('flex: 2;')
    expect(sheet).toContain('flex: inherit;')
    // The RS-39 defect shape: never decompose into flex longhands.
    expect(sheet).not.toContain('flex-grow:')
    expect(sheet).not.toContain('flex-shrink:')
    expect(sheet).not.toContain('flex-basis:')

    const classes = result.css?.classes ?? {}
    const flexKeys = Object.keys(classes).filter(k => k.startsWith('flex:'))
    expect(flexKeys.length).toBeGreaterThan(0)
    for (const key of flexKeys) {
      expect(key.startsWith('flexGrow:')).toBe(false)
      expect(key.startsWith('flexShrink:')).toBe(false)
      expect(key.startsWith('flexBasis:')).toBe(false)
    }

    expect(result.diagnostics).toEqual([])
  },
}

export default spec
