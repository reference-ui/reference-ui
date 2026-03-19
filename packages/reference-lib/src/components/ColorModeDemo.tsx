import { Div, Span } from '@reference-ui/react'
import { tokens } from '@reference-ui/system'

tokens({
  colors: {
    colorModeDemoBg: {
      value: '{colors.gray.50}',
      dark: '{colors.gray.950}',
    },
    colorModeDemoText: {
      value: '{colors.gray.950}',
      dark: '{colors.gray.50}',
    },
  },
})

export function ColorModeDemo() {
  return (
    <Div
      data-testid="color-mode-demo"
      display="grid"
      gridTemplateColumns="repeat(2, minmax(0, 1fr))"
      gap="4r"
    >
      <Div
        data-testid="color-mode-demo-light"
        bg="colorModeDemoBg"
        color="colorModeDemoText"
        borderRadius="xl"
        padding="5r"
        display="flex"
        flexDirection="column"
        gap="2r"
      >
        <Span
          data-testid="color-mode-demo-light-title"
          fontWeight="600"
          color="colorModeDemoText"
        >
          Light mode
        </Span>
        <Span data-testid="color-mode-demo-light-copy" color="colorModeDemoText">
          Uses the default token values.
        </Span>
      </Div>

      <Div
        data-testid="color-mode-demo-dark"
        data-panda-theme="dark"
        bg="colorModeDemoBg"
        color="colorModeDemoText"
        borderRadius="xl"
        padding="5r"
        display="flex"
        flexDirection="column"
        gap="2r"
      >
        <Span
          data-testid="color-mode-demo-dark-title"
          fontWeight="600"
          color="colorModeDemoText"
        >
          Dark mode
        </Span>
        <Span data-testid="color-mode-demo-dark-copy" color="colorModeDemoText">
          Uses the dark token overrides.
        </Span>
      </Div>
    </Div>
  )
}
