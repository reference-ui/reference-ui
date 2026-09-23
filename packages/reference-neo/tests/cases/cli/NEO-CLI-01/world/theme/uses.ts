// uses.ts — the NEO-CLI-01 style call site. It takes the generated css()
// runtime and emits one brand utility. The utility keeps the sheet
// non-trivial, so the idempotent leg diffs real bytes instead of an
// empty sheet.
import { css } from '@reference-ui/react'

export const cls = css({ color: 'brand' })
