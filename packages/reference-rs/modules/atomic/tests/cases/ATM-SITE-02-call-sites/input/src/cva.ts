import { cva } from '@reference-ui/styled'

const badge = cva({
  base: { fontWeight: 'bold' },
  variants: {
    variant: {
      solid: { bg: 'blue', color: 'white' },
      outline: { border: '1px solid' },
    },
  },
  compoundVariants: [{ variant: 'solid', css: { opacity: '0.9' } }],
})
void badge
