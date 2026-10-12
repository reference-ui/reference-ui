// Style file for the NEO-DIAG-67 world. It takes no inputs and emits one css()
// call whose background names an undeclared tone, `brand/mediun`, so the
// compiler warns with a did-you-mean for `medium`. The statement below matches
// the shared repro-suite row byte for byte.
import { css } from '@reference-ui/react'

export const cls = css({ bg: 'brand/mediun' })
