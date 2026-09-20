import { css } from '@reference-ui/react'

// Doom-4 T1: `{}}` on the border trio color slot refuses (starts-with-`{`
// AND ends-with-`}`, non-blank interior) while the namer keeps the stem,
// so the differential carves the extra. (Kept brace controls — `{`,
// `foo}`, `{bar}` — agree on both sides but their emitted rules break
// the sheet walk for sibling selectors, so they are proven in the
// differential harness instead of this station.)
export const refused = css({ border: '2px solid {}}' })
