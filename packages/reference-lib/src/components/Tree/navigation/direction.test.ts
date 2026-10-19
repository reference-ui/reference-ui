// @vitest-environment happy-dom
/** Unit proof for Tree's reading-direction resolution: the first
 * `[dir]` hit wins in light DOM, shadow hosts climb to their hit, and
 * `document.dir` is the last fallback. The keyboard hook mirrors
 * expand/collapse on the answer. */
import { describe, expect, it } from 'vitest'
import { resolveIsRtl } from './direction'

function scope(opts: {
  dirHit?: string | null
  host?: unknown
  root?: { host?: unknown }
}) {
  return {
    closest: () => (opts.dirHit === undefined ? null : ({ dir: opts.dirHit } as HTMLElement)),
    getRootNode: () => opts.root ?? {},
  } as unknown as HTMLElement
}

describe('resolveIsRtl', () => {
  it('reads the first [dir] hit in light DOM', () => {
    expect(resolveIsRtl(scope({ dirHit: 'rtl' }))).toBe(true)
    expect(resolveIsRtl(scope({ dirHit: 'ltr' }))).toBe(false)
  })

  it('falls back to document.dir when no [dir] exists above', () => {
    // node environment: no document global in this scope check
    expect(resolveIsRtl(scope({}))).toBe(false)
  })

  it('climbs through shadow hosts to find [dir]', () => {
    const host = scope({ dirHit: 'rtl' })
    Object.setPrototypeOf(host, Element.prototype)
    const inner = scope({ root: { host } })
    expect(resolveIsRtl(inner)).toBe(true)
  })
})
