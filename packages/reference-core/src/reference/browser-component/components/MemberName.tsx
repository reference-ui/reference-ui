// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/Reference/components/MemberName.tsx
 * This file is mirrored into reference-core by scripts/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
import { Div } from '@reference-ui/react'
import { MonoText } from './shared/MonoText'

export function MemberName({ name }: { name: string }) {
  return (
    <Div
      //px="1.5r"
      py="0.5r"
      //backgroundColor="gray.800"
      color="white"
      borderRadius="1r"
      display="inline-flex"
      width="fit-content"
      fontFamily="reference.mono"
      fontWeight="550"
      fontSize="4.5r"
      //mb="1r"
    >
      {name}
    </Div>
  )
}
