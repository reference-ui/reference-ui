import { tokens } from '@reference-ui/core'

/**
 * Novel consumer-local token for the uncomposed sync leg. The token resolves,
 * so the only thing wrong with the styled icon is that nothing backs it.
 */
tokens({
  colors: {
    t18UnbackedInk: { value: 'rgb(150, 29, 106)', description: 'T18 uncomposed-icons sync probe.' },
  },
})
