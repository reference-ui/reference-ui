import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { tokens } from '@reference-ui/system'

void React

tokens({
  colors: {
    layerPrivateAccent2: {
      value: '#9f1239',
    },
  },
})

export function LayerPrivate2Demo() {
  return (
    <Div
      data-testid="layer-private-2-demo"
      bg="layerPrivateAccent2"
      padding="5r"
      borderRadius="lg"
      display="flex"
      flexDirection="column"
      gap="2r"
    >
      <Span data-testid="layer-private-2-demo-label" fontWeight="600" color="white">
        Layer-2 private token
      </Span>
      <Span data-testid="layer-private-2-demo-copy" color="white">
        Rendered from inside layer-library-2&apos;s own CSS layer.
      </Span>
    </Div>
  )
}
