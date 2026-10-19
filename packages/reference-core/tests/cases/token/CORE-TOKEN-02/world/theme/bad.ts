// Deliberately broken fixture for the TOKEN-02 world: cls holds the {colors.nope} ref. Takes the
// generated react entry and emits the compile diagnostic the spec pins; sync fails loud, never a
// ghost class.
import { css } from '@reference-ui/react'

export const cls = css({ border: '2px solid {colors.nope}' })
