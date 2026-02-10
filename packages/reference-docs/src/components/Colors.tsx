import React from 'react';
import { Div, H3 } from '@reference-ui/core';
import { Color } from './Color';
import { colors as coreColors } from '@reference-ui/core/styled/colors';

interface ColorScale {
  [key: string]: { value: string };
}

interface ColorsProps {
  palette?: string;
  shade?: string;
}

export function Colors({ palette, shade }: ColorsProps = {}) {
  // If specific palette and shade are provided, show just that color
  if (palette && shade) {
    const colorScale = coreColors[
      palette as keyof typeof coreColors
    ] as ColorScale;
    if (colorScale && colorScale[shade]) {
      return (
        <Color name={`${palette}-${shade}`} value={colorScale[shade].value} />
      );
    }
    return (
      <Div>
        Color not found: {palette}-{shade}
      </Div>
    );
  }

  // If just palette is provided, show all shades in that palette
  if (palette) {
    const colorScale = coreColors[
      palette as keyof typeof coreColors
    ] as ColorScale;
    if (!colorScale) {
      return <Div>Palette not found: {palette}</Div>;
    }

    return (
      <Div display="grid" gridTemplateColumns="repeat(3, 1fr)" gap="3">
        {Object.entries(colorScale).map(([shade, { value }]) => (
          <Color
            key={`${palette}-${shade}`}
            name={`${palette}-${shade}`}
            value={value}
          />
        ))}
      </Div>
    );
  }

  // Show all colors organized by palette
  return (
    <Div display="flex" flexDirection="column" gap="12">
      {Object.entries(coreColors).map(([paletteName, colorScale]) => (
        <Div key={paletteName}>
          <H3
            fontSize="xl"
            fontWeight="bold"
            color="gray.900"
            marginBottom="4"
            textTransform="capitalize"
          >
            {paletteName}
          </H3>
          <Div display="grid" gridTemplateColumns="repeat(3, 1fr)" gap="3">
            {Object.entries(colorScale as ColorScale).map(
              ([shade, { value }]) => (
                <Color
                  key={`${paletteName}-${shade}`}
                  name={`${paletteName}-${shade}`}
                  value={value}
                />
              ),
            )}
          </Div>
        </Div>
      ))}
    </Div>
  );
}
