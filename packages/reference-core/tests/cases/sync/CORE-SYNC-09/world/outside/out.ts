// Out-of-scope fixture for the SYNC-09 world: outOfScope sits outside include. Takes the generated
// react entry and emits nothing — the spec asserts its utility is absent from the output.
import { css } from '@reference-ui/react'

export const outOfScope = css({ color: 'blue' })
