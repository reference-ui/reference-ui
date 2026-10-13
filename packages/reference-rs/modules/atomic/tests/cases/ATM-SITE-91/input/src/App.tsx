import { css } from '@reference-ui/react'
import { brand } from 'brand-pkg'

// `brand-pkg` names `./dist/index.d.ts` as its `types` beside an `exports`
// entry for `./src/index.ts`. The value must come from the source.
export const branded = css({ color: brand })
// Control: a literal call in the same file, so a silent `branded` is not a dead import.
export const literal = css({ color: 'purple' })
