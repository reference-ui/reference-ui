import { css } from '@reference-ui/react'

enum Sizes {
  Small = '4px',
  Medium = '8px',
  Large = '12px',
}
enum Levels {
  Low = 1,
  High = 99,
}
enum Signs {
  Neg = -1,
  Plus = +2,
}
enum Chain {
  A = 'red',
  B = A,
  C = 'bl' + 'ue',
  Auto,
}
enum Flags {
  On = true,
}
enum Computed {
  Sum = 40 + 2,
  Greet = `bl${'ue'}`,
  Flip = !0,
  Mask = ~1,
  Wrap = '4px',
  Cast = '8px' as const,
}

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

export const computed = css({
  color: Chain.C,
  zIndex: Computed.Sum,
  backgroundColor: Computed.Greet,
  flexGrow: Computed.Flip,
  top: Computed.Mask,
  padding: Computed.Wrap,
  margin: Computed.Cast,
})

export const drops = css({
  padding: Chain.B,
  width: Chain.Auto,
  height: '4px',
})

export const shadowed = (() => {
  const Sizes = { Small: '2px' }
  return css({ padding: Sizes.Small })
})()

export const flag = css({ flexGrow: Flags.On, margin: '3r' })
