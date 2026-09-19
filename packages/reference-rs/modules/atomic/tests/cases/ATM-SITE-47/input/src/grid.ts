import { css } from '@reference-ui/react'

// SPEC-V2-14: a multiline backtick grid collapses to its single-line twin.
export const a = css({
  gridTemplateAreas: `
    "preview name delete"
    "preview size delete"`,
})
export const b = css({ gridTemplateAreas: '"preview name delete" "preview size delete"' })
