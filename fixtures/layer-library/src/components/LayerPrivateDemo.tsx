import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { tokens } from '@reference-ui/system'

void React

/**
 * Registers `layerPrivateAccent` as a token LOCAL to this layer-library.
 *
 * When a consumer uses `layers: [baseSystem]` (instead of `extends`), this
 * CSS variable stays INSIDE the library's own CSS layer scope. The consumer
 * cannot reference it by name on a bare primitive like:
 *
 *   <Div bg="layerPrivateAccent">  // will NOT resolve — token not in global space
 *
 * But this component works because it lives inside the same layer scope.
 * That's the whole point: consumers get the component, not the token.
 */
tokens({
  colors: {
    layerPrivateAccent: {
      value: '#6366f1',
    },
  },
})

export function LayerPrivateDemo() {
  return (
    <Div
      data-testid="layer-private-demo"
      bg="layerPrivateAccent"
      padding="5r"
      borderRadius="xl"
      display="flex"
      flexDirection="column"
      gap="2r"
    >
      <Span data-testid="layer-private-demo-label" fontWeight="600" color="white">
        Layer-private token
      </Span>
      <Span data-testid="layer-private-demo-copy" color="white">
        This indigo background resolves because this component lives inside the layer. A
        bare &lt;Div bg="layerPrivateAccent"&gt; in the consumer would not.
      </Span>
    </Div>
  )
}
