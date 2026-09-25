---
date: 2026-09-24
cycle: night-g1-frag
module: neo/system/streams (extends sheet merge)
theories_spent: 1
verdict: break-found
---

# Extends `@layer` statement emits raw names the blocks escape

## Hypothesis

Gap pursued: the extends sheet merge (`mergeStreams`,
`packages/reference-neo/src/system/base/streams.ts:145-171`) prints the
`@layer a, b;` ordering statement from raw system names
(`collectEntryNames`, line 159) while every package block is printed
through the CSS-identifier escape (`wrapPackageLayer` → `escapeSelector`,
the engine `escape_css_selector` port). The escape tests pin only the
no-upstream path (`mergeStreams([], SCOPED_ENTRY, …)`), where no statement
is emitted — the statement path with special-char names is unpinned
anywhere (unit tests, goldens, corpus).

The red test (`/tmp/doom-g1-frag-red.mjs`, blind-runnable via repo tsx,
drives the real `mergeStreams`, writes nothing) merges one upstream plus
own and asserts the statement names the same layers the blocks define:

- scoped upstream `@scope/pkg` (legal: `validateName` bans only `"` and
  newlines, message promises "safe for CSS @layer"; the escape test uses
  this exact name): statement `@layer @scope/pkg, app;` vs block
  `@layer \@scope\/pkg {` — the statement is syntactically invalid CSS
  (unescaped at-sign in the prelude; parsers drop the rule) and names a
  layer no block defines.
- comma upstream `a,b` (legal per the same validator): statement
  `@layer a,b, app;` declares three layers while the blocks define two
  (`a\,b`, `app`) — the real layer sorts after the app instead of before
  it, i.e. wrong cascade order, not just invalid bytes.

Today both assertions fail (exit 1); the sheet heads are printed by the
repro. The call site is live sync (`sync/index.ts:192`, `extends` ∪
`layers` feed the merge; `merged.stylesheet` is the served styles.css),
so any extends chain containing a scoped/digit-leading name ships the
invalid line — e.g. an org base `@acme/ds` extended by an app.

Research that came back clean (not spent): recipe `variant_class` /
`compound_class` / combination-key / `compound_matches` ports match the
engine byte-for-byte; `!important`/`!` suffix splitting matches
(`literal.rs`, `const_values.rs`); responsive-leaf-`!` falls back
non-important exactly as ATM-LEAF-11 pins; hoisted
`responsiveBreakpoints` plumbing (artifact boundary →
`registerRecipeData` → derivation) is complete; `getRhythm` matches
engine `get_rhythm` including negatives; upstream/local bundle order and
index alignment hold; font-weight-over-tokens merge order is pinned
deliberate; `_private` extends ground already filed (wave6); tonight's
diagnostic/reexport/scan failures (r1–r3) untouched.

## Verdict

`break-found`. Repro: `/tmp/doom-g1-frag-red.mjs` (run:
`packages/reference-neo/node_modules/.bin/tsx /tmp/doom-g1-frag-red.mjs`
from the repo root; exits 1 on the red assertions, writes nothing to the
tree, tree verified pristine via `git ls-files --others`).

Violated contract:

- `config/validate.ts` `validateName`: names are promised "safe for CSS
  @layer" with only `"`/newline rejected — the merge emits `@layer`-
  unsafe statements for accepted names.
- The module's own escape machinery (`escapeSelector`, `wrapPackageLayer`)
  plus the pinned escape tests: escaping is owed for exactly these names;
  the statement path was missed.
- Served-output validity: `styles.css` must be valid CSS; the scoped case
  emits an invalid at-rule, the comma case a false layer declaration that
  reorders the cascade.

Severity: minor. Scoped/digit names (the realistic inputs) yield invalid
CSS bytes whose rule parsers drop while block order preserves paint, so
typical impact is validator/devtools noise; comma names (contrived) flip
cascade order. Fix direction (finder does not fix): escape names in
`collectEntryNames` with the existing `escapeSelector`.
