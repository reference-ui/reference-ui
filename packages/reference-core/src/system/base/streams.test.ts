// Unit tests for the structured-stylesheet merge over per-system streams.
// They take engine-shaped corpus entries and pin statement order, reset-drop
// bytes, verbatim scoping, transitive composition, and the published payload.
// Provenance: ported 1:1 from the packed-css battery the cutover deleted.
// This file pins the streams-native single-statement form for transitive chains.
// No strip unit exists: reset-drop
// is structural (the chunk never prints), so unparseable payloads cannot occur.

import { describe, expect, it } from 'vitest'
import { mergeStreams } from './streams.ts'
import type { SystemStreams } from './types.ts'
import {
  APP_CSS,
  APP_OWN,
  EXTEND2_ENTRY,
  EXTEND_ENTRY,
  EXTEND_STRIPPED,
  FLAT_ENTRY,
  MID_BASE_ENTRY,
  MID_ENTRY,
  NORMAL_GOLDEN,
  NORESET_GOLDEN,
  OUTER_A_ENTRY,
  OUTER_B_ENTRY,
  OWN_CSS,
  OWN_NORESET_CSS,
  PREAMBLE,
  RICH_ENTRY,
  ROOT_DEFAULT,
  RICH_STRIPPED,
  SCOPED_ENTRY,
  SHARED_BASE_CSS,
  SHARED_BASE_ENTRY,
  STATEMENT_T1,
  T1_NORESET_OWN,
  T1_OWN,
  TRANSITIVE_STREAMS_GOLDEN,
  countOccurrences,
} from './streams-corpus.ts'

describe('mergeStreams statement', () => {
  it('lists extends in declared order with self last', () => {
    const merged = mergeStreams(
      [
        { name: 'extend-library', streams: [EXTEND_ENTRY] },
        { name: 'extend-library-2', streams: [EXTEND2_ENTRY] },
      ],
      APP_OWN,
      'app'
    )
    expect(merged.stylesheet.startsWith(ROOT_DEFAULT)).toBe(true)
    expect(merged.stylesheet.split('\n')[3]).toBe('@layer extend-library, extend-library-2, app;')
    const first = merged.stylesheet.indexOf('@layer extend-library {')
    const second = merged.stylesheet.indexOf('@layer extend-library-2 {')
    const self = merged.stylesheet.indexOf('@layer app {')
    expect(first).toBeGreaterThan(-1)
    expect(second).toBeGreaterThan(first)
    expect(self).toBeGreaterThan(second)
    expect(countOccurrences(merged.stylesheet, '@layer reset {')).toBe(1)
  })

  it('prints a diamond shared upstream once, at its first position, in both sheets', () => {
    const merged = mergeStreams(
      [
        { name: 'outer-a', streams: [SHARED_BASE_ENTRY, OUTER_A_ENTRY] },
        { name: 'outer-b', streams: [SHARED_BASE_ENTRY, OUTER_B_ENTRY] },
      ],
      APP_OWN,
      'app'
    )
    expect(merged.stylesheet.startsWith(ROOT_DEFAULT)).toBe(true)
    expect(merged.stylesheet.split('\n')[3]).toBe('@layer base-lib, outer-a, outer-b, app;')
    expect(countOccurrences(merged.stylesheet, '@layer base-lib, outer-a;')).toBe(0)
    expect(countOccurrences(merged.stylesheet, '.base-lib__c_bg')).toBe(1)
    expect(countOccurrences(merged.portableStylesheet, '.base-lib__c_bg')).toBe(1)
    expect(countOccurrences(merged.stylesheet, '@layer reset {')).toBe(1)
    expect(merged.stylesheet.endsWith(APP_CSS)).toBe(true)
  })

  it('dedups a repeated system to one statement entry and one block', () => {
    const merged = mergeStreams(
      [
        { name: 'flat-lib', streams: [FLAT_ENTRY] },
        { name: 'flat-lib', streams: [FLAT_ENTRY] },
      ],
      APP_OWN,
      'app'
    )
    expect(merged.stylesheet.startsWith(ROOT_DEFAULT)).toBe(true)
    expect(merged.stylesheet.split('\n')[3]).toBe('@layer flat-lib, app;')
    expect(countOccurrences(merged.stylesheet, '.flat-lib__p_1px')).toBe(1)
  })

  it('composes a two-level expansion root-first with its closure', () => {
    const merged = mergeStreams(
      [{ name: 'mid-lib', streams: [MID_BASE_ENTRY, MID_ENTRY] }],
      APP_OWN,
      'app'
    )
    expect(merged.stylesheet).toBe(TRANSITIVE_STREAMS_GOLDEN)
    expect(countOccurrences(merged.stylesheet, '@layer reset {')).toBe(1)
  })

  it('keeps self last against a pathological self-extends entry', () => {
    const merged = mergeStreams([{ name: 'app', streams: [EXTEND_ENTRY] }], APP_OWN, 'app')
    expect(merged.stylesheet.startsWith(ROOT_DEFAULT)).toBe(true)
    expect(merged.stylesheet.split('\n')[3]).toBe('@layer extend-library, app;')
    expect(merged.streams.map((entry) => entry.name)).toEqual(['extend-library', 'app'])
  })
})

