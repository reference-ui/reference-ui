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
      gap="3r"
      padding="2r"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="base"
      backgroundColor="white"
      // position="relative"
    >
      <Div
        width="12r"
        height="16r"
        borderRadius="base"
        flexShrink="0"
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
      </Div>
    </Div>
  );
}
