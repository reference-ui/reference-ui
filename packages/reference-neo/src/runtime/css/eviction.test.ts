// Unit tests for the Neo alias-eviction mirror over hand-built artifacts.
// They take responsive-object plus alias queries and assert slot parsing,
// merge eviction, conditioned-family isolation, and important interplay.
// Slot grammar and declaration merge match the engine merge note exactly.
import { beforeAll, describe, expect, it } from 'vitest'
import type { NativeRuntimeArtifact } from '@reference-ui/rust/contracts'
import { css, registerRuntimeData } from './css.ts'
import {
  createStylePlanIndex,
  mergeDeclarations,
  mergeStylePlans,
  splitSlot,
} from './plans.ts'

describe('splitSlot', () => {
  it('reads bare and responsive slots', () => {
    expect(splitSlot('width')).toEqual({ family: 'width', breakpoint: null })
    expect(splitSlot('width@md')).toEqual({ family: 'width', breakpoint: 'md' })
    expect(splitSlot('hover:color@md')).toEqual({ family: 'hover:color', breakpoint: 'md' })
  })

  it('does not mistake r-condition leading @ for a breakpoint suffix', () => {
    expect(splitSlot('@container (min-width: 300px):p')).toEqual({
      family: '@container (min-width: 300px):p',
      breakpoint: null,
    })
    expect(splitSlot('@container (min-width: 300px):p@md')).toEqual({
      family: '@container (min-width: 300px):p',
      breakpoint: 'md',
    })
  })
})

describe('mergeDeclarations eviction', () => {
  it('lets a later bare alias evict the earlier responsive expansion', () => {
    expect(
      mergeDeclarations([
        { slot: 'width@base', className: 'test__w_50px' },
        { slot: 'width@md', className: 'test__md:w_60px' },
        { slot: 'width', className: 'test__w_70px' },
      ])
    ).toBe('test__w_70px')
  })

  it('lets a later responsive expansion evict the earlier bare alias', () => {
    expect(
      mergeDeclarations([
        { slot: 'width', className: 'test__w_70px' },
        { slot: 'width@base', className: 'test__w_50px' },
        { slot: 'width@md', className: 'test__md:w_60px' },
      ])
    ).toBe('test__w_50px test__md:w_60px')
  })

  it('displaces same-breakpoint members only', () => {
    expect(
      mergeDeclarations([
        { slot: 'p@base', className: 'test__p_1r' },
        { slot: 'p@sm', className: 'test__sm:p_2r' },
        { slot: 'p@base', className: 'test__p_3r' },
        { slot: 'p@sm', className: 'test__sm:p_4r' },
      ])
    ).toBe('test__p_3r test__sm:p_4r')
  })

  it('keeps conditioned families isolated from bare eviction', () => {
    expect(
      mergeDeclarations([
        { slot: 'hover:color', className: 'test__hover:c_red' },
        { slot: 'color', className: 'test__c_green' },
      ])
    ).toBe('test__hover:c_red test__c_green')
    expect(
      mergeDeclarations([
        { slot: 'hover:color@md', className: 'test__hover:md:c_blue' },
        { slot: 'color', className: 'test__c_green' },
      ])
    ).toBe('test__hover:md:c_blue test__c_green')
  })

  it('keeps first-seen position when re-setting an identical slot', () => {
    expect(
      mergeDeclarations([
        { slot: 'color', className: 'test__c_red' },
        { slot: 'padding', className: 'test__p_1r' },
        { slot: 'color', className: 'test__c_blue' },
      ])
    ).toBe('test__c_blue test__p_1r')
  })
})

const EVICTION_ARTIFACT: NativeRuntimeArtifact = {
  schemaVersion: 1,
  stylePlans: [
    {
      system: 'test',
      when: [],
      prop: 'width',
      value: { base: '50px', md: '60px' },
      important: false,
      declarations: [
        { slot: 'width@base', className: 'test__w_50px' },
        { slot: 'width@md', className: 'test__md:w_60px' },
      ],
    },
    {
      system: 'test',
      when: [],
      prop: 'w',
      value: '70px',
      important: false,
      declarations: [{ slot: 'width', className: 'test__w_70px' }],
    },
    {
      system: 'test',
      when: ['_hover'],
      prop: 'width',
      value: { base: '50px', md: '60px' },
      important: false,
      declarations: [
        { slot: 'hover:width@base', className: 'test__hover:w_50px' },
        { slot: 'hover:width@md', className: 'test__hover:md:w_60px' },
      ],
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
      when: [],
      prop: 'color',
      value: 'ink',
      important: false,
      declarations: [{ slot: 'color', className: 'test__c_ink' }],
    },
  ],
  recipes: {},
  stylePropNames: ['width', 'w', 'color'],
}

