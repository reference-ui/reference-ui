import { css } from '@reference-ui/react'

declare const dyn: string

export const refused = css({ padding: ['8px', ...dyn, '12px'] })
export const literalTwin = css({ margin: ['1px', ...['2px', '3px'], '4px'] })
export const clean = css({ padding: ['8px', '12px'] })
