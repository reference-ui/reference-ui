import { css } from '@reference-ui/react'

// Pool bait no site reads: the two named colors the system declares as
// `colors` tokens plus one undeclared shade. The dynamic `color` site sinks
// on all three; only the declared token names may mint.
const palette = ['red', 'blue', 'hotpink']

export function paint(color: string) {
  return css({ color })
}
