import React from 'react';
import { Div } from '@reference-ui/core';

interface ColorProps {
  name: string;
  value: string;
}

export function Color({ name, value }: ColorProps) {
  return (
    <Div
      display="flex"
      alignItems="center"
      gap="4"
      padding="3"
      border="4px solid"
      borderColor="red.200"
      borderRadius="md"
      backgroundColor="white"
    >
      <Div
        width="16"
        height="16"
        borderRadius="lg"
        flexShrink="0"
        border="1px solid"
        borderColor="blackAlpha.100"
        style={{ backgroundColor: value }}
      />
      <Div flex="1" minWidth="0">
        <Div
          fontWeight="semibold"
          fontSize="sm"
          color="gray.900"
          marginBottom="1"
        >
          {name}
        </Div>
        <Div
          fontFamily="mono"
          fontSize="xs"
          color="gray.600"
          wordBreak="break-all"
        >
          {value}
        </Div>
      </Div>
    </Div>
  );
}
