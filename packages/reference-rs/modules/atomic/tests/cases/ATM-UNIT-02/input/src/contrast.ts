import { css } from '@reference-ui/react'

// SPEC-V2-79 contrast arm (S20): v2 keeps padded spellings as strings
// (no trim — `canonical_number(" 1")` is None,
// `pandacss_encoder/src/lib.rs:512`); we trim-then-numerify them to the
// numeric atom. NOTE: the `''` half of S20 is not pinned here — the
// `''` refuses with ATM-W-INVALID-CSS-VALUE (v2 emits `margin: ;`).
export const k = css({ margin: ' 1' })
export const l = css({ margin: '1 ' })
export const m = css({ margin: '' })
