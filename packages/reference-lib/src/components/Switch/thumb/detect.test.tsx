import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { SwitchThumb } from '../parts/Thumb'
import { hasDirectAuthoredThumb } from './detect'

const ForwardedThumb = React.forwardRef<HTMLSpanElement, object>(
  function ForwardedThumb(props, ref) {
    return <SwitchThumb {...props} ref={ref} />
  }
)

describe('hasDirectAuthoredThumb', () => {
  it('seeds true only for a direct-authored thumb child', () => {
    expect(hasDirectAuthoredThumb(null)).toBe(false)
    expect(hasDirectAuthoredThumb(undefined)).toBe(false)
    expect(hasDirectAuthoredThumb('label text')).toBe(false)
    expect(hasDirectAuthoredThumb(<span />)).toBe(false)
    expect(hasDirectAuthoredThumb(<SwitchThumb />)).toBe(true)
    expect(
      hasDirectAuthoredThumb([
        <span key="a" />,
        <SwitchThumb key="thumb" data-testid="direct-thumb" />,
      ])
    ).toBe(true)
  })

  it('seeds false for Fragment-wrapped and HOC-forwarded thumbs', () => {
    // Reference identity only: no fragment penetration, no displayName read.
    // These shapes reconcile from rendered DOM structure after mount.
    expect(
      hasDirectAuthoredThumb(
        <React.Fragment>
          <SwitchThumb data-testid="fragment-thumb" />
        </React.Fragment>
      )
    ).toBe(false)
    expect(hasDirectAuthoredThumb(<ForwardedThumb data-testid="forwarded-thumb" />)).toBe(false)
  })
})
