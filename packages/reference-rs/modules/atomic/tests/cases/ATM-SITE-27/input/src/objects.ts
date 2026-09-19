import { css } from '@reference-ui/react'

declare const flag: boolean
declare const maybeFn: () => string

export const bothArms = css({ color: flag ? { base: 'white' } : { base: 'black' } })
export const dynamicAlternate = css({ color: flag ? { base: 'white' } : maybeFn() })
export const dynamicConsequent = css({ color: flag ? maybeFn() : { base: 'black' } })
