// Differential proof that mergeStreams matches the packed-css oracle.
// It takes the golden corpus and pins two things: every entry reprints to its
// packed literal byte-exact, and on every depth-1 chain both implementations
// emit identical served and portable sheets. Depth-1 is the whole differential
// by construction: packed retains upstream inner statements verbatim while
// streams canonicalizes to a single statement (the S5 form, pinned natively in
// streams.test.ts), so transitive chains intentionally diverge by exactly those
// lines, demonstrated below. Flat upstreams stay out: packed misreads their
// leading prelude as a transitive statement, while streams uses entry names.
// The oracle import is the bridge, deleted at S5.

import { describe, expect, it } from 'vitest'
import { mergePackedStylesheets, type PackedUpstream } from '../../sync/packed-css.ts'
import { mergeStreams, type StreamUpstream } from './streams.ts'
import type { SystemStreams } from './types.ts'
import {
  APP_CSS,
  APP_OWN,
  EXTEND2_CSS,
  EXTEND2_ENTRY,
  EXTEND_CSS,
  EXTEND_ENTRY,
  FLAT_CSS,
  FLAT_ENTRY,
  LEGACY_CSS,
  LEGACY_ENTRY,
  MID_BASE_BLOCK,
  MID_BASE_ENTRY,
  MID_ENTRY,
  MID_OWN_BLOCK,
  MID_OWN_STRIPPED,
  OUTER_A_CSS,
  OUTER_A_ENTRY,
  OWN_CSS,
  OWN_NORESET_CSS,
  RICH_CSS,
  RICH_ENTRY,
  SHARED_BASE_CSS,
  SHARED_BASE_ENTRY,
  T1_NORESET_OWN,
  T1_OWN,
  T1_PORTABLE_CSS,
  TRANSITIVE_STREAMS_GOLDEN,
} from './streams-corpus.ts'

const PORTABLE_REPRINTS: Array<{ entry: SystemStreams; css: string }> = [
  { entry: EXTEND_ENTRY, css: EXTEND_CSS },
  { entry: EXTEND2_ENTRY, css: EXTEND2_CSS },
  { entry: SHARED_BASE_ENTRY, css: SHARED_BASE_CSS },
  { entry: OUTER_A_ENTRY, css: OUTER_A_CSS },
  { entry: MID_BASE_ENTRY, css: MID_BASE_BLOCK },
  { entry: MID_ENTRY, css: MID_OWN_BLOCK },
  { entry: LEGACY_ENTRY, css: LEGACY_CSS },
  { entry: RICH_ENTRY, css: RICH_CSS },
  { entry: FLAT_ENTRY, css: FLAT_CSS },
  { entry: T1_OWN, css: T1_PORTABLE_CSS },
  { entry: APP_OWN, css: APP_CSS },
]

// Reprint a corpus entry through the empty merge. Sound only because the pins
// above hold every reprint against its hand-written literal first: the helper
// reuses the pinned join, so the differential below compares merge behavior.
function packUpstream(entry: SystemStreams): PackedUpstream {
  return {
    name: entry.name,
    css: mergeStreams([], entry, entry.name).portableStylesheet,
  }
}

interface DifferentialCase {
  streams: StreamUpstream[]
  packed: PackedUpstream[]
  own: SystemStreams
  ownServed: string
  ownPortable: string
  selfName: string
}

function expectDifferential(course: DifferentialCase): void {
  const merged = mergeStreams(course.streams, course.own, course.selfName)
  expect(merged.stylesheet).toBe(
    mergePackedStylesheets(course.packed, course.ownServed, course.selfName)
  )
  expect(merged.portableStylesheet).toBe(
    mergePackedStylesheets(course.packed, course.ownPortable, course.selfName)
  )
}

describe('streams reprints', () => {
  it.each(PORTABLE_REPRINTS)('reprints $entry.name to its packed literal', ({ entry, css }) => {
    expect(mergeStreams([], entry, entry.name).portableStylesheet).toBe(css)
  })

  it('reprints own objects in the served variant', () => {
    expect(mergeStreams([], T1_OWN, 'chain-t1').stylesheet).toBe(OWN_CSS)
    expect(mergeStreams([], T1_NORESET_OWN, 'chain-t1').stylesheet).toBe(OWN_NORESET_CSS)
    expect(mergeStreams([], APP_OWN, 'app').stylesheet).toBe(APP_CSS)
  })
})

