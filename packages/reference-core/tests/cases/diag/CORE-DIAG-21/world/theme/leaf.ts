// Minimal fixture for ATM-W-RESPONSIVE-LEAF-IMPORTANT in the CORE-DIAG-21
// world. It takes the generated css runtime and marks one responsive width
// leaf important. Compiling the world must surface the code as a warning
// with a non-blank message.
import { css } from '@reference-ui/react'

export const cls = css({
  width: { base: '50px!', md: '60px' },
  color: 'red',
})
