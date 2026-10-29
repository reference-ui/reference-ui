/**
 * Member default line: a labelled "Default" row for a member's `@default`
 * value. Takes the raw default string; code literals (numbers, booleans,
 * null, undefined, string literals, `[]`, `{}`) render in mono, anything
 * else renders as prose with inline code.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { InlineCode } from './shared/InlineCode'
import { MonoText } from './shared/MonoText'

const QUOTED_OR_EMPTY_LITERAL = /^(?:\[\]|\{\}|"[^"]*"|'[^']*')$/

/**
 * True when the default reads as a code literal rather than a sentence. Numbers, booleans, null and
 * undefined are single tokens, and the extractor strips quotes from string defaults (`"start"` arrives
 * as `start`), so a whitespace-free token is code; quoted strings, `[]` and `{}` are code too.
 */
export function isCodeLiteralDefault(value: string): boolean {
  const text = value.trim()
  if (!text) return false
  return !/\s/.test(text) || QUOTED_OR_EMPTY_LITERAL.test(text)
}

export function MemberDefault({ defaultValue }: { defaultValue?: string }) {
  const value = defaultValue?.trim()
  if (!value) return null

  return (
    <Div display="flex" alignItems="baseline" flexWrap="wrap" gap="2r" color="reference.text">
      <Div fontSize="3.5r" color="reference.textLighter">
        Default
      </Div>
      {isCodeLiteralDefault(value) ? (
        <MonoText color="reference.text">{value}</MonoText>
      ) : (
        <Div>
          <InlineCode text={value} />
        </Div>
      )}
    </Div>
  )
}
