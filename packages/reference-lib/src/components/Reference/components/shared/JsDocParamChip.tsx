/**
 * JSDoc param chip: the small tag label marking params and returns.
 * Takes the tag label plus an optional className; pure inline chrome.
 */
import * as React from 'react'
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
      gap="0.5r"
      fontFamily="reference.mono"
      fontSize="4r"
      weight="mono.semibold"
      width="fit-content"
      maxWidth="100%"
      borderRadius="9999px"
      color="reference.highlight"
      className={className}
    >
      <Div mt="3px" color="reference.highlight">
        <AtSignIcon size="1rem" aria-hidden />
      </Div>

      {tagLabel}
    </Div>
  )
}
