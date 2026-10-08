import { css } from '@reference-ui/react'

export const asserted = css(<any>{ color: 'purple' })
export const valueAsserted = css({ color: <any>'teal' })

const w = 'navy'

export const instantiated = css({ color: w<string> })
