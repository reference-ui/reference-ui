import { Div } from '@reference-ui/react'

export function ResponsiveRepro() {
  return (
    <Div container>
      <Div display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}>
        <Div>One</Div><Div>Two</Div><Div>Three</Div>
      </Div>
    </Div>
  )
}
