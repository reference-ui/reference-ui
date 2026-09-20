import { css } from '@reference-ui/react'

export const refused = css({
  translateX: '10px',
  boxSize: '10px',
  spaceX: '10px',
  truncate: 'ellipsis',
  hideFrom: 'md',
  gradientFrom: 'red',
  textStyle: 'body',
  scrollSnapStrictness: 'proximity',
  '&:hover': { spaceY: '4px' },
})

export const siblings = css({
  color: 'red',
  translate: '10px',
  textGradient: 'linear-gradient(red, blue)',
  borderStartRadius: '4px',
})
