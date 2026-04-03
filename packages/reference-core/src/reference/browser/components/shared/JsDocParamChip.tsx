// This component is copied from reference-lib, do not modify here.
// Source: packages/reference-lib/src/Reference/components/shared/JsDocParamChip.tsx
import { Div } from '@reference-ui/react'

export type JsDocParamChipProps = {
  /** Text after the @ (e.g. `param`, `returns`). */
  tagLabel: string
}

/**
 * JSDoc tag chip: @tagLabel in one pill-shaped container.
 * The `@` is rendered as a text character so it forms a single text node
 * with the tag label, keeping accessible text queries (e.g. getByText('@param')) working.
 */
export function JsDocParamChip({ tagLabel }: JsDocParamChipProps) {
  return (
    <Div
      display="inline-flex"
      alignItems="center"
      fontFamily="reference.mono"
      fontSize="4r"
      fontWeight="550"
      width="fit-content"
      maxWidth="100%"
      borderRadius="9999px"
      color="reference.primary"
    >
      @{tagLabel}
    </Div>
  )
}
