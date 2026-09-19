import { css, keyframes, positionTry, viewTransition } from '@reference-ui/react'
import { keyframes as kf } from '@reference-ui/system'

export const spin = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })
export const none = positionTry({ top: 'anchor(bottom)' })
export const aliased = kf({ from: { opacity: 0 }, to: { opacity: 1 } })
export const chained = spin
export const vt = viewTransition({ update: 'fade' })
export const bad = keyframes('spin')
export const empty = keyframes()

let wobble = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })
wobble = 'x'

export const a = css({ animationName: spin })
export const b = css({ positionTryFallbacks: none })
export const c = css({ animationName: aliased })
export const d = css({ animationName: chained })

export const e = css({ animationName: vt, margin: '1r' })
export const f = css({ animationName: bad, margin: '2r' })
export const g = css({ animationName: empty, margin: '3r' })
export const h = css({ animationName: wobble, margin: '4r' })

export const shadowed = (() => {
  const keyframes = (def: object) => 'local'
  const local = keyframes({ from: { opacity: 0 } })
  return css({ animationName: local, margin: '5r' })
})()
