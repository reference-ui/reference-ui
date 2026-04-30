1. Granular / Smart Strict Tokens (strictTokens: 'loose' or 'recommended')

Automatically allows all common non-token CSS values without forcing [] escape hatches:
inherit, unset, initial, none, auto
transparent
100%, 0, 0px, fit-content, min-content, max-content
Common keywords (block, flex, none, absolute, etc.)

Still strictly enforces tokens for design decisions (colors, spacing, sizes, etc.)
Optional fully strict mode + user-configurable extra allowed values

2. First-Class Style Fragments & Composition

css() works as a powerful static fragment collector by default (no need for .raw())
Clean, deep merging with full support for nested conditions:TypeScriptconst base = css({ translate: 'auto', size: 'size', _checked: { translateX: 'size' } })
const variant = css(base, { sizing: '5', _rtl: { translateX: '-size' } })
Strong Rust-powered AST analysis → reliable deep merging, no duplicate CSS, excellent type safety even with strictTokens
Designed as the lightweight composition layer under recipes