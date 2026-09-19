import { css } from '@reference-ui/react'

export const styles = css({
  color: themeColor,
  width: props.w,
  height: `${n}px`,
  padding: `${color}`,
  margin: maybeMargin(),
  borderWidth: a + b,
  ...spreadMe,
  mt: '2r',
})
