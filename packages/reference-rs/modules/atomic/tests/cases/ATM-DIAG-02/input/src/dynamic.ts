import { css } from '@reference-ui/react'

const dynamicKey = 'width'
export const styles = css({
  mt: '2r',
  color: maybeColor(),
  width: `${props.w}px`,
  [dynamicKey]: '10px',
})
