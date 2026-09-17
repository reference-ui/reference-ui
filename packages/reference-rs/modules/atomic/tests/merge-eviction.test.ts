/**
 * Cascade-slot eviction unit tests (RS-9, ATM-COND-17 merge note).
 * Exercises mergeDeclarations directly: slot-family parsing, bare-alias
 * eviction of responsive members, symmetric responsive-wins eviction, and
 * condition-family isolation. Station COND-17 proves the same semantic
 * through compiled plans; these cases pin the boundary grammar.
 */
import { describe, expect, it } from 'vitest'
import { mergeDeclarations, splitSlot } from '../js/index.js'

describe('splitSlot', () => {
  it('reads bare and responsive slots', () => {
    expect(splitSlot('width')).toEqual({ family: 'width', breakpoint: null })
    expect(splitSlot('width@md')).toEqual({ family: 'width', breakpoint: 'md' })
    expect(splitSlot('hover:color@md')).toEqual({
      family: 'hover:color',
      breakpoint: 'md',
    })
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
  it('later bare alias evicts the earlier responsive expansion', () => {
    const merged = mergeDeclarations([
      { slot: 'width@base', className: 'lib__w_50px' },
      { slot: 'width@md', className: 'lib__md:w_60px' },
      { slot: 'width', className: 'lib__w_70px' },
    ])
    expect(merged).toBe('lib__w_70px')
  })

  it('later responsive expansion evicts the earlier bare alias', () => {
    const merged = mergeDeclarations([
      { slot: 'width', className: 'lib__w_70px' },
      { slot: 'width@base', className: 'lib__w_50px' },
      { slot: 'width@md', className: 'lib__md:w_60px' },
    ])
    expect(merged).toBe('lib__w_50px lib__md:w_60px')
  })

  it('later responsive members displace same-breakpoint members only', () => {
    const merged = mergeDeclarations([
      { slot: 'p@base', className: 'lib__p_1r' },
      { slot: 'p@sm', className: 'lib__sm:p_2r' },
      { slot: 'p@base', className: 'lib__p_3r' },
      { slot: 'p@sm', className: 'lib__sm:p_4r' },
    ])
    expect(merged).toBe('lib__p_3r lib__sm:p_4r')
  })

  it('keeps conditioned families isolated from bare eviction', () => {
    const merged = mergeDeclarations([
      { slot: 'hover:color', className: 'lib__hover:c_red' },
      { slot: 'color', className: 'lib__c_green' },
    ])
    expect(merged).toBe('lib__hover:c_red lib__c_green')
    const responsive = mergeDeclarations([
      { slot: 'hover:color@md', className: 'lib__hover:md:c_blue' },
      { slot: 'color', className: 'lib__c_green' },
    ])
    expect(responsive).toBe('lib__hover:md:c_blue lib__c_green')
  })

  it('re-setting an identical slot keeps first-seen position', () => {
    const merged = mergeDeclarations([
      { slot: 'color', className: 'lib__c_red' },
      { slot: 'padding', className: 'lib__p_1r' },
      { slot: 'color', className: 'lib__c_blue' },
    ])
    expect(merged).toBe('lib__c_blue lib__p_1r')
  })
})
