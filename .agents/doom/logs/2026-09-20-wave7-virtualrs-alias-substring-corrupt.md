---
date: 2026-09-20
cycle: wave7
module: virtualrs/css-cva/alias-rename
theories_spent: 1
verdict: break-found
---

# Alias rename rewrites member calls and prefixed identifiers

## Hypothesis

Gap pursued (Theory 1, spent — banked gap (a) from the wave6
virtualrs report): `utils.rs::normalize_bound_calls` builds a bare
substring regex (`escape(local) + "\\("`, no boundary guard) and
runs it over the whole rewritten file after the import splice.
Red test: with `import { cva as buttonCva }`, the bound call
`buttonCva(` must normalize to `cva(`, while `obj.buttonCva(`
(member of another object) and `xbuttonCva(` (unrelated longer
identifier) must survive byte-identical.

Research (free, unspent): read `utils.rs`, `cva.rs`, `css.rs`
(same `apply_rewrite` path, so the css-alias arm shares the
defect), `replace_function_name.rs` (sibling API), VRT-CVA-01 /
VRT-CSS-02 / VRT-FN-03 fixtures, and the doom log. Untried gap
banked for scheduling, no theory spent: (b) responsive
`normalize_breakpoint_width` accepts any `f64` parse (`NaN`,
`inf`, `-5`, `1e3`) and emits it verbatim into
`@container (min-width: …px)`.

Thin-log signal: "member", "alias", "substring" searches return no
prior hunt on this gap; only the wave6 dual-binding report (which
banked it) and unrelated hits.

## Verdict

`break-found`. User-facing: the compiler silently retargets live
code with no diagnostic.

Repro: `/tmp/doom-wave7-virtualrs-t1-alias-substring.mjs`
(blind-runnable `node`, exit 1, loads
`dist/native/virtual-native.darwin-x64.node` directly via the
`rewriteCvaImports` export; run firsthand 2026-09-20).

Input:

```tsx
import { cva as buttonCva } from '@reference-ui/react'
const a = buttonCva({})
const b = obj.buttonCva({})
const c = xbuttonCva({})
```

Output (actual):

```tsx
import { cva } from 'src/system/css';

const a = cva({})
const b = obj.cva({})
const c = xcva({})
```

`obj.buttonCva` (a property of `obj`, a different binding
entirely) is retargeted to `obj.cva`, and the unrelated
identifier `xbuttonCva` is corrupted to `xcva` (dangling or
wrong binding at runtime). Note a `\b` guard alone would not
save the member case (`.` to `b` is a word boundary) — the
rename needs callee-awareness, like the sibling
`replaceFunctionName` API already has.

Violated contract:

- `modules/virtualrs/README.md`, CVA Transformation: "rewriting
  both the import declarations and the call sites" — only the
  bound identifier's call sites are the transform's business;
  member expressions and longer identifiers are not its call
  sites.
- VRT-FN-03 pin (`theme.css(...)` member-unchanged for
  `replaceFunctionName`): the engine's own stated rule is that
  member calls are not rewritable as standalone calls —
  violated on the css/cva alias path.
- Compiler self-consistency: a rename must never touch text
  outside the renamed binding. This one corrupts two disjoint
  shapes (member + prefixed) in one pass.

Physics check: in bounds. Named import in a TSX compile input,
complete static literals, no interpolation, no runtime-shaped
data — nothing on the will-never-work floor. Misdiagnosis
clause unneeded: there is no diagnostic at all, just silent
corruption.

Severity: user-facing break (silent semantic rewrite). The css
arm (`rewriteCssImports` with an alias) shares `apply_rewrite`
→ same defect, unprobed firsthand, noted for the fortify crew.
