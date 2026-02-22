import { useState } from 'react'
import { Div, Button } from '@reference-ui/react'

/**
 * Simple animation demo - just a spinning box
 */
export function AnimationDemo() {
  const [key, setKey] = useState(0)

  return (
    <Div
      px2="wtrf"
      p="5r"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap="3r"
    >
      <Div
        key={key}
        w="10r"
        h="10r"
        bg="green.300"
        borderRadius="md"
        animation="spin.slow"
      />
      <Button onClick={() => setKey(k => k + 1)}>Reset</Button>
    </Div>
  )
}
