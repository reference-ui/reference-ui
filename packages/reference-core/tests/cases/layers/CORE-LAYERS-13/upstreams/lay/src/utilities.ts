// Utility source for the CORE-LAYERS-13 layered upstream. It takes one dark-mode css() call and
// one wide-container css() call, the two conditional rules the probes rank against own and extends.

import { css } from '@reference-ui/react'

export const layDarkClass = css({ _dark: { color: 'layDark' } })
export const laySmClass = css({ sm: { color: 'laySm' } })
