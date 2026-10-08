import { css } from '@reference-ui/react'

declare const unknown: Record<string, string>

// A bare unresolvable spread skips with one warning; static siblings stay.
export const a = css({ ...unknown, color: 'red' })
