// Unit tests for the Neo css() runtime over registered plans.
// They take style objects and assert resolved classes plus miss behavior.
// Registration is module state, so the suite registers once up front.

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NativeRuntimeArtifact } from '@reference-ui/rust/contracts'
import { css, registerRuntimeData } from './css.ts'

const ARTIFACT: NativeRuntimeArtifact = {
  schemaVersion: 1,
  stylePlans: [
    {
      system: 'test',
      when: [],
      prop: 'color',
      value: 'brand',
      important: false,
      declarations: [{ slot: 'color', className: 'test__c_brand' }],
    },
    {
      system: 'test',
      when: [],
      prop: 'color',
      value: 'ink',
      important: false,
      declarations: [{ slot: 'color', className: 'test__c_ink' }],
    },
    {
      system: 'test',
      when: [],
      prop: 'color',
      value: 'brand',
      important: true,
      declarations: [{ slot: 'color', className: 'test__c_brand!' }],
    },
    {
      system: 'test',
      when: [],
      prop: 'p',
      value: 'sm',
      important: false,
      declarations: [{ slot: 'padding', className: 'test__p_sm' }],
    },
    {
      system: 'test',
      when: ['_hover'],
      prop: 'color',
      value: 'brand',
      important: false,
      declarations: [{ slot: 'hover:color', className: 'test__hover:c_brand' }],
    },
    {
      system: 'test',
      when: ['@container (min-width: 320px)'],
      prop: 'color',
      value: 'paper',
      important: false,
      declarations: [{ slot: '@container (min-width: 320px):color', className: 'test__cq:c_paper' }],
    },
    {
      system: 'test',
      when: [],
      prop: 'content',
      value: '"hello!"',
      important: false,
      declarations: [{ slot: 'content', className: 'test__content_hello' }],
    },
    {
      system: 'test',
      when: [],
      prop: 'content',
      value: '"hello!"',
      important: true,
      declarations: [{ slot: 'content', className: 'test__content_hello!' }],
    },
    {
      system: 'test',
      when: [],
      prop: 'width',
      value: 42,
      important: false,
      declarations: [{ slot: 'width', className: 'test__w_42' }],
    },
    {
      system: 'test',
      when: [],
      prop: 'opacity',
      value: 1,
      important: false,
      declarations: [{ slot: 'opacity', className: 'test__op_1' }],
    },
    {
      system: 'test',
      when: [],
      prop: 'zIndex',
      value: 0,
      important: false,
      declarations: [{ slot: 'zIndex', className: 'test__z_0' }],
    },
    {
      system: 'test',
      when: [],
      prop: '--foo',
      value: 42,
      important: false,
      declarations: [{ slot: '--foo', className: 'test__--foo_42' }],
    },
    {
      system: 'test',
      when: [],
      prop: 'backgroundImage',
      value: 'linear-gradient({colors.red.500}, {colors.blue.500})',
      important: false,
      declarations: [{ slot: 'backgroundImage', className: 'test__bg-img_grad' }],
    },
    {
      system: 'test',
      when: [],
      prop: 'color',
      value: 'rgba(255,255,255,0.04)',
      important: false,
      declarations: [{ slot: 'color', className: 'test__c_rgba' }],
    },
    {
      system: 'test',
      when: [],
      prop: 'backgroundColor',
      value: 'color-mix(in oklch, currentColor 14%, transparent)',
      important: false,
      declarations: [{ slot: 'backgroundColor', className: 'test__bg-c_mix' }],
    },
    {
      system: 'test',
      when: [],
      prop: 'width',
      value: 'calc(100% - 8px)',
      important: false,
      declarations: [{ slot: 'width', className: 'test__w_calc' }],
    },
    {
      system: 'test',
      when: ['_dark'],
      prop: 'color',
      value: 'paper',
      important: false,
      declarations: [{ slot: 'dark:color', className: 'test__dark:c_paper' }],
    },
    {
      system: 'test',
      when: [],
      prop: 'width',
      value: ['50px', '60px'],
      important: false,
      declarations: [
        { slot: 'width@base', className: 'test__w_50px' },
        { slot: 'width@sm', className: 'test__sm:w_60px' },
      ],
    },
    {
      system: 'test',
      when: [],
      prop: 'width',
      value: ['70px', '80px'],
      important: false,
      declarations: [
        { slot: 'width@base', className: 'test__w_70px' },
        { slot: 'width@sm', className: 'test__sm:w_80px' },
      ],
    },
    {
      system: 'test',
      when: [],
      prop: 'outlineColor',
      value: 'brand',
      important: false,
      declarations: [{ slot: 'outlineColor', className: 'test__c_brand' }],
    },
    {
      system: 'test',
      when: [],
      prop: '--x',
      value: { base: '1', md: '2' },
      important: false,
      declarations: [
        { slot: '--x@base', className: 'test__--x_1' },
        { slot: '--x@md', className: 'test__md:--x_2' },
      ],
    },
  ],
  recipes: {},
  stylePropNames: ['color', 'p'],
}

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

  it('lowers r sugar to the container query plan', () => {
    expect(css({ r: { 320: { color: 'paper' } } })).toBe('test__cq:c_paper')
    expect(css({ '@container (min-width: 320px)': { color: 'paper' } })).toBe('test__cq:c_paper')
  })

  it('splits important markers into the important lookup', () => {
    expect(css({ color: 'brand!' })).toBe('test__c_brand!')
  })

  it('marks every important spelling and strips the marker', () => {
    expect(css({ color: 'brand !important' })).toBe('test__c_brand!')
    expect(css({ color: 'brand!IMPORTANT' })).toBe('test__c_brand!')
    expect(css({ color: 'brand!important' })).toBe('test__c_brand!')
    expect(css({ color: 'brand  !Important' })).toBe('test__c_brand!')
  })

  it('leaves bangs inside quoted strings literal and unimportant', () => {
    expect(css({ content: '"hello!"' })).toBe('test__content_hello')
  })

  it('omits null, false, and undefined leaves without ghost classes', () => {
    expect(css({ color: null, p: false, bogus: undefined })).toBe('')
    expect(css({ color: 'brand', p: null, bogus: false })).toBe('test__c_brand')
    expect(css({ color: 'brand', _hover: { color: null } })).toBe('test__c_brand')
    expect(css({ color: 'brand' }, { color: null }, { p: 'sm' })).toBe('test__c_brand test__p_sm')
  })

  it('ignores misses and conditional skips', () => {
    expect(css({ color: 'nope', bogus: 'x' })).toBe('')
    expect(css({ color: 'brand' }, undefined, null, false)).toBe('test__c_brand')
  })

  it('resolves unitless numbers and custom-prop numbers to numeric plans', () => {
    expect(css({ width: 42, opacity: 1, zIndex: 0, '--foo': 42 })).toBe(
      'test__w_42 test__op_1 test__z_0 test__--foo_42'
    )
  })

  it('resolves custom-prop objects as one responsive query, never a condition', () => {
    // `--x` is absent from stylePropNames on purpose: the `--` prefix
    // rule alone must route the object to the whole-object plan.
    expect(css({ '--x': { base: '1', md: '2' } })).toBe('test__--x_1 test__md:--x_2')
    expect(warnedMessages()).toHaveLength(0)
  })

  it('resolves composite token-ref strings by authored spelling', () => {
    expect(css({ backgroundImage: 'linear-gradient({colors.red.500}, {colors.blue.500})' })).toBe(
      'test__bg-img_grad'
    )
  })

  it('resolves arbitrary function values verbatim, one class each', () => {
    expect(css({ color: 'rgba(255,255,255,0.04)' })).toBe('test__c_rgba')
    expect(css({ backgroundColor: 'color-mix(in oklch, currentColor 14%, transparent)' })).toBe(
      'test__bg-c_mix'
    )
    expect(css({ width: 'calc(100% - 8px)' })).toBe('test__w_calc')
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

  it('still nests objects under unknown keys as misses', () => {
    expect(css({ bogus: { x: 'y' } })).toBe('')
    expect(warnedMessages()).toHaveLength(1)
    expect(warnedMessages()[0]).toContain('bogus')
  })

  it('orders base, container, and theme classes by author order', () => {
    expect(css({ color: 'brand' }, { _dark: { color: 'paper' } }, { r: { 320: { color: 'paper' } } })).toBe(
      'test__c_brand test__dark:c_paper test__cq:c_paper'
    )
    expect(css({ _dark: { color: 'paper' } }, { color: 'brand' })).toBe(
      'test__dark:c_paper test__c_brand'
    )
  })

  it('prints a class shared across slots once', () => {
    expect(css({ color: 'brand', outlineColor: 'brand' })).toBe('test__c_brand')
  })
})

