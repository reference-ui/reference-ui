/**
 * Importance-spelling station. Spaced and case-insensitive `!important`
 * markers set importance with the marker stripped; a bang inside a quoted
 * string value stays literal and unimportant.
 */
import { expect } from 'vitest'
import { getWantsForProp, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LEAF-10',
  verify(result) {
    const padding = getWantsForProp(result, 'padding')
    expect(padding).toHaveLength(1)
    expect(padding[0]?.important).toBe(true)
    expect(padding[0]?.value).toEqual({ String: '0' })
    const color = getWantsForProp(result, 'color')
    expect(color).toHaveLength(1)
    expect(color[0]?.important).toBe(true)
    expect(color[0]?.value).toEqual({ String: 'red' })
    const content = getWantsForProp(result, 'content')
    expect(content).toHaveLength(1)
    expect(content[0]?.important).toBe(false)
    expect(content[0]?.value).toEqual({ String: '"hello!"' })
    expect(result.stylesheet).toContain('padding: 0 !important;')
    expect(result.stylesheet).toContain('color: red !important;')
    expect(result.stylesheet).toContain('content: "hello!";')
    expect(result.stylesheet).not.toContain('content: "hello!" !important;')
    const classes = Object.values(result.css?.classes ?? {})
    expect(classes).toContain('@reference-ui/lib__p_0!')
  },
}

export default spec
