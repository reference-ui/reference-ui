import { css } from '@reference-ui/react'

declare const dark: boolean
declare function maybeFn(): string

// Unresolvable consequent: the alternate survives with a warning on the call.
export const a = css({ color: dark ? maybeFn() : 'black' })
// Unresolvable alternate: the consequent survives with a warning on the call.
export const b = css({ backgroundColor: dark ? 'white' : maybeFn() })
