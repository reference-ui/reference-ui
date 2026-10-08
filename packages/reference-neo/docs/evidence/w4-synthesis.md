# W4 synthesis — parity cartography merged disposition (captain, 2026-09-17)

Inputs: `w4-oracle-a-panda.md` (Panda v1 atomic), `w4-oracle-b-matrix.md`
(matrix non-CHAIN), `w4-oracle-c-lib.md` (lib census). Doctrine: D21 —
in-dialect micro-gaps are proven by PARITY-01 probes in the mini-lib
world, not new group rows; blocked items cite RS rows; out-of-dialect
items become SPEC absence lines. The group catalog closed at G3.

## 1. Merged disposition table

`(b)` = census known-unproven w/ RS cite · `(c)` = absence-union line ·
`(P#)` = PARITY-01 probe in the mini-lib world · `(R1)` = parity-cook probe first.

| ID | Behavior | Disposition |
| --- | --- | --- |
| A-B1 | Parent combinators (COND-05/10) | (b) cite RS-12; world: no parent keys |
| A-B2 | Mixed `@supports` (COND-15) | (b) cite RS-15; world: no `@supports` keys |
| A-B3 | `& ~ &` (GLOBAL-06) | (b) cite RS-11 |
| A-B4 | Ternary/const/spread (SITE-01/02/03) | (b) cite RS-14; world: inline every style object literally |
| A-B5 | Keyframe token refs (TOKEN-13) | (b) cite RS-16; world: hand-written `var(--…)` in keyframes |
| A-B6 | COND-14/RECIPE-07/SITE-13/SITE-14 | (b) cite RS-17/RS-18/RS-19/RS-5; world: no `_file`, bool-attr macros, hostless worlds |
| A-F1 | `red/abc` invalid slash | (R1) probe engine behavior → row-or-absence |
| A-F2 | `red/0.33` decimal quirk | (c) token/SPEC.md, D7 Panda bug |
| A-F3 | `/half` opacity tokens | (c) token/SPEC.md, no opacity category |
| A-F4 | Recipe first-child+responsive | (P13) probe |
| A-F5 | `textGradient` clip | (P14) probe (Canon ships it; R1 inside) |
| A-F6 | Array `css` prop | (P15) probe |
| A-F7 | Scoped reset | (c) layer/SPEC.md, no lib author; LAYER-04 covers the flag |
| A-F8 | Spacing-union negatives | (P16) type-level probe with P7 tsc harness |
| A-F9 | Semantic dark color-mix | (P17) probe |
| A-F10 | Vendor hyphenation | (P18) probe (passthrough expected) |
| A-OOD | 5 out-of-dialect-unlisted (bp-conditioned values, nested `osDark:highCon`, forced-colors islands, `token()` nested fallbacks, percent cssVar) | (c) token/SPEC.md, 5 lines |
| B-G1 | Portaled dark island | (P1) probe; record `data-panda-theme` divergence (PARITY-04) |
| B-G2 | `& + &` / `& ~ &` | `+`: (R1) → RS-20 or (P2); `~`: (b) cite RS-11 |
| B-G3 | `:where([data-variant])` sheet shape | (P3) probe (DOM proven by PRIM-06; sheet shape unproven) |
| B-G4 | Radius pair shorthands | (P4) probe |
| B-G5 | Container×viewport mixing | (b) cite RS-15 (= A-B2 root) |
| B-G6 | Inline-style `var()` consumption | (P6) probe |
| B-G7 | `PrimitiveVariantRegistry` augmentation | (P7) probe, tsc harness |
| B-G8 | Multi-entry `fontFace` arrays | (P8) probe |
| B-G9 | Viewport-height branches | (P9) probe |
| B-G10 | Container names | (P10) probe |
| B-G11 | Attr+hover composition | (P11) probe |
| B-G12 | display/overflow/letter-spacing breadth | (P12) probe |
| B-G13 | strictTokens | (c) cite D17 (type-level, never proven) |
| C-F/T | 43-row family table (F1–F37 + T-A–T-F) | Census rows; cartographer adds TESTS cites to C's SPEC cites |
| C-DELTA-1 | forced-colors / `(hover:hover)` MQs | (c) cond/SPEC.md (`@supports` cites RS-15) |
| C-DELTA-2 | Zero-count pseudos | (c) cond/SPEC.md |
| C-DELTA-3 | `size-adjust` extras | Covered: cite GLOBAL-08 (done, RS-2). No escalation. |
| C-DELTA-4 | Boolean leaks + dotted passthroughs | (c) parity-list D7 extension (captain auto-§3; pure defects) |
| C-DELTA-5 | `_file` (3 lib uses) | Covered: cite COND-14 / RS-17 (blocked). No escalation. |

Corrections to oracle C: DELTA-3/5 searched SPEC.md only and missed
TESTS/RS coverage (GLOBAL-08 green; COND-14 blocked-on-RS-17). Both
human-escalation flags stand down; the parity list cites the rows.

## 2. PARITY-01 probe roster (18)

P1 portal island · P2 `+` sibling (pending R1) · P3 where-variants ·
P4 radius pairs · P6 style-attr var · P7 augmentation (tsc) ·
P8 font array · P9 height query · P10 container name · P11 attr+hover ·
P12 breadth props · P13 recipe first-child+responsive · P14 textGradient ·
P15 array css prop · P16 spacing negatives (tsc) · P17 dark mix ·
P18 vendor hyphenation. (P5 skipped: B's mixed-query probe cites RS-15.)

## 3. Mini-lib authoring constraints (world MUST hold)

Inline every style object literally; no ternaries/const/spread in
extraction positions; no parent-combinator or `@supports` keys; no
`& ~ &`; keyframes hand-written `var(--…)`; no `_file`/bool-macros;
no F1-style slashes, scoped reset, or undispositioned F-items.
Tags per oracle C §4 (button/input+bezel/file-or-range/disclosure/
table/link+q, + progress/meter if cheap); small `staticCss` map for F29
cardinality; `data-color-mode` flip only, never `data-panda-theme`.

## 4. Phase 2 orders

**2a cartographer** (docs-only, first): write `tests/cases/parity/SPEC.md`
+ `TESTS.md` from PLAN §8.15 + this synthesis; append (c) absence lines
to cond/token/layer SPECs; compute the absence-union table (G4 needs
census list == union exactly); report row counts.
**2b parity cooks** (after 2a): R1 tasks (`& + &`, `red/abc`) →
RS-20/21 or probes; build the mini-lib world + PARITY-01..04 cases
with per-probe assertions; run the three merge gates.
