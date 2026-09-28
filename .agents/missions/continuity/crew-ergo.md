# OPERATION CONTINUITY-01 — Crew ERGO report

HQ ergonomics follow-up delivered: the `--spacing-root` overwrite knob is
plain `globalCss({ ':root': { '--spacing-root': '<value>' } })`, declared
canonical in prose and pinned by a paint-through case. No new API surface;
no commits (captain commits).

## 0. Choice + justification

**Chosen: bless plain `globalCss({':root': …})` as THE path (candidate 3).
No new surface.** Evidence, read firsthand:

- The path already exists and is already the ecosystem's own: lib sets
  its root via `globalCss({ ':root': rootThemeVars })`
  (`packages/reference-lib/src/core/theme/global.ts`), the Neo `globalCss`
  JSDoc already used `--spacing-root` in its example, and TOKEN-07 /
  CHAIN-07 worlds author roots through `globalCss` fragments.
- **Rejected: `spacing.root` theme value (candidate 1).** It would mint a
  magic token name printing `--spacing-root` from `@layer tokens` — which
  ranks *above* `@layer global` (preamble: `reset, global, base, tokens,
  recipes, utilities`; TOKEN-07 sheet confirms token vars print in
  `tokens`). A token-knob would therefore silently outrank the author's
  own `globalCss` `:root`: two knobs fighting, with the undiscoverable
  one winning. Wrong layer, wrong precedence, duplicate truth.
- **Rejected: `ui.config.ts` key (candidate 2).** `ReferenceUIConfig`
  (`src/config/types.ts`) carries zero styling keys, and a new key would
  need type + validate + frozen-wire-spec plumbing (`reference-rs/
  contracts`) + emitter mapping + extends-merge precedence — the largest
  surface of the three for a value that is already one line of CSS.

Minimalism and discoverability both point the same way: the knob is CSS
the author already writes, documented where the author already looks.

## 1. Diff summary

- `src/collect/surface/globalCss.ts` (comment-only): JSDoc now declares
  the knob canonical — what rhythm lowers against, the `0.25rem` baked
  default, why any author `:root` wins — and the example flips from
  restating the default to a `0.5rem` rescale with a knob comment.
- NEW case `tests/cases/token/NEO-TOKEN-15/` (7 authored files): world
  theme sets the documented one-liner at `0.5rem`; `4r`/`1r` probes;
  `specs/rescale.spec.ts` pins override-wins through the path.
- `tests/cases/token/TESTS.md`: ledger row for NEO-TOKEN-15.
- No `docs/DOMAIN.md` update: no new names minted.

Docs home note: no user-facing rhythm doc exists to extend — the
`matrix/spacing` pointer in `resolve/rhythm/README.md` is dead (no such
dir), and neo README / DOMAIN / TESTING / playground are rhythm-silent.
The fragment therefore lives in the two most-discoverable existing
surfaces: the `globalCss` JSDoc (where authors look) and the TOKEN-15
README (example-led: default, why, one-liner; indexed by `agent:cases`).
OS-level concerns untouched per the order.

## 2. Pins (NEO-TOKEN-15, single sheet — complements CHAIN-07's chain)

- Sheet still opens with the baked `ROOT_DEFAULT` (author outranks,
  never replaces); exactly 2 `--spacing-root:` definitions; author
  `0.5rem` rides the own package `@layer global` (bounded above by
  utilities — empty base/tokens/recipes layers are omitted, found
  during the run).
- Formulas present: `padding: calc(4 * var(--spacing-root))`,
  `padding: var(--spacing-root)` (calc + bare-var lowerings).
- Computed `--spacing-root` on `<html>` is `0.5rem`; `4r` paints
  `32px` and `1r` paints `8px`, each equal to an inline reference.

## 3. Suites + results

| Suite | Result |
|---|---|
| `agentneo run NEO-TOKEN-15` | PASS (after one spec fix: tokens-layer bound → utilities; re-run green) |
| `agentneo run NEO-TOKEN-07` (rhythm neighbor) | PASS |
| `agentneo q` (9 authored files) | 0 errors, 0 warnings (after adding the required header to `ui.config.ts`) |

`run` typechecks the package first, so the JSDoc touch is type-covered.
No `agentrs` surface touched (comment-only TS + new case), so no RS
suites apply. Tree: only my 2 edits + 7 new authored files are mine
(`git add -n` verified; generated `.reference-ui`/`dist`/artifacts are
ignored); the doom-x/objective/DECISIONS churn in the tree is other
crews', untouched.

## 4. Finding (out of scope, for captain/HQ)

By the RS-41 kebab-every-segment rule, an innocent-looking
`tokens({ spacing: { root: … } })` would mint `--spacing-root` from the
`tokens` layer and silently rescale all rhythm while outranking the
author's own `globalCss` `:root`. This crew changed nothing there (HQ
ordered minimal knob + docs), but a reservation or diagnostic for the
`spacing.root` token name is a natural hardening follow-up.
