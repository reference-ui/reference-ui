import { css } from '@reference-ui/react'

const palette = ['red']

export function paint(color: string) {
  return css({ color, padding: '4px' })
}
