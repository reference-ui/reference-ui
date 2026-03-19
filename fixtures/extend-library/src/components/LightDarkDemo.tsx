import React from 'react'
import { Div, Span } from '@reference-ui/react'
import { tokens } from '@reference-ui/system'

tokens({
  colors: {
    lightDarkDemoBg: {
      value: '#f8fafc',
      dark: '#020617',
    },
    lightDarkDemoText: {
      value: '#020617',
      dark: '#f8fafc',
    },
  },
})

export function LightDarkDemo() {
  return (
    <Div
      data-testid="light-dark-demo"
      display="grid"
      gridTemplateColumns="repeat(2, minmax(0, 1fr))"
      gap="4r"
    >
      <Div
        data-testid="light-dark-demo-light"
        bg="lightDarkDemoBg"
        color="lightDarkDemoText"
        borderRadius="xl"
        padding="5r"
        display="flex"
        flexDirection="column"
        gap="2r"
      >
        <Span
          data-testid="light-dark-demo-light-title"
          fontWeight="600"
          color="lightDarkDemoText"
        >
          Light mode
        </Span>
        <Span data-testid="light-dark-demo-light-copy" color="lightDarkDemoText">
          Uses the default token values.
        </Span>
      </Div>

      <Div
        data-testid="light-dark-demo-dark"
        data-panda-theme="dark"
        bg="lightDarkDemoBg"
        color="lightDarkDemoText"
        borderRadius="xl"
        padding="5r"
        display="flex"
        flexDirection="column"
        gap="2r"
      >
        <Span
          data-testid="light-dark-demo-dark-title"
          fontWeight="600"
          color="lightDarkDemoText"
        >
          Dark mode
        </Span>
        <Span data-testid="light-dark-demo-dark-copy" color="lightDarkDemoText">
          Uses the dark token overrides.
        </Span>
      </Div>
    </Div>
  )
}
