// Dynamic content for the NEO-SYNC-16 world. It takes parameter-driven values
// a static compile cannot know and emits refused css() calls: an identifier,
// a member read, an unfoldable spread, and a dead branch, so the compiler
// channel is non-empty while the sync itself stays green.
import { css } from '@reference-ui/react'

const palette = ['red', 'blue']

export function paint(i: number): string {
  return css({ color: palette[i] })
}

export function tint(themeColor: string): string {
  return css({ color: themeColor })
}

export function spreadIt(overrides: Record<string, string>): string {
  return css({ color: 'brand', ...overrides })
}

const alwaysOn = true

export const branched = css({ borderColor: alwaysOn ? 'white' : 'black' })

export const probe = paint(0)
