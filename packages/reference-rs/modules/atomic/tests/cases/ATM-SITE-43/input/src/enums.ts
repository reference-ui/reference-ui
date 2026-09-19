import { css } from '@reference-ui/react'

enum Sizes { Small = '4px', Medium = '8px', Large = '12px' }
enum Levels { Low = 1, High = 99 }
enum Signs { Neg = -1, Plus = +2 }
enum Chain { A = 'red', B = A, C = 'a' + 'b', Auto }
enum Flags { On = true }

export const folds = css({
  padding: Sizes.Small,
  margin: Sizes.Medium,
  width: Sizes.Large,
  zIndex: Levels.High,
  order: Levels.Low,
  top: Signs.Neg,
  left: Signs.Plus,
  color: Chain.A,
})

export const drops = css({
  padding: Chain.B,
  margin: Chain.C,
  width: Chain.Auto,
  height: '4px',
})

export const shadowed = (() => {
  const Sizes = { Small: '2px' }
  return css({ padding: Sizes.Small })
})()

export const flag = css({ flexGrow: Flags.On, margin: '3r' })
