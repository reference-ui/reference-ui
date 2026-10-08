import { css } from '@reference-ui/react'
import { kit, tone } from './barrel'

export const scalar = css({ color: tone })
export const spread = css({ ...kit, padding: '4px' })
