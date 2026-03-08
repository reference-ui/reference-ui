#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const outPath = path.join(__dirname, '../src/docs/components/primitives.mdx')

const content = `---
title: Primitives
section: Components
order: 1
slug: primitives
---

import { A, Code, Div, H2, Li, P, Pre, Span, Ul } from '@reference-ui/react'

# Primitives

Primitives are typed React wrappers around real HTML tags. They let you keep the semantics of native elements like \`div\`, \`a\`, and \`p\` while gaining access to Reference UI style props and generated classes.

## Why primitives exist

Reference UI deliberately starts from the platform. Instead of introducing a generic \`Box\` or forcing everything through an \`as\` prop, each primitive maps directly to a real element.

- You keep native HTML semantics.
- You get typed props for the element you are rendering.
- You can use Reference UI style props directly in JSX.
- You can still fall back to \`css()\` when you want reusable class composition.

## Mental model

Think of a primitive as:

\`\`\`tsx
<Div padding="4r" borderWidth="1px" borderColor="gray.300" />
\`\`\`

which is roughly equivalent to:

\`\`\`tsx
<div className={css({ padding: '4r', borderWidth: '1px', borderColor: 'gray.300' })} />
\`\`\`

The difference is that primitives keep the element-level API ergonomic and semantic, especially for app and content UI.

## Common examples

### Layout

<Div
  display="grid"
  gap="3r"
  padding="4r"
  borderWidth="1px"
  borderColor="gray.300"
  borderRadius="lg"
  backgroundColor="white"
>
  <Span color="gray.600">A primitive can be a layout container.</Span>
  <Span fontWeight="600">It still renders a real \`div\`.</Span>
</Div>

\`\`\`tsx
import { Div, Span } from '@reference-ui/react'

export function Card() {
  return (
    <Div
      display="grid"
      gap="3r"
      padding="4r"
      borderWidth="1px"
      borderColor="gray.300"
      borderRadius="lg"
    >
      <Span color="gray.600">Eyebrow</Span>
      <Span fontWeight="600">Title</Span>
    </Div>
  )
}
\`\`\`

### Content

<Div display="grid" gap="2r">
  <H2 margin="0">Primitives work well for prose and UI</H2>
  <P margin="0" color="gray.700">
    Use semantic tags for the structure you already want. Style props are there to support the element, not replace it.
  </P>
  <A href="#" color="blue.600" textDecoration="underline">
    This is still just a link
  </A>
</Div>

\`\`\`tsx
import { A, H2, P } from '@reference-ui/react'

<H2>Primitives work well for prose and UI</H2>
<P color="gray.700">
  Use semantic tags for the structure you already want.
</P>
<A href="/docs" color="blue.600">
  Read the docs
</A>
\`\`\`

## When to use primitives vs \`css()\`

- Use primitives when you are rendering a specific HTML element and want to style it inline with JSX props.
- Use \`css()\` when you want to compose styles once and apply them in multiple places.
- Use recipes when you are defining a reusable component with variants and a stronger contract.

## Good defaults

<Ul display="grid" gap="1r" paddingLeft="5r">
  <Li>Prefer semantic elements first.</Li>
  <Li>Reach for style props before introducing wrappers.</Li>
  <Li>Extract to \`css()\` or recipes when repetition starts to show up.</Li>
  <Li>Keep primitives boring; they should feel like HTML with superpowers.</Li>
</Ul>

## A note on coverage

Reference UI supports a broad set of HTML primitives, but the docs do not need to list every single tag to be useful. The important part is the model: if you know how to use \`Div\`, \`P\`, \`A\`, and friends, you already understand the rest.

## Quick reference

\`\`\`tsx
import { Div, P, A } from '@reference-ui/react'

<Div padding="4r" backgroundColor="gray.50">
  <P color="gray.800">Hello world</P>
  <A href="/more" color="blue.600">Learn more</A>
</Div>
\`\`\`
`

fs.writeFileSync(outPath, content, 'utf8')
console.log('✅ Generated', outPath)
console.log('📝 Wrote concise primitives overview')
