import { css } from '@reference-ui/react'

export const bare = css({ color: 'red' })
export const paren = css(({ color: 'orange' }))
export const asConst = css({ color: 'yellow' } as const)
export const satisfies = css({ color: 'green' } satisfies { color: string })
export const nonNull = css({ color: 'lime' }!)
export const multi = css({ padding: '1r' }, ({ margin: '2r' }))
