import { css } from '@reference-ui/styled'

css({
  _hover: {
    _dark: {
      bg: 'n900',
      color: 'white',
    },
  },
})

css({
  _dark: {
    _hover: {
      _focusVisible: {
        borderColor: 'gold',
        outline: '2px solid yellow',
      },
    },
  },
})
