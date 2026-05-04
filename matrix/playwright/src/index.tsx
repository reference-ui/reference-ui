import { H1, Main, P } from '@reference-ui/react'

export const matrixPlaywrightMarker = 'reference-ui-matrix-playwright'

export function Index() {
  return (
    <Main data-testid="playwright-root" p="4" gap="3">
      <H1>Reference UI Playwright matrix</H1>
      <P>Playwright is rendering real Reference UI primitives through the matrix fixture.</P>
    </Main>
  )
}