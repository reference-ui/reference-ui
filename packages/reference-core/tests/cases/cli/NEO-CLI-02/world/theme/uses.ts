// uses.ts — the NEO-CLI-02 style call site. It takes the generated css()
// runtime and emits one brand utility. The utility keeps the sheet
// non-trivial, so the resync leg diffs real token bytes instead of an
// empty sheet.
import { css } from '@reference-ui/react'

export const cls = css({ color: 'brand' })
