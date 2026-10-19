// Minimal fixture for ATM-W-NON-OBJECT-CSS-ARG in the CORE-DIAG-34 world.
// It takes the generated css runtime and calls it with an opaque call
// result instead of an object literal. Compiling the world must surface the
// code as a warning with a non-blank message.
import { css } from '@reference-ui/react'

declare const fn: () => Record<string, string>

export const callArg = css(fn())