describe('alias eviction merge', () => {
  it('lets a later bare alias evict the earlier responsive expansion', () => {
    const index = createStylePlanIndex(EVICTION_ARTIFACT)

    expect(
      mergeStylePlans(index, [
        { system: 'test', prop: 'width', value: { base: '50px', md: '60px' } },
        { system: 'test', prop: 'w', value: '70px' },
      ])
    ).toBe('test__w_70px')
  })

  it('lets a later responsive expansion evict the earlier bare alias', () => {
    const index = createStylePlanIndex(EVICTION_ARTIFACT)

    expect(
      mergeStylePlans(index, [
        { system: 'test', prop: 'w', value: '70px' },
        { system: 'test', prop: 'width', value: { base: '50px', md: '60px' } },
      ])
    ).toBe('test__w_50px test__md:w_60px')
  })

  it('keeps conditioned families isolated from bare eviction', () => {
    const index = createStylePlanIndex(EVICTION_ARTIFACT)

    expect(
      mergeStylePlans(index, [
        { system: 'test', when: ['_hover'], prop: 'color', value: 'brand' },
        { system: 'test', prop: 'color', value: 'ink' },
      ])
    ).toBe('test__hover:c_brand test__c_ink')
  })
})

const IMPORTANT_EVICTION_ARTIFACT: NativeRuntimeArtifact = {
  schemaVersion: 1,
  stylePlans: [
    {
      system: 'test',
      when: [],
      prop: 'width',
      value: { base: '50px', md: '60px' },
      important: false,
      declarations: [
        { slot: 'width@base', className: 'test__w_50px' },
        { slot: 'width@md', className: 'test__md:w_60px' },
      ],
    },
    {
      system: 'test',
      when: [],
      prop: 'w',
      value: '70px',
      important: false,
      declarations: [{ slot: 'width', className: 'test__w_70px' }],
    },
    {
      system: 'test',
      when: [],
      prop: 'w',
      value: '70px',
      important: true,
      declarations: [{ slot: 'width', className: 'test__w_70px!' }],
    },
    {
      system: 'test',
      when: [],
      prop: 'width',
      value: { base: '51px', md: '61px' },
      important: true,
      declarations: [
        { slot: 'width@base', className: 'test__w_51px!' },
        { slot: 'width@md', className: 'test__md:w_61px!' },
      ],
    },
  ],
  recipes: {},
  stylePropNames: ['width', 'w'],
}

describe('important eviction', () => {
  it('lets a later important bare alias evict the earlier plain expansion', () => {
    const index = createStylePlanIndex(IMPORTANT_EVICTION_ARTIFACT)

    expect(
      mergeStylePlans(index, [
        { system: 'test', prop: 'width', value: { base: '50px', md: '60px' } },
        { system: 'test', prop: 'w', value: '70px', important: true },
      ])
    ).toBe('test__w_70px!')
  })

  it('drops a later plain expansion fully covered by an important bare alias', () => {
    const index = createStylePlanIndex(IMPORTANT_EVICTION_ARTIFACT)

    expect(
      mergeStylePlans(index, [
        { system: 'test', prop: 'w', value: '70px', important: true },
        { system: 'test', prop: 'width', value: { base: '50px', md: '60px' } },
      ])
    ).toBe('test__w_70px!')
  })

  it('keeps important members beside a later plain bare alias that paints their gaps', () => {
    const index = createStylePlanIndex(IMPORTANT_EVICTION_ARTIFACT)

    expect(
      mergeStylePlans(index, [
        { system: 'test', prop: 'width', value: { base: '51px', md: '61px' }, important: true },
        { system: 'test', prop: 'w', value: '70px' },
      ])
    ).toBe('test__w_51px! test__md:w_61px! test__w_70px')
  })
})

describe('css() responsive objects', () => {
  beforeAll(() => {
    registerRuntimeData('test', EVICTION_ARTIFACT)
  })

  it('lets a later bare alias evict an earlier responsive object in one call', () => {
    expect(css({ width: { base: '50px', md: '60px' }, w: '70px' })).toBe('test__w_70px')
  })

  it('lets a later responsive object evict an earlier bare alias in one call', () => {
    expect(css({ w: '70px', width: { base: '50px', md: '60px' } })).toBe(
      'test__w_50px test__md:w_60px'
    )
  })

  it('resolves a responsive object nested under a condition', () => {
    expect(css({ _hover: { width: { base: '50px', md: '60px' } } })).toBe(
      'test__hover:w_50px test__hover:md:w_60px'
    )
  })

  it('strips leaf important markers when looking up a responsive object', () => {
    expect(css({ width: { base: '50px!', md: '60px' } })).toBe('test__w_50px test__md:w_60px')
  })
})
