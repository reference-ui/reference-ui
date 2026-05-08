import { H1, Main, P } from '@reference-ui/react'

export const matrixVirtualMarker = 'reference-ui-matrix-virtual'

export function Index() {
  return (
    <Main data-testid="virtual-root" p="4" gap="4">
      <H1>Reference UI virtual matrix</H1>
      <P>Virtual output and transform contracts are exercised through ref sync artifacts.</P>
    </Main>
  )
}