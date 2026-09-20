# Reaper READY ask 5 — model check: Method recipe rebuilt against the current tree

Date: 2026-09-20. Author: Reaper Phase R1 crew (read-only; the rebuild script is
disposable `/tmp` scratch — the Method recipe in the mission file is the record).
Mission: `docs/missions/operation-reaper.md` READY ask 5.

## Verdict: REPRODUCED EXACTLY. 20/20 cells byte-identical. ~70 B/class at rest HOLDS. No table fix needed.

A fresh Node script written from the Method bullets — sinks parsed from the current
Rust sources (never typed in), pools from the deterministic generators, current class
prefixes, current escaper — reproduces every number:

| Id | Classes | CSS raw | gzip-6 | brotli-11 | B/class |
|---|---|---:|---:|---:|---:|
| M300 | 22,468 OK | 1,561,214 OK | 165,455 OK | 89,987 OK | 69.49 |
| M500 | 33,806 OK | 2,395,791 OK | 249,341 OK | 130,121 OK | 70.87 |
| M500₃ | 101,418 OK | 8,404,381 OK | 766,325 OK | 395,155 OK | 82.87 |
| M500₄ | 135,224 OK | 12,693,287 OK | 1,034,734 OK | 537,976 OK | 93.87 |
| M500₇ | 236,642 OK | 23,531,645 OK | 1,826,247 OK | 931,391 OK | 99.44 |

Table sizes re-verified from the tree: canon 1,073 (`Property::new` count),
color 71, length 52, url 6 (`transform` + 1), auto 133, none 124 — all as the mission
states. Closed-form class counts re-derive exactly.

## Four ambiguities the recipe underdetermines (the table pins each)

A faithful rebuilder hits four readings the recipe text does not settle; exactly one
reading reproduces the table, confirmed by running the variants:

1. `rgba()` spaceless (`rgba(0,3,7,0.0)`) — the spaced reading overshoots M300 raw by
   +14,058. The recipe's commas are formatting, not literal.
2. 0-based `url()` / `translateX()` indices (`a0…`, `translateX(0px)`) — 1-based
   overshoots M500 raw by +14.
3. `focus-visible` kebab segment under `_focusVisible` — the camelCase reading undershoots
   M500₄ raw by −33,806 (exactly the `when`-block's classes; same for M500₇).
4. Short `:is(:disabled, [data-disabled])` wrap — the tree's long wrap overshoots M500₇
   raw by +1,149,404.

Suggested Slice-4-style recipe gloss (one word: "spaceless `rgba(r,g,b,a)`", plus the
index base): recorded here, **not applied** — the R1 contract limits mission-file edits
to the line-1 signal, and the table stands as written. The mission's "if the recipe and
the table disagree, the table is wrong" clause does not trigger: under the pinned
readings they agree to the byte.

## Tree-vs-model deltas (counterfactual rows only — planning-immune)

Two pinned readings differ from what the compiler actually emits, both confined to the
`when`-variant rows the mission keeps "so nobody plans around them":

- The compiler's `_focusVisible` segment is camelCase `focusVisible`
  (`atom/when.rs::from_catalog`: authored minus `_`, no kebab); the model uses
  `focus-visible`. Same-stem-length coincidence does not hold (13 vs 12 chars).
- The compiler's `_disabled` wrap is the long
  `:is(:disabled, [disabled], [data-disabled], [aria-disabled=true])` (`PRESETS`,
  `pseudoprops/mod.rs:24-27`); the model uses the short "likewise" form.

If Slice 1 ever sets a real conditioned compile beside M500₄/M500₇, expect −33,806 raw
per affected `when` from the segment spelling and +1.15 MB on the disabled block from
the wrap. The rest rows (the planning rows) are unaffected.

## The class string does not change under Jettison — with numbers

1. **242,953 raw / 32,046 gzip**: `packages/reference-lib/.reference-ui/styled/styles.css`
   on THIS checkout, byte-identical to the pre-cutover baseline (mission §1 table,
   `jettison-00-baseline.md`). The sheet survived the cutover to the byte.
2. `sanitize_class_value` moved (`stylesheet/name/escape.rs` → `resolve/lexical.rs:192`)
   with the identical three-character mapping (`' ' | '\t' | '\n'` → `_`); the escaper
   allowlist/hex rules are unchanged. The model above runs the current escaper and
   reproduces the planning numbers exactly.
