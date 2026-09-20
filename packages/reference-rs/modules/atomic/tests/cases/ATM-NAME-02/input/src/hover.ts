import { css } from '@reference-ui/react'

export const hover = css({ _hover: { bg: 'n300' } })
export const nested = css({ _dark: { _hover: { bg: 'n300' } } })
// Twin catalog (baseSystem.json `__x`): the `_x` member mints through the
// twin while the plan survives, so the differential pins the known-set.
export const twin = css({ color: { _x: 'n300', md: 'n300' } })
