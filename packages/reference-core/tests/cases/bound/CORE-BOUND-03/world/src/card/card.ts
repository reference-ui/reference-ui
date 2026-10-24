// Card for the CORE-BOUND-03 world: one blue rule with padding, in a nested folder of src/.
// It takes the core style function and emits a single exported rule. The self-links make the walk reach this file again at every level, and the sheet must still hold its rule once.
import { css } from '@reference-ui/react'

export const card = css({ color: 'blue', padding: '4px' })
