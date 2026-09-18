# S1 sweep §4 — follow-up dispositions (S4 reconstruction)

Recovered 2026-09-17 from `/tmp/s1-sweep/b{1,2,3,4}.mjs` after the §3/§4
tail truncated. All four probes re-ran green: b1/b3/b4 byte-identical to
`.out`; b2 identical except J3 (keyframe `{ref}`/`4r` now resolve in
`dist` — RS-16 landed after the `.out` capture; that `.out` block is stale).
N1/N2/N3 already filed as RS-26/27/28 — not repeated here.

## 1. SPEC dispositions — 7 one-liners (exact file + wording)

Append each line to the named SPEC's Approved-absences list:

1. N4 → `tests/cases/css/SPEC.md` — "Panda numeric→token lowering is not
   dialect: numerics lower to px, not token refs (`mx: -2`→`-2px`,
   `padding: 4`→`4px`, recipe `'4'`→`4px`; A1/A3/I1). Unitless and custom
   props stay bare (A2)." Hypothesis CONFIRMED.
2. N8 → `tests/cases/site/SPEC.md` — "Element-access reads (`map['k']`,
   `map[key]`, computed map keys) refuse with a `Dynamic non-literal
   expression` diagnostic (O1/O2/O3); member access is the only
   indirection (SITE-02)."
3. N9 → `tests/cases/site/SPEC.md` — "Computed keys in style objects and
   template-literal values refuse with diagnostics (O4 `Dynamic computed
   property key…`, O8 `Dynamic non-literal template expression…`)."
4. N10 → `tests/cases/token/SPEC.md` — "Leading-zero numeric spellings
   (`margin: '025'`) warn (`Non-canonical numeric value`) and emit
   nothing (N8)."
5. N11 → `tests/cases/token/SPEC.md` — "Missed flat-nested token paths
   (`black.10`) warn (`unknown token path`) and pass the value through
   (N9)."
6. N13-family → `tests/cases/token/SPEC.md` — "Malformed-slash diagnostic
   wording varies by shape (`unknown token path` vs `malformed opacity
   modifier`; B2/B2b/B5) — passthrough is the pinned behavior, not the
   text."
7. N15 → `tests/cases/css/SPEC.md` — "No autoprefixer: vendor properties
   print exactly as authored (C2 lowercase-w hyphenates, H10
   `user-select` stays unprefixed); Panda's prefixed expectations are
   not parity."

## 2. Trivial fold-ins — 5 (exact file + note wording)

Append each note to the named row's evidence cell; no new rows:

1. N5 → `tests/cases/resp/TESTS.md` NEO-RESP-05 — "smOnly≡smToMd:
   identical `@container (min-width: 640px) and (max-width: 767.98px)`
   (K3)."
2. N6 → `tests/cases/css/TESTS.md` NEO-CSS-08 — "StyleProp bang
   (`color=\"red!\"`→`red !important`, K1; token control K2 unaffected)
   rides the CSS-08 claim."
3. N7 → `tests/cases/site/TESTS.md` NEO-SITE-01 — "JSX const/runtime
   ternaries and whole-object ternaries compile both arms (N1/N2/N7);
   SITE-01 claim covers."
4. Single `& ~ &`/`& + &` → `tests/cases/global/TESTS.md` NEO-GLOBAL-06 —
   "Single-selector forms lower directly (`p ~ p`, `p + p`; E1/F4/H11)
   beside the comma `:is()` form; css() twins G3/G4."
5. Bare-descendant/`:not()` corners → `tests/cases/global/TESTS.md`
   NEO-GLOBAL-03 — "Bare (F1), `&`-descendant (F2), `&:not()` (F3),
   hover-nest (H8), class-append (H10) verified; css() bare parents
   (G1/G2) fold to COND-05."

## 3. N12 — ruling request for the N3 (RS-28) liaison

Unknown-key policy differs by path: `css({ fooBar: 'x' })` drops the key
silently with zero diagnostics (N6; O6/O7 `divideX/Y`/`divideColor` same),
while `globalCss` prints unknown keys hyphenated (H7 `divideX`→
`divide-x: 40px`, zero diagnostics). Requested ruling: when RS-28 teaches
globalCss key classification, should unknown keys drop-with-diagnostic
(css() policy) or keep hyphenated passthrough? Either way, pin it in
`tests/cases/global/SPEC.md` dialect + one PARITY-01 sub-probe.

## 4. Probe overhang (elsewhere §4-held, probe-supported)

- H4/H5 nested-`@supports` (top-level and in-selector) prints correctly —
  fold note to `tests/cases/global/TESTS.md` NEO-GLOBAL-07 evidence.
- K4 string negatives mirror N4 (`'-4'`→`-4px`, `'-1r'`→calc,
  `'-sm'` passthrough) — covered by disposition 1, no separate line.
- C3 `msFoo`/`MozFoo` drop silently in css() like capital-W — the
  existing css-SPEC capital-W row already covers the policy.
- N3/N4/N5 dynamic spreads warn (`Dynamic object spread…`) and keep
  siblings — confirms the SITE-SPEC dialect line for spreads too.
- Exec-summary item 8 (RS-16/LAYER-09 pointer) already relabeled by the
  captain; the J3 rerun drift above independently confirms RS-16 landed.
