// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/Reference/components/MemberType.tsx
 * This file is mirrored into reference-core by scripts/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
import { Div } from '@reference-ui/react'
import { MonoText } from './shared/MonoText'

export function MemberType({ typeLabel }: { typeLabel: string }) {
  return (
    <Div
      //px="1.5r"
      py="0.5r"
      color="blue.300"
      borderRadius="1r"
      display="inline-flex"
      width="fit-content"
      fontFamily="reference.sans"
      fontWeight="550"
      mb="2r"
    >
      {typeLabel}
    </Div>
  )
}
