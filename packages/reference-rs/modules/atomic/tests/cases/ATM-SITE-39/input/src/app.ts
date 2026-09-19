import { css } from '@reference-ui/react'
import { hover } from './styles'

export const top = css({ ...hover, backgroundColor: 'blue' })
export const underCondition = css({ _hover: { ...hover } })
