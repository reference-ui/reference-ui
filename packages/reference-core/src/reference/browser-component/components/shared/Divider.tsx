// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/Reference/components/shared/Divider.tsx
 * This file is mirrored into reference-core by tools/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'

export type DividerProps = React.ComponentPropsWithoutRef<typeof Div>

const dividerCss = {
  width: '100%',
  height: '1px',
  borderTopWidth: '1px',
  borderTopStyle: 'dashed',
  borderTopColor: 'reference.border',
  opacity: 0.8,
} as React.ComponentProps<typeof Div>['css']

export function Divider({ css, ...props }: DividerProps) {
  return <Div aria-hidden="true" css={{ ...dividerCss, ...css }} {...props} />
}