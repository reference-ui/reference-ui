import { tokens } from '@reference-ui/system'

tokens({
  colors: {
    mySpecialToken: { value: 'red' },
    docsPageBg: {
      value: '{colors.gray.50}',
      dark: '{colors.gray.950}',
    },
    docsPanelBg: {
      value: '#ffffff',
      dark: '{colors.gray.900}',
    },
    docsPanelBorder: {
      value: '{colors.gray.200}',
      dark: '{colors.gray.700}',
    },
    docsText: {
      value: '{colors.gray.950}',
      dark: '{colors.gray.50}',
    },
    docsMuted: {
      value: '{colors.gray.600}',
      dark: '{colors.gray.400}',
    },
    docsAccent: {
      value: '{colors.blue.600}',
      dark: '{colors.blue.300}',
    },
    docsAccentSoft: {
      value: '{colors.blue.100}',
      dark: '{colors.blue.900}',
    },
  },
})
