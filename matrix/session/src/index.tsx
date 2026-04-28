import { H1, Main, P } from '@reference-ui/react'

export const matrixSessionMarker = 'reference-ui-matrix-session'

export function Index() {
  return (
    <Main data-testid="session-root" p="4" gap="4">
      <H1>Reference UI session matrix</H1>
      <P>Session manifest and one-shot lifecycle contracts are exercised through ref sync artifacts.</P>
    </Main>
  )
}