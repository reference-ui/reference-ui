/**
 * Choice-item chrome: the fixed indicator slot keeping labels aligned
 * with unchecked siblings, and the shared choice row layout. The glyph
 * stays aria-hidden so it never leaks into accessible names or
 * typeahead text; checkbox and radio items compose both.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { controlSize } from '../../../core/theme/primitives/shared'

export function ChoiceIndicator({ glyph }: { glyph: string }) {
  // Fixed slot keeps labels aligned with unchecked siblings. aria-hidden
  // keeps the glyph out of accessible names and typeahead text.
  return (
    <Div
      aria-hidden="true"
      data-menu-indicator=""
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
      w="4r"
      mr="2r"
    >
      {glyph}
    </Div>
  )
}

export function choiceItemLayout(disabled: boolean) {
  return {
    display: 'flex',
    alignItems: 'center',
    minHeight: controlSize.height,
    height: 'auto',
    px: '3r',
    py: controlSize.paddingBlock,
    boxSizing: 'border-box',
    borderRadius: 'sm',
    fontSize: '3.5r',
    lineHeight: '5r',
    cursor: disabled ? 'not-allowed' : 'pointer',
    bg: 'transparent',
    color: 'design.text.base',
    opacity: disabled ? 0.5 : 1,
    outline: 'none',
    userSelect: 'none',
  } as const
}
