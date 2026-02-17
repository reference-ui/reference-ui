import { useState } from 'react';
import { Div, Button } from '@reference-ui/core';

/**
 * Simple animation demo - just a spinning box
 */
export function AnimationDemo() {
  const [key, setKey] = useState(0);

  return (
    <Div
      p="5"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap="3"
    >
      <Div
        key={key}
        w="100px"
        h="100px"
        bg="blue.500"
        borderRadius="md"
        animation="spin 4s linear infinite"
      />
      <Button onClick={() => setKey((k) => k + 1)} size="sm" visual="ghost">
        Reset
      </Button>
    </Div>
  );
}
