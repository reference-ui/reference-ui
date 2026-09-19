import { css } from '@reference-ui/react'
import { space } from './index'

// Aliased re-export (`export { gap as space }`): `space` is declared
// nowhere, so the merge era warns and drops. The Ph4 build (SPEC-V2-56
// via SPEC-V2-76) resolves this by binding; the probe records today's drop.
css({ margin: space })
