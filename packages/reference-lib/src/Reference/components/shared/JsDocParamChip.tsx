import { Div } from '@reference-ui/react'
import { AtSignIcon } from './AtSignIcon.js'

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
      width="fit-content"
      maxWidth="100%"
      px="1.5r"
      py="0.5r"
      borderRadius="9999px"
      borderWidth="1px"
      borderStyle="solid"
      borderColor="reference.primarySoftBorder"
      background="reference.primarySoftBackground"
      color="reference.primarySoftForeground"
      //className={className}
    >
      <AtSignIcon size="1rem" aria-hidden />
      {tagLabel}
    </Div>
  )
}
