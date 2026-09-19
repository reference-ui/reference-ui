import { css } from '@reference-ui/react'

const palette = ['red', '#0af']

export function paint(shade: string) {
  return css({ _hover: { color: shade } })
}
