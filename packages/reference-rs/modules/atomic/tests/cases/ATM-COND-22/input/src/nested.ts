import { css } from '@reference-ui/react'

export const iconOnly = css({
  '&:where(:has(> [data-slot="icon"]:only-child, > svg:only-child))': {
    paddingInline: '0',
  },
})
