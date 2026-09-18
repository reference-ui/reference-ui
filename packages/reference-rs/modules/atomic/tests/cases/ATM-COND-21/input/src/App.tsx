import { css } from '@reference-ui/react'

export const empty = css({ '@supports': { color: 'red.500' } })
export const bareMedia = css({ '@media': { color: 'red.500' } })
export const queried = css({ '@supports (display: grid)': { color: 'blue.500' } })
