// Golden pins for the structured-stylesheet merge over the hand-written corpus.
// They take each corpus entry and pin its reprint byte-exact against the
// whole-string literal, plus the canonical single-statement transitive form.
// The S5 cutover deleted the packed-css oracle this file once differentiated
// against; the reprints plus the streams-native goldens below are what persists.

import { describe, expect, it } from 'vitest'
import { mergeStreams } from './streams.ts'
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
  OUTER_A_CSS,
  OUTER_A_ENTRY,
  OWN_CSS,
  OWN_NORESET_CSS,
  RICH_CSS,
  ROOT_DEFAULT,
  RICH_ENTRY,
  SHARED_BASE_CSS,
  SHARED_BASE_ENTRY,
  T1_NORESET_OWN,
  T1_OWN,
  T1_PORTABLE_CSS,
  TRANSITIVE_STREAMS_GOLDEN,
} from './streams-corpus.ts'

const PORTABLE_REPRINTS: Array<{ entry: SystemStreams; css: string }> = [
  { entry: EXTEND_ENTRY, css: ROOT_DEFAULT + EXTEND_CSS },
  { entry: EXTEND2_ENTRY, css: ROOT_DEFAULT + EXTEND2_CSS },
  { entry: SHARED_BASE_ENTRY, css: ROOT_DEFAULT + SHARED_BASE_CSS },
  { entry: OUTER_A_ENTRY, css: ROOT_DEFAULT + OUTER_A_CSS },
  { entry: MID_BASE_ENTRY, css: ROOT_DEFAULT + MID_BASE_BLOCK },
  { entry: MID_ENTRY, css: ROOT_DEFAULT + MID_OWN_BLOCK },
  { entry: LEGACY_ENTRY, css: LEGACY_CSS },
  { entry: RICH_ENTRY, css: ROOT_DEFAULT + RICH_CSS },
  { entry: FLAT_ENTRY, css: ROOT_DEFAULT + FLAT_CSS },
  { entry: T1_OWN, css: ROOT_DEFAULT + T1_PORTABLE_CSS },
  { entry: APP_OWN, css: ROOT_DEFAULT + APP_CSS },
]

describe('streams reprints', () => {
  it.each(PORTABLE_REPRINTS)('reprints $entry.name to its whole-string literal', ({ entry, css }) => {
    expect(mergeStreams([], entry, entry.name).portableStylesheet).toBe(css)
  })

  it('reprints own objects in the served variant', () => {
    expect(mergeStreams([], T1_OWN, 'chain-t1').stylesheet).toBe(ROOT_DEFAULT + OWN_CSS)
    expect(mergeStreams([], T1_NORESET_OWN, 'chain-t1').stylesheet).toBe(
      ROOT_DEFAULT + OWN_NORESET_CSS
    )
    expect(mergeStreams([], APP_OWN, 'app').stylesheet).toBe(ROOT_DEFAULT + APP_CSS)
  })
})

describe('streams canonical transitive form', () => {
  // Single statement over the entry-name expansion: the S4 differential proved
  // the delta vs the packed oracle was exactly the retained inner statements.
  it('prints one statement over the transitive entry expansion', () => {
    const viaStreams = mergeStreams(
      [{ name: 'mid-lib', streams: [MID_BASE_ENTRY, MID_ENTRY] }],
      APP_OWN,
      'app'
    )
    expect(viaStreams.stylesheet).toBe(TRANSITIVE_STREAMS_GOLDEN)
  })
})
