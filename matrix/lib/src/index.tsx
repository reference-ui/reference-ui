import React from 'react'
import { H1, Main, P } from '@reference-ui/react'

export function Index() {
  return (
    <Main data-testid="lib-root" p="4" gap="3">
      <H1>Reference UI lib</H1>
      <P>Library fixture for foundation and ARIA primitives.</P>
      <P data-testid="react-version">{React.version}</P>
    </Main>
  )
}
