# CSS group — value grammar and the `css()` runtime

The CSS group proves that style values written the way lib authors write
them — tokens, rhythm, arbitrary functions, `!important` spellings,
condition-free value edge cases — compile to the right declarations and
paint through the runtime `css()` over compiled plans. Conditions,
breakpoints, merging, and recipes belong to COND, RESP, MERGE, and RECIPE;
this group owns the leaf: one property, one value, one class.

## Dialect

Authors write `css()` props with these value forms: token paths and
`{category.path}` refs inside composite strings, rhythm (`4r`, `3.5r`,
`1/2r`, negatives), unitless numbers, arbitrary functions (`rgba()`,
`color-mix()`, `calc()`, gradients), `null`/`false`/`undefined` holes that
must vanish, `!`/`!important` suffixes, authored custom properties, and the
`size`/`font`/`weight` macros that expand to several declarations. Shorthand
aliases (`w`, `px`, `bg`) last-win over longhands per slot.

## Engine stations

All stations below exist under
`packages/reference-rs/modules/atomic/tests/cases/` (READMEs read
2026-09-17); no RS-lane slice is needed for this group.

| Row | Station | What it pins |
| --- | --- | --- |
| CSS-03 | ATM-MERGE-01/02, ATM-SHORT-01/06 | Last-wins per slot; shorthand/longhand both emit, longhand prints last |
| CSS-04 | ATM-UNIT-01/02 | Unit policy per property; numeric canonicalisation |
| CSS-05 | ATM-LEAF-03, ATM-GHOST-02 | Holes omitted, no dead class; runtime keys are authored spellings |
| CSS-06 | ATM-TOKEN-08 | `{ref}` segments expand inside composite values |
| CSS-07 | ATM-NAME-*, ATM-LEAF-* | Arbitrary values are one class each; escaping allowlist |
| CSS-08 | ATM-LEAF-09/10 | Every `!` spelling marks important; bangs in quoted strings do not |
| CSS-09 | ATM-NAME-01..07 | Class grammar: prefixes, condition colons, escapes, hex-escapes |
| CSS-10 | ATM-COND-05/16 | `size`/`font`/`weight`/`container` macro expansion |
| CSS-11 | ATM-NAME-* | Custom-property casing preserved |
| CSS-12 | ATM-RHYTHM-01..05 | `1r`, decimals, fractions, embedded, negative rhythm |

## Decisions that apply

D7 (Panda bugs are not parity): `.size_md { width: md }`,
`.bdr_none { border-radius: none }`, `.ls_tight { letter-spacing: tight }`
are compiler failures, never cases. D11: a runtime value with no compiled
atom yields no class plus one diagnostic, never a ghost class (CSS-05 leans
on it; MERGE-06 proves the diagnostic). D15: `token()` is out.

## Approved absences

| Absent | Reason |
| --- | --- |
| `hideFrom` / `hideBelow` | Panda helper utilities (`atomic-rule.test.ts:671`); no lib author uses them and no `[dir]`/show-hide grammar exists in the sheet. An author needing one writes a plain condition. |
| Custom utilities with shared class names | Panda `custom-utility.test.ts` lets two shorthands share one class; Reference has no custom-utility registry, so there is nothing to share. |
| `@scope` | Panda `stringify.test.ts` rewrites `&` under `@scope`; the dialect never emits `@scope` and the lib sheet has none. |
| `token()` string helper | D15. Neither core nor lib exports it; `{path}` refs are the only ref spelling (TOKEN-01/12, CSS-06). |
| Capital-W vendor keys (`Webkit*`) | Panda `hypenate-property` maps `WebkitBoxOrient` to the dashless non-property browsers drop; Neo drops them at compile instead (zero diagnostics either way). Author the lowercase-w spelling, which passes through hyphenated (P18). No lib/matrix author uses capital-W. |
| Numerics lower to px | Panda numeric→token lowering is not dialect: `mx: -2`→`-2px`, `padding: 4`→`4px`, recipe `'4'`→`4px` (S1 probes A1/A3/I1). Unitless and custom props stay bare (A2). |
| No autoprefixer | Vendor properties print exactly as authored (C2 lowercase-w hyphenates, H10 `user-select` stays unprefixed); Panda's prefixed expectations are not parity. |

## Out of scope (Panda, not Reference's dialect)

| Panda feature | Reason |
| --- | --- |
| `prefix` + hash class names, custom `toHash` | Config hooks; Neo class grammar is proven by CSS-07/09 without copying them. |
| Encoder `fromJSON` wire format | Panda's `color]___[value:red` hashes; Neo uses the frozen `EvaluatedSystemSpec`. |
| Boolean `truncate` utility (`false` → empty CSS) | Panda-specific boolean utility; no lib equivalent. |
| `textStyle` / `animationStyle` compositions layer | No `textStyles` keys in lib src; no `@layer compositions` in the sheet. |
| `divideX`/`divideY` sibling selectors | Pattern pack output; out unless Reference ships gap utilities. |
| Template-literal ``css`…` `` | Not in the authoring surface. |
