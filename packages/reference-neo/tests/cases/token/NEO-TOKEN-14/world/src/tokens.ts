import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    gray: {
      50: { value: '#f9fafb' },
      950: { value: '#030712' },
    },
    ui: {
      progress: {
        track: {
          mixForeground: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
          mixBackground: { light: '#ffffff', dark: '{colors.gray.950}' },
        },
      },
    },
  },
})