describe('mergeStreams statement escaping', () => {
  it('escapes a scoped upstream name in the statement like its block', () => {
    const merged = mergeStreams(
      [{ name: '@scope/pkg', streams: [SCOPED_ENTRY] }],
      APP_OWN,
      'app'
    )
    expect(merged.stylesheet.split('\n')[3]).toBe('@layer \\@scope\\/pkg, app;')
    expect(merged.portableStylesheet.split('\n')[3]).toBe('@layer \\@scope\\/pkg, app;')
    expect(merged.stylesheet).toContain('@layer \\@scope\\/pkg {')
  })

  it('escapes a comma upstream name in the statement like its block', () => {
    const commaUpstream: SystemStreams = {
      name: 'a,b',
      preamble: '@layer reset, global, base, tokens, recipes, utilities;\n',
      utilities: '@layer utilities {\n  .up { color: red; }\n}\n',
      package: 'a,b',
    }
    const merged = mergeStreams([{ name: 'a,b', streams: [commaUpstream] }], APP_OWN, 'app')
    expect(merged.stylesheet.split('\n')[3]).toBe('@layer a\\,b, app;')
    expect(merged.portableStylesheet.split('\n')[3]).toBe('@layer a\\,b, app;')
    expect(merged.stylesheet).toContain('@layer a\\,b {')
  })
})

describe('mergeStreams reset', () => {
  it('merges upstream reset-dropped plus the own block byte-exact', () => {
    const merged = mergeStreams(
      [{ name: 'extend-library', streams: [EXTEND_ENTRY] }],
      T1_OWN,
      'chain-t1'
    )
    expect(merged.stylesheet).toBe(NORMAL_GOLDEN)
  })

  it('drops the nested @media with the reset chunk it rides', () => {
    const merged = mergeStreams(
      [{ name: 'extend-library', streams: [EXTEND_ENTRY] }],
      T1_OWN,
      'chain-t1'
    )
    expect(merged.stylesheet).not.toContain('prefers-reduced-motion')
  })

  it('carries the inner prelude naming reset verbatim', () => {
    const merged = mergeStreams(
      [{ name: 'extend-library', streams: [EXTEND_ENTRY] }],
      T1_OWN,
      'chain-t1'
    )
    expect(merged.stylesheet).toContain(PREAMBLE)
    expect(countOccurrences(merged.stylesheet, PREAMBLE)).toBe(2)
  })

  it('leaves zero reset blocks for a normalizeCss:false consumer', () => {
    const merged = mergeStreams(
      [{ name: 'extend-library', streams: [EXTEND_ENTRY] }],
      T1_NORESET_OWN,
      'chain-t1'
    )
    expect(merged.stylesheet).toBe(NORESET_GOLDEN)
    expect(countOccurrences(merged.stylesheet, '@layer reset {')).toBe(0)
  })

  it('no-ops byte-identical on resetless payloads', () => {
    const merged = mergeStreams(
      [{ name: 'base-lib', streams: [SHARED_BASE_ENTRY] }],
      T1_NORESET_OWN,
      'chain-t1'
    )
    expect(merged.stylesheet).toBe(
      `${ROOT_DEFAULT}@layer base-lib, chain-t1;\n${SHARED_BASE_CSS}${OWN_NORESET_CSS}`
    )
    expect(countOccurrences(merged.stylesheet, '@layer reset {')).toBe(0)
  })
})

