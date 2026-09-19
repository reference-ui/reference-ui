import { css } from '@reference-ui/react'

declare const maybe: { foo: string } | undefined

// Optional chain on an unresolvable base warns and extracts nothing;
// the static sibling still extracts (v2 `optional_chaining.rs:58`).
export const a = css({ color: maybe?.foo, padding: '4px' })
