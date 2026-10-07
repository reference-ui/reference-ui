# LOG — font-weight-runtime-1008

STATUS: COMPLETE

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

## 2026-10-08 — Arc 2 + Arc 3 landed; objective met

- Arc 2 crew `ses_ee751444dffekO16P5mf0lwE6r`. Captain verified: runtime css
  77/77; `agentneo run NEO-NAMER-02` PASS; `agentneo q` 0 errors.
  Committed **`69f0491d4`** (css.test.ts strengthenings ARC1-1..3 + NEO-NAMER-02
  seam).
- Arc 3 crew `ses_ee747ca5fffe9BHXByufKGNeER`. Neo bin already current; one-shot
  `ref sync` was covered by the live watch (no kill); the live
  `.reference-ui/react/react.mjs` was byte-identical to a fresh regen from the
  current bin and carries the scope pass. F2 bullet rewritten in
  `system/fonts.mdx`. `agentdocs q` 0 errors. Committed **`ead4ce648`**.
- **Captain live proof on :5174 (computed `font-weight`):**
  - `/typography` ramp: thin **200** (was 100), light 300, normal 400, semibold
    600, bold 700, black 900.
  - `/fonts`: normal·sans **400**, normal·serif **373** (was 400), normal·mono
    **393** (was 400), thin·sans **200** (was 100), thin·no-family **100**.
- Parallel session re-baselined pins against `977593fc6` (`34ebcf959`) — no
  conflict; their packaging work untouched.
- Mission COMPLETE. No open tasks. Third Oracle review not warranted per
  PLAN.oracle (Arc 2 corpus + Arc 3 computed-style proof; gates sufficed).

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

## 2026-10-08 — Arc 3 crew (docs bundle proof + F2 dynamic bullet)

- **Bin rebuild (no-op, fresh):** `node ../reference-neo/tools/ensure-dist.mjs`
  from `packages/reference-docs` → exit 0, no rebuild. `dist/bin/ref.js`
  (00:30:43) is newer than every src input, and `dist/src/runtime/css/{css,scope}.js`
  carry the pass. Parallel session's dirty packager files untouched.
- **Docs bundle:** one-shot `ref sync` from `packages/reference-docs` →
  `[ref] sync covered by watch session pid 55052`; the live watch resynced on
  the SIGUSR2 poke (CPU 2.92s→3.09s, RSS +10 MB), but bytes were identical, so
  the staged commit preserved `react.mjs` mtime (Oct 8 **00:18:20**, by design:
  `sync/commit.ts` keeps mtime for identical bytes). Live watch/lock untouched.
- **Independent proof:** a fresh `ref sync` into a temp copy of the project via
  the current `dist/bin/ref.js` produced a `react.mjs` **byte-identical** to the
  live bundle (`diff -q` → IDENTICAL), containing the six-keyword gate,
  `[\p{L}\p{N}_-]` family regex, `.includes(".")` guard, `` `${t}.${e}` `` rewrite,
  and the `prop!=="weight"||typeof t.value!="string")continue` invocation. Arc 1
  already ships in the live bundle.
- **F2 bullet rewritten** (`fonts.mdx`): "Dynamic values are scoped at runtime —
  if the class is shipped" — runtime scopes string values (literal or
  variable-held); the static authored-plan path keeps bare/keyword semantics; a
  dynamic value needs its class sheet-backed (`staticCss` or a coincidental
  static call site) or it is a miss; kept the scoped `sans.thin` advice.
- **Gate:** `pnpm agentdocs q` → **0 errors, 0 warnings, 35 files**.
- Files: only `packages/reference-docs/src/content/docs/system/fonts.mdx`. Not
  committed. Evidence for the captain's live computed-style assertion.


