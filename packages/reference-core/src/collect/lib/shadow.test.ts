// Unit tests for the token shadow merge and its sync warning.
// They take tagged token fragments in merge order and assert which replacements
// raise a shadow: a local leaf over a different upstream leaf, once per path. Equal
// values, upstream over upstream, local over local, and extend: nodes stay silent.

import { describe, expect, it } from 'vitest'
import {
  CONFIG_FRAGMENT_SOURCE_PROPERTY,
  UPSTREAM_FRAGMENT_SOURCE,
} from '../constants.ts'
import { mergeTokenFragmentsWithShadows, tokenShadowDiagnostic } from './shadow.ts'

// A collected fragment carries its source in a non-enumerable tag, as the collector sets it.
function tagged(source: string, tokens: Record<string, unknown>): Record<string, unknown> {
  const fragment = { ...tokens }
  Object.defineProperty(fragment, CONFIG_FRAGMENT_SOURCE_PROPERTY, {
    configurable: true,
    enumerable: false,
    value: source,
  })
  return fragment
}

const UPSTREAM = new Set(['base', 'mid'])
const LOCAL_FILE = '/app/theme/tokens.ts'

describe('mergeTokenFragmentsWithShadows', () => {
  it('reports a local leaf that replaces a different upstream value, naming the path, upstream, and both values', () => {
    const { tree, shadows } = mergeTokenFragmentsWithShadows(
      [
        tagged('base', { colors: { brand: { value: '#aa0000' } } }),
        tagged(LOCAL_FILE, { colors: { brand: { value: '#bb0000' } } }),
      ],
      UPSTREAM
    )

    expect(tree).toEqual({ colors: { brand: { value: '#bb0000' } } })
    expect(shadows).toEqual([
      {
        path: 'colors.brand',
        upstream: 'base',
        earlier: { value: '#aa0000' },
        local: { value: '#bb0000' },
      },
    ])
  })

  it('stays silent when the local value equals the upstream value', () => {
    const { shadows } = mergeTokenFragmentsWithShadows(
      [
        tagged('base', { colors: { quiet: { value: '#777777' } } }),
        tagged(LOCAL_FILE, { colors: { quiet: { value: '#777777' } } }),
      ],
      UPSTREAM
    )

    expect(shadows).toEqual([])
  })

})

describe('mergeTokenFragmentsWithShadows: the silent legs', () => {
  it('stays silent for an upstream value replaced by a later upstream (normal later-wins)', () => {
    const { shadows } = mergeTokenFragmentsWithShadows(
      [
        tagged('base', { colors: { accent: { value: '#101010' } } }),
        tagged('mid', { colors: { accent: { value: '#202020' } } }),
      ],
      UPSTREAM
    )

    expect(shadows).toEqual([])
  })

  it('stays silent for a local value replacing another local value', () => {
    const { shadows } = mergeTokenFragmentsWithShadows(
      [
        tagged(LOCAL_FILE, { colors: { ink: { value: '#111111' } } }),
        tagged('/app/theme/more.ts', { colors: { ink: { value: '#222222' } } }),
      ],
      UPSTREAM
    )

    expect(shadows).toEqual([])
  })

  it('reports one shadow per path even when several local leaves replace it', () => {
    const { shadows } = mergeTokenFragmentsWithShadows(
      [
        tagged('base', { colors: { brand: { value: '#aa0000' } } }),
        tagged(LOCAL_FILE, { colors: { brand: { value: '#bb0000' } } }),
        tagged('/app/theme/more.ts', { colors: { brand: { value: '#cc0000' } } }),
      ],
      UPSTREAM
    )

    expect(shadows.map((shadow) => shadow.path)).toEqual(['colors.brand'])
    expect(shadows[0]?.local).toEqual({ value: '#bb0000' })
  })

  it('reads the origin of a leaf from the fragment that last wrote it', () => {
    const { shadows } = mergeTokenFragmentsWithShadows(
      [
        tagged('base', { colors: { brand: { value: '#aa0000' } } }),
        tagged('mid', { colors: { brand: { value: '#bb0000' } } }),
        tagged(LOCAL_FILE, { colors: { brand: { value: '#cc0000' } } }),
      ],
      UPSTREAM
    )

    expect(shadows).toEqual([
      {
        path: 'colors.brand',
        upstream: 'mid',
        earlier: { value: '#bb0000' },
        local: { value: '#cc0000' },
      },
    ])
  })

  it('stays silent for a leaf that replaces a group, and for a leaf that fills an empty slot', () => {
    const { shadows } = mergeTokenFragmentsWithShadows(
      [
        tagged('base', { colors: { brand: { hover: { value: '#111111' } } } }),
        tagged(LOCAL_FILE, { colors: { brand: { value: '#cccccc' }, paper: { value: '#ffffff' } } }),
      ],
      UPSTREAM
    )

    expect(shadows).toEqual([])
  })

})

describe('mergeTokenFragmentsWithShadows: the reserved legs', () => {
  it('stays silent when either side is an extend:<base> node reserved for extendSystem', () => {
    const { shadows } = mergeTokenFragmentsWithShadows(
      [
        tagged('extend:base', { colors: { brand: { value: '#aa0000' } } }),
        tagged(LOCAL_FILE, { colors: { brand: { value: '#bb0000' } } }),
        tagged('extend:base', { colors: { ink: { value: '#000000' } } }),
      ],
      new Set(['base', 'extend:base'])
    )

    expect(shadows).toEqual([])
  })

  it('treats the unnamed upstream fallback source as upstream', () => {
    const { shadows } = mergeTokenFragmentsWithShadows(
      [
        tagged(UPSTREAM_FRAGMENT_SOURCE, { colors: { brand: { value: '#aa0000' } } }),
        tagged(LOCAL_FILE, { colors: { brand: { value: '#bb0000' } } }),
      ],
      new Set()
    )

    expect(shadows.map((shadow) => shadow.upstream)).toEqual([UPSTREAM_FRAGMENT_SOURCE])
  })
})

describe('tokenShadowDiagnostic', () => {
  it('builds a BSS warning that names the path, the upstream system, and both values', () => {
    const { shadows } = mergeTokenFragmentsWithShadows(
      [
        tagged('base', { colors: { brand: { value: '#aa0000' } } }),
        tagged(LOCAL_FILE, { colors: { brand: { value: '#bb0000' } } }),
      ],
      UPSTREAM
    )

    const diagnostic = tokenShadowDiagnostic(shadows[0]!)

    expect(diagnostic).toMatchObject({ severity: 'warning', code: 'BSS-W-TOKEN-SHADOW' })
    expect(diagnostic.message).toBe(
      "Local token 'colors.brand' replaces upstream 'base' value '#aa0000' with '#bb0000'."
    )
  })

  it('describes a light and dark leaf by its keys', () => {
    const { shadows } = mergeTokenFragmentsWithShadows(
      [
        tagged('base', { colors: { icon: { light: '#111111', dark: '#eeeeee' } } }),
        tagged(LOCAL_FILE, { colors: { icon: { light: '#222222' } } }),
      ],
      UPSTREAM
    )

    expect(tokenShadowDiagnostic(shadows[0]!).message).toContain(
      `value {"light":"#111111","dark":"#eeeeee"} with {"light":"#222222"}`
    )
  })
})
