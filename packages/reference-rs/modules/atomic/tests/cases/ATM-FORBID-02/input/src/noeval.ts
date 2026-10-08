import { css } from '@reference-ui/react'

function maybeFn() {
  throw new Error('must not evaluate')
}

export const styles = css({
  mt: '2r',
  color: maybeFn(),
})
