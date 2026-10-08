import { css } from '@reference-ui/react'

const palette = ['inherit']

export function paint(color: string) {
  return css({ color, padding: '4px' })
}
