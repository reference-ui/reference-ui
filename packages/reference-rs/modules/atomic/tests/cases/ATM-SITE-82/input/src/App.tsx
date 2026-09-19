import { css } from '@reference-ui/react'
import { ghost } from './nulls'

const n = null

export const cls = css({ color: n, padding: '4px' })
export const imported = css({ color: ghost, margin: '2px' })
