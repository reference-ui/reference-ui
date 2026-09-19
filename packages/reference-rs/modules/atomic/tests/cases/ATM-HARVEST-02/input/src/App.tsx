import { css } from '@reference-ui/react'

export function paint(n: number, hex: string) {
  return [css({ margin: `2${n}r` }), css({ color: `#${hex}` })]
}