describe('mergeStreams scoping', () => {
  it('keeps upstream vars under [data-layer] and nothing hoisted to :root', () => {
    const merged = mergeStreams(
      [{ name: 'extend-library', streams: [EXTEND_ENTRY] }],
      T1_OWN,
      'chain-t1'
    )
    expect(merged.stylesheet).toContain(
      '[data-layer="extend-library"] {\n    --colors-demo-bg: #0f172a;\n    --colors-_private-brand: #ff00ff;\n  }'
    )
    const ownPart = merged.stylesheet.slice(merged.stylesheet.indexOf('@layer chain-t1 {'))
    expect(ownPart).not.toContain('_private')
    expect(countOccurrences(merged.stylesheet, '_private')).toBe(
      countOccurrences(EXTEND_STRIPPED, '_private')
    )
    expect(merged.stylesheet).not.toContain('[data-layer="chain-t1"]')
  })

  it('prints global and recipes downstream while the reset drops', () => {
    const merged = mergeStreams([{ name: 'rich-lib', streams: [RICH_ENTRY] }], APP_OWN, 'app')
    expect(merged.stylesheet).toContain(RICH_STRIPPED)
    expect(merged.portableStylesheet).toContain(RICH_STRIPPED)
    expect(countOccurrences(merged.stylesheet, '@layer reset {')).toBe(1)
  })
})

describe('mergeStreams assemblies', () => {
  it('serves the portable assembly through the same call unchanged', () => {
    const merged = mergeStreams(
      [{ name: 'extend-library', streams: [EXTEND_ENTRY] }],
      T1_OWN,
      'chain-t1'
    )
    expect(merged.portableStylesheet.startsWith(ROOT_DEFAULT + STATEMENT_T1)).toBe(true)
    expect(merged.portableStylesheet).toContain('[data-layer="extend-library"]')
    expect(merged.portableStylesheet).toContain('[data-layer="chain-t1"]')
    expect(merged.portableStylesheet).toContain(ROOT_DEFAULT)
    expect(countOccurrences(merged.portableStylesheet, ':root')).toBe(1)
  })

  it('no-ops byte-identical with no upstreams at all', () => {
    const merged = mergeStreams([], T1_OWN, 'chain-t1')
    expect(merged.stylesheet).toBe(ROOT_DEFAULT + OWN_CSS)
  })

  it('no-ops byte-identical when every upstream carries no streams', () => {
    const merged = mergeStreams(
      [{ name: 'ghost' }, { name: 'blank', streams: [] }],
      T1_OWN,
      'chain-t1'
    )
    expect(merged.stylesheet).toBe(ROOT_DEFAULT + OWN_CSS)
  })
})

describe('mergeStreams published payload', () => {
  it('expands transitively in merge order with the own entry last', () => {
    const merged = mergeStreams(
      [
        { name: 'outer-a', streams: [SHARED_BASE_ENTRY, OUTER_A_ENTRY] },
        { name: 'outer-b', streams: [SHARED_BASE_ENTRY, OUTER_B_ENTRY] },
      ],
      APP_OWN,
      'app'
    )
    expect(merged.streams.map((entry) => entry.name)).toEqual([
      'base-lib',
      'outer-a',
      'base-lib',
      'outer-b',
      'app',
    ])
  })

  it('never publishes served tokens while the own reset rides', () => {
    const merged = mergeStreams(
      [{ name: 'extend-library', streams: [EXTEND_ENTRY] }],
      T1_OWN,
      'chain-t1'
    )
    for (const entry of merged.streams) expect('tokens' in entry).toBe(false)
    const own = merged.streams[merged.streams.length - 1]
    expect(own.tokensPortable).toBe(T1_OWN.tokensPortable)
    expect(own.reset).toBe(T1_OWN.reset)
    expect(own.root).toBe(T1_OWN.root)
  })

  it('still publishes the own entry with no usable upstreams', () => {
    const merged = mergeStreams([{ name: 'ghost' }], T1_OWN, 'chain-t1')
    expect(merged.streams.map((entry) => entry.name)).toEqual(['chain-t1'])
  })
})
