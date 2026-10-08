import { css } from '@reference-ui/react'

const palette = ['inherit', 'currentColor']

export function paint(shade: string) {
  return css({ _hover: { color: shade } })
}
