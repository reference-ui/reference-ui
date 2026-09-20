// Enterprise harvest fixture: the two conditioned holes (ATM-HARVEST-03
// pattern). Proves when copies per-sink rather than multiplying the pool.
import { css } from '@reference-ui/react'

export function hoverPaint(shade: string) {
  return css({ _hover: { color: shade } })
}

export function mdPaint(w: string) {
  return css({ width: { md: w } })
}
