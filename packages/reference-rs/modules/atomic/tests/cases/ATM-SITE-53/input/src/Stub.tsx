import { css } from '@reference-ui/react'
import { theme } from './tokens'

// Imported names resolve through the import lookup stub.
export const a = css({ color: theme.primary })

// Genuinely unbound names still consult the project bag (merge-era shape).
export const b = css({ backgroundColor: color })
