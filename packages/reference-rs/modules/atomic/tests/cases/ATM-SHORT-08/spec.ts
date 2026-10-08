/**
 * Text-gradient station (ATM-SHORT-08, RS-22). `textGradient` expands to
 * the Panda clip trio — `background-image` with resolved refs plus
 * `-webkit-background-clip: text` and `color: transparent` — never the
 * dead `text-gradient` property. Conditions fan out over all three atoms.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'
const GRADIENT = 'linear-gradient({colors.red.200}, {colors.blue.300})'
const HOVER_GRADIENT = 'linear-gradient({colors.red.500}, {colors.blue.500})'
const BG = `${SYSTEM}__background-image_linear-gradient({colors.red.200},_{colors.blue.300})`
const COLOR = `${SYSTEM}__c_transparent`
const CLIP = `${SYSTEM}__-webkit-background-clip_text`
const HOVER_BG = `${SYSTEM}__[&:hover]:background-image_linear-gradient({colors.red.500},_{colors.blue.500})`
const HOVER_COLOR = `${SYSTEM}__[&:hover]:c_transparent`
const HOVER_CLIP = `${SYSTEM}__[&:hover]:-webkit-background-clip_text`

const spec: AtomicCaseSpec = {
  id: 'ATM-SHORT-08',
  verify(result) {
    expect(hasWant(result, 'textGradient', GRADIENT)).toBe(true)
    expect(hasWant(result, 'textGradient', HOVER_GRADIENT, ['&:hover'])).toBe(true)

    const sheet = result.stylesheet
    expect(sheet).toContain(
      'background-image: linear-gradient(var(--colors-red-200), var(--colors-blue-300));',
    )
    expect(sheet).toContain('-webkit-background-clip: text;')
    expect(sheet).toContain('color: transparent;')
    expect(sheet).not.toContain('text-gradient')
    expect(result.css?.classes).toEqual({
      [`backgroundImage:${GRADIENT}`]: BG,
      'color:transparent': COLOR,
      'webkitBackgroundClip:text': CLIP,
      [`&:hover:backgroundImage:${HOVER_GRADIENT}`]: HOVER_BG,
      '&:hover:color:transparent': HOVER_COLOR,
      '&:hover:webkitBackgroundClip:text': HOVER_CLIP,
    })

    const plans = result.stylePlans
    expect(plans).toHaveLength(2)
    const base = plans.find(p => p.when.length === 0)
    expect(base?.declarations.map(d => d.className).sort()).toEqual(
      [BG, COLOR, CLIP].sort(),
    )
    const hover = plans.find(p => p.when.length === 1)
    expect(hover?.when).toEqual(['&:hover'])
    expect(hover?.declarations.map(d => d.className).sort()).toEqual(
      [HOVER_BG, HOVER_COLOR, HOVER_CLIP].sort(),
    )

    expect(result.diagnostics).toEqual([])
  },
}

export default spec
