import { css } from '@reference-ui/react'

// Static computed keys resolve exactly like their bare spellings.
css({ ['color']: 'red' })
css({ [`backgroundColor`]: 'blue' })
css({ color: 'red' })

// Numeric computed key folds to its spelling, then rides the ordinary
// unknown-property path (never UnfoldableKey).
css({ [42]: 'red' })

// Dynamic computed keys warn once per member; static siblings survive.
declare const key: string
css({ [key]: 'red', padding: '4px' })

declare function pick(): string
css({ [pick()]: 'red', margin: '4px' })
