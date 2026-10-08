// Unit tests for the Neo css() runtime over the runtime namer.
// They take style objects and assert constructed classes plus merge behavior.
// Registration is module state, so the suite registers once up front.

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NamerTables, NativeRuntimeArtifact } from '@reference-ui/rust/contracts'
import { NAMER_RULES_VERSION } from '@reference-ui/rust/namer'
import { css, registerRuntimeData } from './css.ts'

const TABLES: NamerTables = {
  rulesVersion: NAMER_RULES_VERSION,
  aliases: { p: 'padding', w: 'width' },
  prefixes: {
    backgroundColor: 'bg-c',
    backgroundImage: 'background-image',
    color: 'c',
    content: 'content',
    fontFamily: 'font-family',
    fontWeight: 'font-weight',
    opacity: 'op',
    outlineColor: 'outline-c',
    padding: 'p',
    width: 'w',
    zIndex: 'z',
  },
  lowerings: {
    font: [{ macro: 'font' }],
    weight: [{ macro: 'weight' }],
  },
  keywords: {},
  weightKeywords: [
    ['thin', '100'],
    ['light', '300'],
    ['normal', '400'],
    ['semibold', '600'],
    ['bold', '700'],
    ['black', '900'],
  ],
  colorProps: ['backgroundColor', 'color', 'outlineColor'],
  breakpoints: ['base', 'sm', 'md'],
  breakpointWidths: { sm: '640', md: '768' },
  conditions: ['_dark', '_hover', 'dark', 'hover'],
  fonts: {
    sans: {
      weight: 'normal',
      weights: {
        thin: '200',
        light: '300',
        normal: '400',
        semibold: '600',
        bold: '700',
        black: '900',
      },
      css: [
        ['letterSpacing', '-0.01em'],
        ['fontWeight', 'normal'],
      ],
    },
    serif: {
      weight: 'normal',
      weights: {
        thin: '100',
        light: '300',
        normal: '373',
        semibold: '600',
        bold: '700',
        black: '900',
      },
      css: [
        ['letterSpacing', 'normal'],
        ['fontWeight', 'normal'],
      ],
    },
    mono: {
      weight: 'normal',
      weights: {
        thin: '100',
        light: '300',
        normal: '393',
        semibold: '600',
        bold: '700',
      },
      css: [
        ['letterSpacing', '-0.04em'],
        ['fontWeight', 'normal'],
      ],
    },
  },
}

const ARTIFACT: NativeRuntimeArtifact = {
  schemaVersion: 2,
  namer: TABLES,
  recipes: {},
  stylePropNames: ['color', 'p', 'font', 'fontFamily', 'fontWeight', 'weight'],
}

const CONTAINER_CLASS = 'test__[@container_(min-width:_320px)]:c_paper'

beforeAll(() => {
  registerRuntimeData('test', ARTIFACT)
})

// Miss diagnostics warn by design; silence the channel while keeping every
// call observable to the spying tests below.
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

function warnedMessages(): string[] {
  return vi.mocked(console.warn).mock.calls.map(args => String(args[0]))
}

