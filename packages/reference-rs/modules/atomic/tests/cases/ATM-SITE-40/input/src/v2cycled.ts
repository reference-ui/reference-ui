import { css } from '@reference-ui/react'
import { whirl } from './v2cycle-a'

// Import-then-export cycle (v2 `cross_file.rs:545` shape): the `export {}`
// follows the file's own import edge into the loop, the guard yields no
// origin, and the use warns with its sibling kept.
export const a = css({ color: whirl, padding: '20px' })
