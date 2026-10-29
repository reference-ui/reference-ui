/**
 * Reference inline code: renders prose with `backtick` spans as mono
 * inline code. Takes the raw string; a small splitter builds React nodes,
 * so authored text is always escaped and never parsed as markup.
 */
import * as React from 'react'
import { MonoText } from './MonoText'

export type InlineCodePart = { kind: 'text' | 'code'; value: string }

/** Splits on paired single backticks; an unpaired or empty pair stays literal text. */
export function splitInlineCode(text: string): InlineCodePart[] {
  const parts: InlineCodePart[] = []
  let literal = ''
  let index = 0

  while (index < text.length) {
    const close = text[index] === '`' ? text.indexOf('`', index + 1) : -1
    if (close > index + 1) {
      if (literal) parts.push({ kind: 'text', value: literal })
      literal = ''
      parts.push({ kind: 'code', value: text.slice(index + 1, close) })
      index = close + 1
      continue
    }
    literal += text[index]
    index += 1
  }

  if (literal) parts.push({ kind: 'text', value: literal })
  return parts
}

export function InlineCode({ text, codeColor }: { text: string; codeColor?: React.ComponentProps<typeof MonoText>['color'] }) {
  return (
    <>
      {splitInlineCode(text).map((part, index) =>
        part.kind === 'code' ? (
          <MonoText key={index} color={codeColor}>
            {part.value}
          </MonoText>
        ) : (
          <React.Fragment key={index}>{part.value}</React.Fragment>
        ),
      )}
    </>
  )
}