describe('css() resolution', () => {
  it('resolves flat declarations to classes', () => {
    expect(css({ color: 'brand', p: 'sm' })).toBe('test__c_brand test__p_sm')
  })

  it('collapses shared slots last-wins across arguments', () => {
    expect(css({ color: 'brand' }, { color: 'ink' })).toBe('test__c_ink')
    expect(css([{ color: 'brand' }, { color: 'ink' }])).toBe('test__c_ink')
  })

  it('resolves nested conditions into whens', () => {
    expect(css({ _hover: { color: 'brand' } })).toBe('test__hover:c_brand')
  })

  it('lowers r sugar to the container query class', () => {
    expect(css({ r: { 320: { color: 'paper' } } })).toBe(CONTAINER_CLASS)
    expect(css({ '@container (min-width: 320px)': { color: 'paper' } })).toBe(CONTAINER_CLASS)
  })

  it('splits important markers into the important class', () => {
    expect(css({ color: 'brand!' })).toBe('test__c_brand!')
  })

  it('marks every important spelling and strips the marker', () => {
    expect(css({ color: 'brand !important' })).toBe('test__c_brand!')
    expect(css({ color: 'brand!IMPORTANT' })).toBe('test__c_brand!')
    expect(css({ color: 'brand!important' })).toBe('test__c_brand!')
    expect(css({ color: 'brand  !Important' })).toBe('test__c_brand!')
  })

  it('leaves bangs inside quoted strings literal and unimportant', () => {
    expect(css({ content: '"hello!"' })).toBe('test__content_"hello!"')
  })

  it('omits null, false, and undefined leaves without ghost classes', () => {
    expect(css({ color: null, p: false, bogus: undefined })).toBe('')
    expect(css({ color: 'brand', p: null, bogus: false })).toBe('test__c_brand')
    expect(css({ color: 'brand', _hover: { color: null } })).toBe('test__c_brand')
    expect(css({ color: 'brand' }, { color: null }, { p: 'sm' })).toBe('test__c_brand test__p_sm')
  })

  it('constructs miss classes and skips conditional skips', () => {
    expect(css({ color: 'nope', bogus: 'x' })).toBe('test__c_nope test__bogus_x')
    expect(css({ color: 'brand' }, undefined, null, false)).toBe('test__c_brand')
  })

  it('resolves unitless numbers and custom-prop numbers to numeric classes', () => {
    expect(css({ width: 42, opacity: 1, zIndex: 0, '--foo': 42 })).toBe(
      'test__w_42 test__op_1 test__z_0 test__--foo_42'
    )
  })

  it('resolves custom-prop objects as one responsive value, never a condition', () => {
    // `--x` is absent from stylePropNames on purpose: the `--` prefix
    // rule alone must route the object to the whole-object naming.
    expect(css({ '--x': { base: '1', md: '2' } })).toBe('test__--x_1 test__md:--x_2')
    expect(warnedMessages()).toHaveLength(0)
  })

  it('resolves composite token-ref strings by authored spelling', () => {
    expect(css({ backgroundImage: 'linear-gradient({colors.red.500}, {colors.blue.500})' })).toBe(
      'test__background-image_linear-gradient({colors.red.500},_{colors.blue.500})'
    )
  })

  it('resolves arbitrary function values verbatim, one class each', () => {
    expect(css({ color: 'rgba(255,255,255,0.04)' })).toBe('test__c_rgba(255,255,255,0.04)')
    expect(css({ backgroundColor: 'color-mix(in oklch, currentColor 14%, transparent)' })).toBe(
      'test__bg-c_color-mix(in_oklch,_currentColor_14%,_transparent)'
    )
    expect(css({ width: 'calc(100% - 8px)' })).toBe('test__w_calc(100%_-_8px)')
  })
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

describe('css() merge', () => {
  it('lets an important atom beat a plain atom in one call either order', () => {
    expect(css({ color: 'brand!' }, { color: 'ink' })).toBe('test__c_brand!')
    expect(css({ color: 'ink' }, { color: 'brand!' })).toBe('test__c_brand!')
  })

  it('collapses a later responsive array last-wins per breakpoint slot', () => {
    expect(css({ width: ['50px', '60px'] }, { width: ['70px', '80px'] })).toBe(
      'test__w_70px test__sm:w_80px'
    )
  })

  it('still nests objects under unknown keys to nothing', () => {
    expect(css({ bogus: { x: 'y' } })).toBe('')
    expect(warnedMessages()).toHaveLength(0)
  })

  it('orders base, container, and theme classes by author order', () => {
    expect(css({ color: 'brand' }, { _dark: { color: 'paper' } }, { r: { 320: { color: 'paper' } } })).toBe(
      `test__c_brand test__dark:c_paper ${CONTAINER_CLASS}`
    )
    expect(css({ _dark: { color: 'paper' } }, { color: 'brand' })).toBe(
      'test__dark:c_paper test__c_brand'
    )
  })

  it('keeps constructed longhand families apart', () => {
    expect(css({ color: 'brand', outlineColor: 'brand' })).toBe(
      'test__c_brand test__outline-c_brand'
    )
  })
})

describe('css() miss diagnostics', () => {
  it('constructs the miss class and stays silent in node', () => {
    expect(css({ color: 'shade-m6ax' })).toBe('test__c_shade-m6ax')
    expect(warnedMessages()).toHaveLength(0)
  })

  it('constructs the conditioned miss class and stays silent in node', () => {
    expect(css({ _hover: { color: 'shade-m6hw' } })).toBe('test__hover:c_shade-m6hw')
    expect(warnedMessages()).toHaveLength(0)
  })

  it('constructs the last miss on repeats and stays silent', () => {
    for (let round = 0; round < 2; round++) {
      expect(css({ color: 'shade-m6r1' }, { color: 'shade-m6r2' })).toBe('test__c_shade-m6r2')
    }

    expect(warnedMessages()).toHaveLength(0)
  })

  it('stays silent for hits, holes, and conditional skips', () => {
    expect(css({ color: 'brand', p: 'sm' })).toBe('test__c_brand test__p_sm')
    expect(css({ color: null, p: false, bogus: undefined })).toBe('')
    expect(css({ color: 'brand' }, undefined, null, false)).toBe('test__c_brand')
    expect(css([{ color: 'brand' }, false])).toBe('test__c_brand')

    expect(warnedMessages()).toHaveLength(0)
  })

  it('stays silent in production builds', () => {
    vi.stubEnv('NODE_ENV', 'production')

    expect(css({ color: 'shade-m6pd' })).toBe('test__c_shade-m6pd')
    expect(warnedMessages()).toHaveLength(0)
  })
})

describe('registerRuntimeData guards', () => {
  afterEach(() => {
    registerRuntimeData('test', ARTIFACT)
  })

  it('throws on a schemaVersion 1 artifact', () => {
    const legacy = { ...ARTIFACT, schemaVersion: 1 } as unknown as NativeRuntimeArtifact

    expect(() => registerRuntimeData('test', legacy)).toThrowError(/schemaVersion/)
  })

  it('throws on a namer rulesVersion skew', () => {
    const skewed: NativeRuntimeArtifact = {
      ...ARTIFACT,
      namer: { ...TABLES, rulesVersion: NAMER_RULES_VERSION + 1 },
    }

    expect(() => registerRuntimeData('test', skewed)).toThrowError(/rulesVersion/)
  })
})

describe('css() without registration', () => {
  it('throws loud on a fresh module', async () => {
    vi.resetModules()
    const fresh = await import('./css.ts')

    expect(() => fresh.css({ color: 'brand' })).toThrowError(/registerRuntimeData/)
  })
})