describe('css() miss diagnostics', () => {
  it('warns once per miss, naming the value, the prop, and the call site', () => {
    expect(css({ color: 'shade-m6ax' })).toBe('')

    const messages = warnedMessages()
    expect(messages).toHaveLength(1)
    expect(messages[0]).toContain('color')
    expect(messages[0]).toContain('"shade-m6ax"')
    expect(messages[0]).toContain('css.test.ts')
  })

  it('names the condition when the miss sits under one', () => {
    expect(css({ _hover: { color: 'shade-m6hw' } })).toBe('')

    const messages = warnedMessages()
    expect(messages).toHaveLength(1)
    expect(messages[0]).toContain('_hover')
    expect(messages[0]).toContain('"shade-m6hw"')
  })

  it('warns once per distinct miss and stays silent on repeats', () => {
    for (let round = 0; round < 2; round++) {
      expect(css({ color: 'shade-m6r1' }, { color: 'shade-m6r2' })).toBe('')
    }

    expect(warnedMessages()).toHaveLength(2)
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

    expect(css({ color: 'shade-m6pd' })).toBe('')
    expect(warnedMessages()).toHaveLength(0)
  })
})

describe('css() without registration', () => {
  it('throws loud on a fresh module', async () => {
    vi.resetModules()
    const fresh = await import('./css.ts')

    expect(() => fresh.css({ color: 'brand' })).toThrowError(/registerRuntimeData/)
  })
})
