import { css } from '@reference-ui/react'
import { gap } from './a'

// The mirror image: `gap` reads ONLY a.ts (`4px`), never b.ts (`8px`).
// Same local name, two importers, zero crossing — the Ph4 exit bar.
export const only = css({ padding: gap })
