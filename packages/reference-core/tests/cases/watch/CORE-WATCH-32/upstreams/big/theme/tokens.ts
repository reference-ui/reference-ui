// Token fragment for the CORE-WATCH-32 big upstream. It takes nothing and emits four thousand colour
// and spacing tokens built in a loop, so the source stays small while the published system is large.

import { tokens } from '@reference-ui/core'

const COUNT = 4000

function hex(i: number): string {
  return `#${((i * 2654435761) % 0xffffff).toString(16).padStart(6, '0')}`
}

tokens({
  colors: Object.fromEntries(Array.from({ length: COUNT }, (_, i) => [`big${i}`, { value: hex(i) }])),
  spacing: Object.fromEntries(Array.from({ length: COUNT }, (_, i) => [`bigSpace${i}`, { value: `${i + 1}px` }])),
})
