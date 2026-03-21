import { tokens } from '@reference-ui/system'

tokens({
  colors: {
    mySpecialToken: { value: 'red' },
    reference: {
      foreground: {
        value: '#fef08a',
        dark: '#3b0764',
      },
      muted: {
        value: '#f9a8d4',
        dark: '#6b21a8',
      },
      border: {
        value: '#22d3ee',
        dark: '#f97316',
      },
      background: {
        value: '#082f49',
        dark: '#fef3c7',
      },
      subtleBackground: {
        value: '#0f766e',
        dark: '#fde68a',
      },
    },
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
