import { css, Div } from '@reference-ui/react'

const w = '5px'

export const wrapped = css({
  width: (w),
  height: '10px' as const,
  color: 'red' satisfies string,
  padding: '3px'!,
})

export const nested = css({ top: ((('9px' as const))) })

export const jsx = <Div mt={('2r' as const)} />

void wrapped
void nested
void jsx
