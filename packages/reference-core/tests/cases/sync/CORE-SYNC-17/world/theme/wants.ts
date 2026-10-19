// Style-want fixture for the SYNC-17 world: upCls, ownCls over color. Takes the generated react
// entry and emits the wants the spec asserts in the output.
import { css } from '@reference-ui/react'

export const upCls = css({ color: 'up' })
export const ownCls = css({ color: '_private.ownSecret' })
