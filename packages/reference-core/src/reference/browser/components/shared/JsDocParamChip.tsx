// This component is copied from reference-lib, do not modify here.
// Source: packages/reference-lib/src/Reference/components/shared/JsDocParamChip.tsx
import { Div } from '@reference-ui/react'
import { AtSignIcon } from './AtSignIcon'

export type JsDocParamChipProps = {
  /** Text after the @ (e.g. `param`, `returns`). */
  tagLabel: string
}

/**
 * JSDoc tag chip: **@** icon + label in one pill-shaped container.
 */
export function JsDocParamChip({ tagLabel }: JsDocParamChipProps) {
  return (
    <Div
      display="inline-flex"
      alignItems="center"
      gap="reference.xxs"
      fontFamily="reference.mono"
      fontSize="4r"
      fontWeight="550"
      width="fit-content"
      maxWidth="100%"
      borderRadius="9999px"
      //borderWidth="1px"
      //borderStyle="solid"
      //borderColor="blue.900"
      color="reference.primary"
      //className={className}
    >
      <Div mt="3px">
        <AtSignIcon size="1rem" aria-hidden />
      </Div>

      {tagLabel}
    </Div>
  )
}