describe('streams differential chains', () => {
  it('matches on a single upstream in both assemblies', () => {
    expectDifferential({
      streams: [{ name: 'extend-library', streams: [EXTEND_ENTRY] }],
      packed: [packUpstream(EXTEND_ENTRY)],
      own: T1_OWN,
      ownServed: OWN_CSS,
      ownPortable: T1_PORTABLE_CSS,
      selfName: 'chain-t1',
    })
  })

  it('matches on two upstreams with the tokenless second', () => {
    expectDifferential({
      streams: [
        { name: 'extend-library', streams: [EXTEND_ENTRY] },
        { name: 'extend-library-2', streams: [EXTEND2_ENTRY] },
      ],
      packed: [packUpstream(EXTEND_ENTRY), packUpstream(EXTEND2_ENTRY)],
      own: APP_OWN,
      ownServed: APP_CSS,
      ownPortable: APP_CSS,
      selfName: 'app',
    })
  })

  it('matches on a directly repeated upstream', () => {
    expectDifferential({
      streams: [
        { name: 'extend-library', streams: [EXTEND_ENTRY] },
        { name: 'extend-library', streams: [EXTEND_ENTRY] },
      ],
      packed: [packUpstream(EXTEND_ENTRY), packUpstream(EXTEND_ENTRY)],
      own: APP_OWN,
      ownServed: APP_CSS,
      ownPortable: APP_CSS,
      selfName: 'app',
    })
  })

  it('matches on a prelude-less upstream', () => {
    expectDifferential({
      streams: [{ name: 'old-lib', streams: [LEGACY_ENTRY] }],
      packed: [packUpstream(LEGACY_ENTRY)],
      own: APP_OWN,
      ownServed: APP_CSS,
      ownPortable: APP_CSS,
      selfName: 'app',
    })
  })

  it('matches on a global-and-recipes upstream', () => {
    expectDifferential({
      streams: [{ name: 'rich-lib', streams: [RICH_ENTRY] }],
      packed: [packUpstream(RICH_ENTRY)],
      own: APP_OWN,
      ownServed: APP_CSS,
      ownPortable: APP_CSS,
      selfName: 'app',
    })
  })

})

describe('streams differential edges', () => {
  it('matches on empty merges in both assemblies', () => {
    const merged = mergeStreams([], T1_OWN, 'chain-t1')
    expect(merged.stylesheet).toBe(mergePackedStylesheets([], OWN_CSS, 'chain-t1'))
    expect(merged.portableStylesheet).toBe(mergePackedStylesheets([], T1_PORTABLE_CSS, 'chain-t1'))
    const ghosted = mergeStreams([{ name: 'ghost' }, { name: 'blank', streams: [] }], T1_OWN, 'chain-t1')
    expect(ghosted.stylesheet).toBe(
      mergePackedStylesheets([{ name: 'ghost' }, { name: 'blank', css: '' }], OWN_CSS, 'chain-t1')
    )
  })

  it('diverges transitively by exactly the inner statement lines', () => {
    const viaStreams = mergeStreams(
      [{ name: 'mid-lib', streams: [MID_BASE_ENTRY, MID_ENTRY] }],
      APP_OWN,
      'app'
    )
    const viaPacked = mergePackedStylesheets(
      [{ name: 'mid-lib', css: '@layer base-lib, mid-lib;\n' + MID_BASE_BLOCK + MID_OWN_BLOCK }],
      APP_CSS,
      'app'
    )
    expect(viaStreams.stylesheet).toBe(TRANSITIVE_STREAMS_GOLDEN)
    expect(viaPacked).toBe(
      '@layer base-lib, mid-lib, app;\n@layer base-lib, mid-lib;\n' +
        MID_BASE_BLOCK +
        MID_OWN_STRIPPED +
        APP_CSS
    )
  })
})
