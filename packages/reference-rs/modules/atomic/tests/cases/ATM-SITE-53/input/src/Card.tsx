import { css } from '@reference-ui/react'

const tone = 'red.500'

// A param shadows the cross-file `color` const: dynamic, zero wants,
// never the silent cross-file value (the SPEC-V2-75 ghost).
export function Card({ color }: { color: string }) {
  return css({ color })
}

// An inner const shadows the outer same-named const: blue only, no union.
export function Swatch() {
  const tone = 'blue.500'
  return css({ color: tone })
}

// The outer const still resolves at the top level.
export const top = css({ color: tone })
