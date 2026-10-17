// Unit tests for css() font family and weight scoping over the shared namer fixture. They take font and weight
// objects and assert the scoped classes they construct, with the keyword and conflict fallbacks. Registration is
// module state, so the suite registers once up front.

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { css, registerRuntimeData } from './css.ts'
import { ARTIFACT } from './__fixtures__/css-fixtures.ts'

beforeAll(() => {
  registerRuntimeData('test', ARTIFACT)
})

// Miss diagnostics warn by design; silence the channel for this suite.
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('css() family scoping', () => {
  it('scopes a bare weight to the sibling font in one call', () => {
    expect(css({ font: 'sans', weight: 'thin' })).toBe(
      'test__font-family_sans test__font-weight_200 test__letterSpacing_-0.01em'
    )
  })

  it('scopes across arguments: font in one, weight in another', () => {
    expect(css({ fontFamily: 'sans' }, { weight: 'thin' })).toBe(
      'test__font-family_sans test__font-weight_200'
    )
  })

  it('resolves serif and mono normal to their scale weights', () => {
    expect(css({ font: 'serif', weight: 'normal' })).toBe(
      'test__font-family_serif test__font-weight_373 test__letterSpacing_normal'
    )
    expect(css({ fontFamily: 'serif', weight: 'normal' })).toBe(
      'test__font-family_serif test__font-weight_373'
    )
    expect(css({ fontFamily: 'mono', weight: 'normal' })).toBe(
      'test__font-family_mono test__font-weight_393'
    )
  })

  it('falls a lone keyword weight back to the keyword table', () => {
    expect(css({ weight: 'thin' })).toBe('test__font-weight_100')
  })

  it('keeps importance while scoping', () => {
    expect(css({ fontFamily: 'sans', weight: 'thin!' })).toBe(
      'test__font-family_sans test__font-weight_200!'
    )
  })

  it('falls a conditional weight back to the base font', () => {
    // Discriminating pairs: `serif.normal` is 373 and `sans.thin` is 200, so
    // each class differs from the bare keyword (400 / 100) the base fallback
    // would resolve to without scoping.
    expect(css({ fontFamily: 'serif', _hover: { weight: 'normal' } })).toBe(
      'test__font-family_serif test__hover:font-weight_373'
    )
    expect(css({ fontFamily: 'sans', _hover: { weight: 'thin' } })).toBe(
      'test__font-family_sans test__hover:font-weight_200'
    )
  })

  it('lets a same-condition font beat the base font', () => {
    expect(css({ fontFamily: 'sans', _hover: { fontFamily: 'serif', weight: 'normal' } })).toBe(
      'test__font-family_sans test__hover:font-family_serif test__hover:font-weight_373'
    )
  })

  it('passes an explicit scoped weight through', () => {
    expect(css({ fontFamily: 'sans', weight: 'sans.thin' })).toBe(
      'test__font-family_sans test__font-weight_200'
    )
  })
})

describe('css() family scoping: conflicts and interim shapes', () => {
  it('passes numeric and unknown weights through', () => {
    expect(css({ fontFamily: 'sans', weight: 393 })).toBe(
      'test__font-family_sans test__font-weight_393'
    )
    expect(css({ fontFamily: 'sans', weight: 'extra-bold' })).toBe(
      'test__font-family_sans test__font-weight_extra-bold'
    )
  })

  it('declines to scope when two families conflict', () => {
    // All three outcomes differ here: decline keeps the keyword 400, a
    // first-family-wins bug would give 373 (`serif.normal`), and a
    // last-family-wins bug would give 393 (`mono.normal`).
    expect(css({ fontFamily: 'serif' }, { fontFamily: 'mono', weight: 'normal' })).toBe(
      'test__font-family_mono test__font-weight_400'
    )
  })

  it('scopes a dynamic variable-held string like a literal', () => {
    const dynamic = 'thin'
    expect(css({ fontFamily: 'sans', weight: dynamic })).toBe(
      'test__font-family_sans test__font-weight_200'
    )
  })

  it('pins the responsive interim: object leaves stay keyword-scoped', () => {
    // follow-up: leaf descent into responsive weight objects needs a
    // breakpoint-`when` semantics decision (condWhen vs slotWhen).
    expect(css({ fontFamily: 'sans', weight: { base: 'thin', md: 'bold' } })).toBe(
      'test__font-family_sans test__font-weight_100 test__md:font-weight_700'
    )
  })

  it('pins the remaining F3 shapes as KNOWN-DIVERGENT interim behavior', () => {
    // follow-up: same leaf-descent follow-up as the object pin above. The
    // static pass fans responsive values out into scalar wants before it
    // scopes (F3), so it resolves each leaf against the family scale; the
    // runtime scopes string queries only and falls these shapes to the
    // keyword table. Runtime outputs here are the interim truth, not parity.
    // (a) weight array: static `sans.thin` → 200, runtime keyword → 100.
    expect(css({ fontFamily: 'sans', weight: ['thin'] })).toBe(
      'test__font-family_sans test__font-weight_100'
    )
    // (b) object + object: static `sans.thin` → 200, runtime keyword → 100.
    expect(css({ fontFamily: { base: 'sans' }, weight: { base: 'thin' } })).toBe(
      'test__font-family_sans test__font-weight_100'
    )
    // (c) font-object + string-weight: unscoped on both sides (parity), so
    // this is a tripwire against a naive future "fix" scoping one side only.
    expect(css({ font: { base: 'sans' }, weight: 'thin' })).toBe(
      'test__font-family_sans test__letterSpacing_-0.01em test__font-weight_100'
    )
  })
})
