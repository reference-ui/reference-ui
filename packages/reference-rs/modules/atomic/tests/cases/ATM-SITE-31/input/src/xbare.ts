import { css } from '@reference-ui/react'

// Bare call with NO import (SPEC-V2-57): xtone lives in ./helpers but this
// file never imports it, so the call refuses with a located diagnostic and
// the sibling margin survives. Folding here would resolve through the name
// bag, which the no-name-collision rule forbids.
export const b1 = css({ color: xtone('bare'), margin: '15r' })
