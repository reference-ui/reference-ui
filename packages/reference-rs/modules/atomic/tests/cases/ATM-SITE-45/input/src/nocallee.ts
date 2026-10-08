import { css } from '@reference-ui/react'

declare function token(path: string): string

export const a = css({ color: token('colors.red.500'), margin: '1r' })
