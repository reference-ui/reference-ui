/**
 * Font stacks that match {@link ./fonts} `fontFace` registrations (Inter, Literata, JetBrains Mono).
 * Use these for `reference.*` semantic tokens so `fontFamily="reference.mono"` resolves to the same
 * face as `fontFamily="mono"` from the global theme.
 */
export const fontStacks = {
  sans: '"Inter", ui-sans-serif, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
} as const
