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
    docsHeading: {
      value: '{colors.gray.900}',
      dark: '{colors.gray.100}',
    },
    docsNavHeading: {
      value: '{colors.gray.500}',
      dark: '{colors.gray.500}',
    },
    docsAccent: {
      value: '{colors.blue.600}',
      dark: '{colors.blue.300}',
    },
    docsAccentSoft: {
      value: '{colors.blue.100}',
      dark: '{colors.blue.900}',
    },
    docsSidebarBg: {
      value: '{colors.blue.100}',
      dark: '{colors.gray.950}',
    },
    docsSidebarBorder: {
      value: '{colors.blue.200}',
      dark: '{colors.gray.800}',
    },
    docsDemoMutedBg: {
      value: '{colors.gray.50}',
      dark: '{colors.gray.950}',
    },
    docsDemoCard: {
      value: '#ffffff',
      dark: '{colors.gray.900}',
    },
    docsInlineCodeBg: {
      value: '{colors.gray.100}',
      dark: '{colors.gray.800}',
    },
    docsBlockquoteBorder: {
      value: '{colors.gray.300}',
      dark: '{colors.gray.600}',
    },
  },
})
