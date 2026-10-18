// Unit tests for the structured-stylesheet merge's output shape: the package wrap, the hoisted root default, and the
// foreign-section strip. They take corpus entries and assert the printed sheets byte for byte. The statement and
// reset cases stay in streams.test.ts.
import { describe, expect, it } from 'vitest'
import { mergeStreams } from './streams.ts'
import type { SystemStreams } from './types.ts'
import {
  APP_OWN,
  DIGIT_ENTRY,
  EXTEND_ENTRY,
  EXTEND_STRIPPED,
  FLAT_CSS,
  FLAT_ENTRY,
  LEGACY_CSS,
  LEGACY_ENTRY,
  OUTER_A_ENTRY,
  OUTER_A_STRIPPED,
  OUTER_B_ENTRY,
  OUTER_B_STRIPPED,
  PREAMBLE,
  ROOT_DEFAULT,
  SCOPED_ENTRY,
  SHARED_BASE_ENTRY,
  STATEMENT_T1,
  T1_OWN,
  countOccurrences,
} from './streams-corpus.ts'

describe('mergeStreams wrap', () => {
  it('prints outer blocks byte-exact with the package wrap', () => {
    const merged = mergeStreams(
      [
        { name: 'outer-a', streams: [OUTER_A_ENTRY] },
        { name: 'outer-b', streams: [OUTER_B_ENTRY] },
      ],
      APP_OWN,
      'app'
    )
    expect(merged.stylesheet).toContain(OUTER_A_STRIPPED)
    expect(merged.stylesheet).toContain(OUTER_B_STRIPPED)
  })

  it('leaves an unpackaged entry flat', () => {
    const merged = mergeStreams([], FLAT_ENTRY, 'flat-lib')
    expect(merged.stylesheet).toBe(ROOT_DEFAULT + FLAT_CSS)
    expect(merged.portableStylesheet).toBe(ROOT_DEFAULT + FLAT_CSS)
  })

  it('escapes scope characters in the package wrap', () => {
    const merged = mergeStreams([], SCOPED_ENTRY, '@scope/pkg')
    expect(merged.portableStylesheet).toContain('@layer \\@scope\\/pkg {')
  })

  it('hex-escapes a leading digit in the package wrap', () => {
    const merged = mergeStreams([], DIGIT_ENTRY, '2xl-lib')
    expect(merged.portableStylesheet).toContain('@layer \\32 xl-lib {')
  })

  it('reprints a prelude-less legacy entry byte-exact', () => {
    expect(mergeStreams([], LEGACY_ENTRY, 'old-lib').portableStylesheet).toBe(LEGACY_CSS)
  })
})

describe('mergeStreams root default', () => {
  it('hoists the own root ahead of the statement in both sheets', () => {
    const merged = mergeStreams(
      [{ name: 'extend-library', streams: [EXTEND_ENTRY] }],
      T1_OWN,
      'chain-t1'
    )
    expect(merged.stylesheet.startsWith(ROOT_DEFAULT + STATEMENT_T1)).toBe(true)
    expect(merged.portableStylesheet.startsWith(ROOT_DEFAULT + STATEMENT_T1)).toBe(true)
    expect(merged.stylesheet.indexOf('@layer root {')).toBe(0)
  })

  it('prints exactly one root block: upstream roots drop, never concat', () => {
    const merged = mergeStreams(
      [
        { name: 'outer-a', streams: [SHARED_BASE_ENTRY, OUTER_A_ENTRY] },
        { name: 'outer-b', streams: [SHARED_BASE_ENTRY, OUTER_B_ENTRY] },
      ],
      APP_OWN,
      'app'
    )
    expect(countOccurrences(merged.stylesheet, '@layer root {')).toBe(1)
    expect(countOccurrences(merged.portableStylesheet, '@layer root {')).toBe(1)
    expect(countOccurrences(merged.stylesheet, '--spacing-root:')).toBe(1)
  })

  it('merges statement-first when the own object carries no root', () => {
    const rootless: SystemStreams = { ...T1_OWN, root: undefined }
    const merged = mergeStreams(
      [{ name: 'extend-library', streams: [EXTEND_ENTRY] }],
      rootless,
      'chain-t1'
    )
    expect(merged.stylesheet.startsWith(STATEMENT_T1)).toBe(true)
    expect(merged.stylesheet).toContain(EXTEND_STRIPPED)
    expect(merged.stylesheet).not.toContain('@layer root {')
  })
})

describe('mergeStreams foreign strip', () => {
  const FOREIGN_UPSTREAM: SystemStreams = {
    name: 'lib',
    preamble: PREAMBLE,
    utilities:
      '@layer utilities {\n  .lib__c_red { color: red; }\n  /* foreign beta */\n  .beta__w_1r { width: 1r; }\n  /* end foreign beta */\n}\n',
    package: 'lib',
  }
  const OWN_WITH_FOREIGN: SystemStreams = {
    ...T1_OWN,
    utilities:
      '@layer utilities {\n  .app__c_red { color: red; }\n  /* foreign alpha */\n  .alpha__w_1r { width: 1r; }\n  /* end foreign alpha */\n}\n',
    package: 'app',
  }

  it('drops upstream foreign sections but keeps the own page foreign rules', () => {
    const merged = mergeStreams(
      [{ name: 'lib', streams: [FOREIGN_UPSTREAM] }],
      OWN_WITH_FOREIGN,
      'app'
    )
    expect(merged.stylesheet).not.toContain('beta__w_1r')
    expect(merged.portableStylesheet).not.toContain('beta__w_1r')
    expect(merged.stylesheet).not.toContain('/* foreign beta */')
    expect(merged.stylesheet).toContain('.lib__c_red')
    // The resolving consumer's own foreign rules stay on its page.
    expect(merged.stylesheet).toContain('.alpha__w_1r')
    expect(merged.stylesheet).toContain('/* foreign alpha */')
  })

  it('strips the published own entry and leaves unsentineled entries untouched', () => {
    const merged = mergeStreams([], OWN_WITH_FOREIGN, 'app')
    const publishedOwn = merged.streams[merged.streams.length - 1]
    expect(publishedOwn.utilities).not.toContain('alpha__w_1r')
    expect(publishedOwn.utilities).toContain('.app__c_red')

    const untouched = mergeStreams([], T1_OWN, 'chain-t1')
    expect(untouched.streams[0].utilities).toBe(T1_OWN.utilities)
  })
})
