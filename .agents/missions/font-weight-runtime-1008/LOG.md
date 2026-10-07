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

