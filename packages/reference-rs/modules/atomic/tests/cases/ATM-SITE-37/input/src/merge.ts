import { css } from '@reference-ui/react'

declare const rest: object

export const merged = css([{ color: 'red' }, ...rest, { color: 'blue' }])
export const literalMerge = css([{ color: 'green' }, ...[{ color: 'pink' }], { color: 'cyan' }])
