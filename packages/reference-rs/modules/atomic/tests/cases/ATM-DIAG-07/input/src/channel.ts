import { css } from '@reference-ui/react'

export const styles = css({
  color: maybeColor(),
  width: props.w,
  height: depth,
  padding: depth,
  margin: `${gap}px`,
  [dynamicKey]: '10px',
  frobnicate: 'x',
  ...spreadMe,
  _hover: 'red',
  r: { wat: { p: '1r' } },
  borderColor: true ? 'white' : 'black',
  mt: '2r',
})

let tint = 'red'
tint = 'blue'
export const tinted = css({ color: tint })
