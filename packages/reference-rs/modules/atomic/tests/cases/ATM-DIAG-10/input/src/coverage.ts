import { css } from '@reference-ui/react'

const palette = ['red']

export function paint(themeVar: string) {
  return css({ color: themeVar, mt: '2r' })
}

export const fallback = css({ color: 'red' })
