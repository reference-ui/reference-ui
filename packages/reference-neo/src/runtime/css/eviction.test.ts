// Unit tests for the Neo alias-eviction mirror over constructed declarations.
// They take responsive-object plus alias queries and assert slot parsing,
// merge eviction, conditioned-family isolation, and important interplay.
// Slot grammar and declaration merge match the engine merge note exactly.
import { beforeAll, describe, expect, it } from 'vitest'
import type { NamerTables, NativeRuntimeArtifact } from '@reference-ui/rust/contracts'
import { NAMER_RULES_VERSION } from '@reference-ui/rust/namer'
import { css, registerRuntimeData } from './css.ts'
import {
  mergeDeclarations,
  mergeStylePlans,
  splitSlot,
  type ScoredDeclaration,
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

/** One constructed declaration scored plain, the merge's common case. */
function plain(slot: string, className: string): ScoredDeclaration {
  return { decl: { slot, className }, important: false }
}

/** One constructed declaration scored important. */
function loud(slot: string, className: string): ScoredDeclaration {
  return { decl: { slot, className }, important: true }
}

describe('alias eviction merge', () => {
  it('lets a later bare alias evict the earlier responsive expansion', () => {
    expect(
      mergeStylePlans([
        plain('width@base', 'test__w_50px'),
        plain('width@md', 'test__md:w_60px'),
        plain('width', 'test__w_70px'),
      ])
    ).toBe('test__w_70px')
  })

  it('lets a later responsive expansion evict the earlier bare alias', () => {
    expect(
      mergeStylePlans([
        plain('width', 'test__w_70px'),
        plain('width@base', 'test__w_50px'),
        plain('width@md', 'test__md:w_60px'),
      ])
    ).toBe('test__w_50px test__md:w_60px')
  })

  it('keeps conditioned families isolated from bare eviction', () => {
    expect(
      mergeStylePlans([
        plain('hover:color', 'test__hover:c_brand'),
        plain('color', 'test__c_ink'),
      ])
    ).toBe('test__hover:c_brand test__c_ink')
  })

  it('prints a class shared across slots once', () => {
    expect(
      mergeStylePlans([
        plain('color', 'test__c_brand'),
        plain('outlineColor', 'test__c_brand'),
      ])
    ).toBe('test__c_brand')
  })
})

describe('important eviction', () => {
  it('lets a later important bare alias evict the earlier plain expansion', () => {
    expect(
      mergeStylePlans([
        plain('width@base', 'test__w_50px'),
        plain('width@md', 'test__md:w_60px'),
        loud('width', 'test__w_70px!'),
      ])
    ).toBe('test__w_70px!')
  })

  it('drops a later plain expansion fully covered by an important bare alias', () => {
    expect(
      mergeStylePlans([
        loud('width', 'test__w_70px!'),
        plain('width@base', 'test__w_50px'),
        plain('width@md', 'test__md:w_60px'),
      ])
    ).toBe('test__w_70px!')
  })

  it('keeps important members beside a later plain bare alias that paints their gaps', () => {
    expect(
      mergeStylePlans([
        loud('width@base', 'test__w_51px!'),
        loud('width@md', 'test__md:w_61px!'),
        plain('width', 'test__w_70px'),
      ])
    ).toBe('test__w_51px! test__md:w_61px! test__w_70px')
  })

  it('lets an earlier important atom beat a later plain atom', () => {
    expect(
      mergeStylePlans([loud('color', 'test__c_ember!'), plain('color', 'test__c_ocean')])
    ).toBe('test__c_ember!')
  })

  it('collapses two important atoms last-wins', () => {
    expect(
      mergeStylePlans([loud('color', 'test__c_ember!'), loud('color', 'test__c_ink!')])
    ).toBe('test__c_ink!')
  })
})

const EVICTION_TABLES: NamerTables = {
  rulesVersion: NAMER_RULES_VERSION,
  aliases: { w: 'width' },
  prefixes: { color: 'c', width: 'w' },
  lowerings: {},
  keywords: {},
  weightKeywords: [],
  colorProps: ['color'],
  breakpoints: ['base', 'sm', 'md'],
  breakpointWidths: { sm: '640', md: '768' },
  conditions: ['_hover', 'hover'],
  fonts: {},
}

const EVICTION_ARTIFACT: NativeRuntimeArtifact = {
  schemaVersion: 2,
  namer: EVICTION_TABLES,
  recipes: {},
  stylePropNames: ['width', 'w', 'color'],
}

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

  it('strips leaf important markers when naming a responsive object', () => {
    expect(css({ width: { base: '50px!', md: '60px' } })).toBe('test__w_50px test__md:w_60px')
  })
})
