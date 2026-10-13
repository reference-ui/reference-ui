import { css } from '@reference-ui/react'
import { tone } from 'cond-pkg'
import { accent } from 'cond-pkg/tokens'

// `cond-pkg` nests `types` beside `import` inside its `exports` conditions, at the
// root and at `./tokens`. Both imports must fold from their source files.
export const toned = css({ color: tone })
export const accented = css({ color: accent })
// Control: a literal call in the same file, so the imports are not dead code.
export const literal = css({ color: 'red' })
