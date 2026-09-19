import { css } from '@reference-ui/react'

const branded = `brand ${'red'} tonight`

export function paint(color: string, n: number) {
  return [css({ color: `${color}` }), css({ width: `${n}px` })]
}
