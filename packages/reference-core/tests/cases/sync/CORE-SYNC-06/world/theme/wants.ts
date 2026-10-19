// Style-want fixture for the SYNC-06 world: cls, hoverCls over color, backgroundColor, _hover.
// Takes the generated react entry and emits the wants the spec asserts in the output.
import { css } from '@reference-ui/react'

export const cls = css({ color: 'brand', backgroundColor: 'ink' })
export const hoverCls = css({ _hover: { color: 'ink' } })
