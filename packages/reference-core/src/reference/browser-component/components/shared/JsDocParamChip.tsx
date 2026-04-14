// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/Reference/components/shared/JsDocParamChip.tsx
 * This file is mirrored into reference-core by tools/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
import { Div } from '@reference-ui/react'
import { AtSignIcon } from './AtSignIcon'

export type JsDocParamChipProps = {
  /** Text after the @ (e.g. `param`, `returns`). */
  tagLabel: string
  className?: string
}

/**
 * JSDoc tag chip: **@** icon + label in one pill-shaped container.
 */
export function JsDocParamChip({ tagLabel, className }: JsDocParamChipProps) {
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
      color="blue.300"
      className={className}
    >
      <Div mt="3px">
        <AtSignIcon size="1rem" aria-hidden />
      </Div>

      {tagLabel}
    </Div>
  )
}
