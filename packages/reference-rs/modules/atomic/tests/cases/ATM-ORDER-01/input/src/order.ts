import { css } from '@reference-ui/react'

css({
  p: ['1r', '2r', '3r', '4r', '5r', '6r'],
  '@media (max-width: 640px)': { m: '5r' },
  '@media (max-width: 768px)': { m: '4r' },
  '@media (max-width: 1024px)': { m: '3r' },
  '@media (max-width: 1280px)': { m: '2r' },
  '@media (max-width: 1536px)': { m: '1r' },
})
