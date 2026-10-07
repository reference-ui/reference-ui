# LOG — font-weight-runtime-1008

STATUS: IN PROGRESS

## 2026-10-08 — mission opened (captain)

- Conn taken. Objective named (single): runtime family-relative `weight`.
- Recon done at HEAD `1bdcfd05a`:
  - `muse` CLI present; `muse-spark-1.3-contributor` resolves at effort `max`.
  - Root cause confirmed: Rust static resolver fixed (`resolve/font/scope.rs`),
    TS runtime resolver (`reference-neo/src/runtime/css/css.ts` +
    `reference-rs/modules/atomic/js/namer/lower.ts`) still family-blind.
  - Live dev server :5174 reproduces: ramp 100/300/400/600/700/900;
    serif/mono normal → 400; sans thin → 100.
- Files written: BRIEF.md, LOG.md, briefs/PLAN.oracle.md.
- Next: dispatch `oracle` carrier for PLAN.oracle review.

## 2026-10-08 — PLAN.oracle returned

- Carrier `ses_ee7635782ffeeyYRMDL9u29GRo` → `STATUS: DONE`.
- Report: `reports/PLAN.oracle.md`. Verdict: **findings** — site right, decomposition corrected.
- Rulings that change the plan:
  - **F1 (P1):** scope per **`css()` call**, not per style object. Primitive splits
    siblings across args (`css(styleProps, cssProp)`), so rewrite the full
    `queries` array after all collection, before `name()`, grouped by `when`.
  - **F2 (P2):** at runtime a variable string is indistinguishable from a literal —
    scope it. No provenance threading (out of scope). Arc 3 updates the
    `fonts.mdx` dynamic bullet.
  - **F3 (P3):** scope **string queries only**; responsive object weights diverge —
    pin interim behavior, file leaf-descent follow-up.
  - **F4/F7 (P3/P4):** no second family-blind site; `lower.ts` stays unchanged,
    no contract/rulesVersion bump. Arc 2 reduces to the NAMER seam test.
  - **F5/F6 (P2):** extend `css.test.ts` TABLES so lowering is observable; gate the
    rewrite on a ported six-keyword constant, not `tables.weightKeywords`.
  - **F10 (P3):** docs proof = computed style (Playwright), not CSS grep.
- Next: dispatch Arc 1 crew (runtime scoping + tests).

## 2026-10-08 — Arc 1 crew + ARC1.review landed

- Crew `ses_ee75d51f0ffeeeKbaXW7OU30G6` implemented Arc 1. Captain verified
  firsthand: `vitest run src/runtime/css` → 76/76, `agentneo q` 0 errors.
- Committed **`977593fc6`** (scope.ts, scope.test.ts, css.ts, css.test.ts, mission
  notes). Other session's B3-depth files (`packager/react.ts`,
  `react.test.ts`, `NEO-SYNC-02/.../inventory.spec.ts`) left untouched/uncommitted.
- ARC1.review carrier `ses_ee75816d3ffeqcFJfQcvG5mucj` → `STATUS: DONE`.
  Verdict: **findings, slice may merge.** No product defect; port, wire-in, F1–F7
  compliance verified against the static oracle. Next tasks:
  - **ARC1-1 (P2):** base-fallback integration case vacuous (`sans.normal`==400==keyword);
    use a discriminating pair (`serif.normal`→373 / `sans.thin`→200 under `_hover`).
  - **ARC1-2 (P3):** conflict case can't tell decline from last-wins; add
    `serif`+`mono`+`normal` → 400.
  - **ARC1-3 (P3):** interim pins 1 of 4 responsive shapes (arrays, object+object,
    font-object); pin or defer to Arc 2 KNOWN-DIVERGENT.
  - Arc 2 seam must pin runtime==static; Arc 3 must rebuild docs bundle (fix ships
    in `react.mjs`, not CSS) and assert computed styles + no miss diagnostics.
- Next: Arc 2 crew (strengthen ARC1-1..3 + seam test) and Arc 3 (docs proof).

## 2026-10-08 — Arc 1 landed (crew)

- New `packages/reference-neo/src/runtime/css/scope.ts`: 1:1 port of `scope.rs`
  `apply_to_wants` semantics (family props `font`/`fontFamily`, alnum/`-`/`_`
  family keys, hardcoded six-keyword gate, same-`when` win / base fallback /
  conflict decline). Operates on `NamerRequest[]`.
- Wired in `css.ts`: `applyFamilyScope(queries)` after all `collectStyle`
  calls, before the naming loop — per call, cross-arg (F1). String queries
  only (F3); `lower.ts` untouched, no rulesVersion bump (F7/F4).
- Tests: `scope.test.ts` ports the eight runtime-applicable `scope.rs` cases
  plus object/numeric skip and family-key guards (global-block case 8 has no
  runtime analog — F9 — so it is not ported). `css.test.ts` TABLES extended
  (font/weight macro lowerings, font-family/font-weight prefixes, three-family
  fonts table, six weightKeywords) with twelve `css() family scoping`
  integration cases: objective, cross-arg, serif/mono, lone keyword, important,
  base fallback, same-group win, explicit passthrough, numeric/unknown,
  conflict, dynamic string, responsive interim pin.
- Proof: `vitest run src/runtime/css` → 5 files, **76 passed**; gate
  `pnpm agentneo q` → **0 errors**, 26 warnings (both new warnings are
  `css.test.ts` over the 365-line / 80-line *warn* lines, non-failing).
- Not committed; captain commits.

## 2026-10-08 — Arc 2 crew (strengthen ARC1-1..3 + runtime↔static seam)

- **ARC1-1:** `css.test.ts` conditional-fallback case now asserts discriminating
  pairs (`serif`+`_hover.normal` → 373, `sans`+`_hover.thin` → 200) instead of
  the keyword-equal `sans.normal`/400 that passed pre-fix.
- **ARC1-2:** conflict case now `serif`+`mono`+`normal` → **400** (decline),
  where first-wins=373 / last-wins=393 are both caught.
- **ARC1-3:** added a KNOWN-DIVERGENT pin for the three remaining F3 shapes —
  weight array, object+object, and font-object + string-weight — each with the
  `// follow-up:` leaf-descent note. (c) pins `letterSpacing` too (font macro).
- **Seam (`NEO-NAMER-02`):** world gains serif/mono/display scales (mirroring
  `reference-lib` fonts.ts) and literal bare-weight call sites for all six
  keywords × three families, lone keywords, a conflict, two conditionals, the
  dynamic boundary, and the F3 shapes. Spec pins runtime DOM classes against the
  static `ATM-COND-05` pins, asserts computed `font-weight` 200/373/393 is
  sheet-backed, and asserts the dynamic `250` rule stays bare. Loop-generated
  call sites had to be unrolled to literals: the static extractor folds no loop
  variables, so the sheet was silently missing rules.
- Findings pinned: a scale miss (`mono.black`) passes the scoped name through
  **raw** on both sides (`font-weight_mono.black`), not the CSS keyword.
- Proof: `pnpm agentneo run NEO-NAMER-02` → PASS; `vitest run src/runtime/css`
  → 77 passed; `pnpm agentneo q` → **0 errors**, 26 warnings.
- Files: `src/runtime/css/css.test.ts`, `tests/cases/namer/NEO-NAMER-02/{README.md,
  specs/corpus.spec.ts, world/index.html, world/src/app.ts, world/src/fonts.ts}`.
  No `scope.ts`/`css.ts`/`lower.ts` edits. Not committed.


