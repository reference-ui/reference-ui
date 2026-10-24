// Card for the CORE-BOUND-07 world: one blue rule with padding, in a nested folder of src/.
// It takes the core style function and emits a single exported rule. The FIFO beside it must not change this rule or the sheet that carries it.
import { css } from '@reference-ui/react'

export const card = css({ color: 'blue', padding: '4px' })
