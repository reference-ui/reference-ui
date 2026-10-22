// x.ts is the one file the committed world keeps outside the include, so only a link reaches it.
// The spec writes a copy of it at src/a/up/x.ts in the baseline, and the linked project reaches it only through the loop-closing link.
import { css } from '@reference-ui/react'

export const x = css({ color: 'red' })
