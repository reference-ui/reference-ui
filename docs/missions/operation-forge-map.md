# Operation Forge — Map v1 (READY synthesis, 2026-09-19)

Source of truth for shape: [operation-forge.md](/Users/ryn/Developer/reference-ui/docs/missions/operation-forge.md).
Evidence dir: `packages/reference-neo/docs/evidence/`.

## READY verdict: GO

All 7 READY-phase asks are answered with line-cited evidence; no file is
missing or empty. Applying the mission Blocker rule
(`operation-forge.md:1206-1210` — blocker = one-namer/one-map impossible
for harvest, or the module graph unable to answer an existing atomic
station identically outside pre-listed coincidence-folds, or zero
styletrace host drift impossible; everything else is a slice note):

- Harvest one-namer/one-map: possible (ask 6 PASS; ask 2 sizes sinks in
  the thousands, explicitly a sink-filter note per the ask).
- Module graph answering stations identically: yes, with one pre-listed
  ladder gap (SITE-31 `xwidth` capture, ask 3) that Slice 3 must fix in
  the crate — not a coincidence-fold to accept, and not a blocker.
- Styletrace host drift: zero drift required at Slice 3 adoption; no
  evidence contradicts it.
- The `bare.rs:48/64` rename (tree no longer recompiles, ask 4) is a
  tree-state unblock-first note for Slice 3, not a mission verdict
  blocker per the rule.

## Per-ask summaries

1. **§1 repro** — Confirmed: nested-import spread drops `color` with zero
   diagnostics at `record_spread`'s identifier arm
   (`value.rs:206-214`, gate `:184-195`, import `init: None`
   `collect.rs:724`); fix must be demand-driven, not a reordered pass
   (no bag holds the datum; cycles defeat ordering).
   Evidence: [forge-ready-01](/Users/ryn/Developer/reference-ui/packages/reference-neo/docs/evidence/forge-ready-01-s1-repro.md)
2. **Harvest size** — ~1.8k gross wants on the lib Book: pool 518
   alphabet literals × 10 kind-compatible sinks (color 299×1, length
   169×9); variants stay in the thousands. Slice-4 sink-filter note.
   Evidence: [forge-ready-02](/Users/ryn/Developer/reference-ui/packages/reference-neo/docs/evidence/forge-ready-02-harvest-size.md)
3. **Bag-fallback scratch** — Disabling import bag fallback changes
   exactly one station: ATM-SITE-31 (`xwidth(4)` refuses, +1 diagnostic;
   sheet/map byte-identical). Ladder gap (graph-backed helper captures),
   not a coincidence-fold. SITE-39/55/77/28 stay green.
   Evidence: [forge-ready-03](/Users/ryn/Developer/reference-ui/packages/reference-neo/docs/evidence/forge-ready-03-bag-fallback.md)
4. **Ladder divergence** — Three ladders disagree on 6 of 8 probes; only
   the alias row threatens a pinned station today (SITE-54 keeps atomic
   semantics). Rows 4/4b/6/7/8 additive. Table is the shared crate's
   first test plan. Tree-state note: `bare.rs:48/64` rename must be
   healed before Slice 3 can verify.
   Evidence: [forge-ready-04](/Users/ryn/Developer/reference-ui/packages/reference-neo/docs/evidence/forge-ready-04-ladder-divergence.md)
5. **`export *` in the wild** — 6 star edges on live style-import paths
   (2 matrix stations pin semantics: ATM-SITE-55, styletrace
   export-star cases); css-value path itself is star-free (control).
   Slice 3 must fan out value + type edges and enumerate entry-side
   members.
   Evidence: [forge-ready-05](/Users/ryn/Developer/reference-ui/packages/reference-neo/docs/evidence/forge-ready-05-export-star.md)
6. **Runtime proof** — PASS: dynamic `css({ color })` paints `red` from a
   hand-added atom with `'red'` only in an array, zero runtime edits;
   unharvested twins paint nothing with one dev diagnostic each.
   Pre-station for NEO-CSS-14.
   Evidence: [forge-ready-06](/Users/ryn/Developer/reference-ui/packages/reference-neo/docs/evidence/forge-ready-06-runtime-proof.md)
7. **Naming** — 15 of 16 confirmed as-is; `Origin` collides with the
   site-name string and ships as `BindingOrigin`. Soft notes: scope
   harvest type as `harvest::Sink`, retire `ProjectGraph` on `ValueGraph`
   adoption.
   Evidence: [forge-ready-07](/Users/ryn/Developer/reference-ui/packages/reference-neo/docs/evidence/forge-ready-07-naming.md)

## Slice table 0–6

| # | Slice | Files | Stations | Owner | Status |
|---|---|---|---|---|---|
| 0 | Paperwork + census by code (sign §2/§8, strike S13, close §7, doom-protocol §8 → Slice 3, neo printer surfaces `ATM-W-*`) | ledger, `doom-agent-protocol.md`, neo sync printer | — | agent-neo (printer), docs | LANDED (oracle clean: neo sync 16/16) |
| 1 | Resolver quick wins + alphabet tables (canon `css/values/`, §9 fence, §10 longhands, §11 no cross-category + `UNKNOWN-COLOR`, §4 null arm) | `canon/src/css/values/` (`named_colors.rs`, `functions.rs`, `lengths.rs`, `classify.rs`), atomic resolver fence + null arm | `ATM-TOKEN-14/15/16`, `ATM-SITE-82` | agent-rs | LANDED (oracle clean: canon 52/52, atomic 328/328, stations 213/213) |
| 2 | Scope collect (split over-cap files first per D1; §13 member-path inits + member spreads; §5 post-attach init fold; §12 `BagSemantics`) | `scope/collect.rs`, `expressions/object.rs`, `expressions/walk.rs` (split, behavior-neutral) | `ATM-SITE-80/81/83` | agent-rs | LANDED (oracle clean: atomic 328/328, stations 216/216) |
| 3 | Module graph (new crate; atomic `ValueGraph` adoption; styletrace ladder adoption; §1 fold; §3 precision; §8 cross-file clause) | `modules/module-graph/` (`fs.rs`, `key.rs`, `ladder/`, `record.rs`, `graph.rs`, `walk.rs`, `tests/`); atomic `extract/resolver/` → thin `ValueGraph`; styletrace `resolver/path.rs` | crate tests; `ATM-SITE-78/79/84`; `NEO-SITE-29` | agent-rs (crate + atomic), styletrace | LANDED (fix oracle clean: D1 tsconfig-policy knob + styletrace Skip, D2 cycle-Err never memoizes + SITE-78 inner arm, D3 ledger quotes §8 verbatim; neo: SYNC-15 fixed, 4 fence repins, 2 color-mix out-of-cone — notes S3-12/S3-13) |
| 4 | Harvest (`extract/harvest/`, sinks, mint, info code, §2 floor) | `atomic/src/extract/harvest/` (`literals.rs`, `sinks.rs`, `mint.rs`, `classify.rs` rhythm-then-canon) | `ATM-HARVEST-01..04`; `NEO-CSS-14` | agent-rs + agent-neo | pending, after 1 + 3 |
| 5 | Host surface (`StyleSurface.owned_props`, host-aware `is_style_attr_name`; census → 131) | styletrace `analysis/surface.rs`, atomic host check | styletrace unit; `ATM-SITE-85`; census log | agent-rs (styletrace + atomic) | pending, after 1 |
| 6 | Tasty adoption (optional, never gates) | tasty `scanner/packages/*`, `ast/resolve` → ladder + walk | tasty goldens | agent-rs | optional, after 3 |

Station IDs are suggested; each slice owner confirms free slots against
`atomic/SPEC.md` and the neo group specs.

## Subsystem boundaries

- **Alphabet + harvest** (`operation-forge.md` Part IV-A): canon owns
  `css/values/` (`named_colors.rs`, `functions.rs`, `lengths.rs`,
  `classify.rs` + `prop_accepts`); atomic owns
  `extract/harvest/` (`literals.rs` → `HarvestPool`, `sinks.rs` →
  `Sink{prop,when,kind}`, `mint.rs` → same wants vector, one namer) and
  the rhythm recognizer; runtime unchanged (neo `css()` keys by authored
  string). Boundary: canon never sees atoms; harvest never consults
  tokens for alphabet values (§9 fence).
- **Module graph** (`operation-forge.md` Part IV-B): shared crate
  `module_graph` owns ladder + record + origin walk only
  (`fs.rs`, `key.rs`, `ladder/`, `record.rs`, `graph.rs`, `walk.rs`).
  Does NOT own: values, types, JSX hosts, ASTs, diagnostic wording.
  Atomic keeps values (bags, `ResolvedExport`, `PureFn`); tasty keeps
  type IR; styletrace keeps the JSX host tracer. Consumers parse once
  and hand `&Program`; no slice reaches into another's files except
  through the shared crate's API.

## Open slice notes

- S3-1: `value_of(BindingOrigin)` demand-driven fold + residue-marker
  diagnose floor (asks 1, 3); pre-stationed `ATM-SITE-78`/`NEO-SITE-29`.
- S3-2: Graph-backed helper captures (`helpers.ts::xwidth` ←
  `unit.ts::xunit`) so SITE-31 keeps folding (ask 3).
- S3-3: Keep atomic's alias + exact-exports arms (SITE-54); adopt tasty's
  types/main/`@types`/star-walk wins and styletrace's `.js` remap; crate
  test plan = ask-4 table rows 1–9 (ask 4).
- S3-4: Heal the `bare.rs:48` vs `:64` rename first — tree does not
  recompile; Slice 3 cannot verify until it builds (ask 4).
- S3-5: Star fan-out for value (rows 1,3,4,5) and type (row 2) edges +
  entry-side member enumeration; star-free css-value path is the control
  (ask 5). Keep SITE-55 fence: stars never carry `default` (ask 4).
- S3-6: Ship `BindingOrigin` (not `Origin`); retire `ProjectGraph` on
  `ValueGraph` adoption; keep harvest type at `harvest::Sink` (ask 7).
- S4-1: Sink filter keeps harvest in the thousands (kind gate + §14
  owned-props drop of `gap`/`offset`); publish must fan atoms to both
  `styled/` and `react/` copies (asks 2, 6).
- S4-2: `ATM-HARVEST-04` zero-harvest control: static program sheet
  byte-identical before/after Slice 4.
- S0-1 (landed): ledger signs §2/§8, strikes S13, closes §7;
  doom-protocol §8 routes to Slice 3; sync printer prints stable
  `ATM-W-*` codes (`NativeDiagnostic.code`) so censuses count by
  `rg -c`. Oracle: neo `sync.test.ts` 16/16.
- S1-1 (landed): `TokenCategoryMismatch` retired (kept for wire
  stability, never emitted); TOKEN-09 repinned to zero diagnostics;
  RS-KNOWN-RED-001 closed by §11 silence (`token10.test.ts`); SEAM-03
  sheet churn is intended (named colors now CSS-first: literal
  `lime`/`teal`, not `var()`).
- S1-2 (carried gap, not a defect): `parser.rs` `is_length_width` is
  not yet a canon consumer (file outside Slice-1 allowlist);
  `lengths.rs` was seeded from it. A later slice may re-point it.
- S1-3 (pre-existing, out of slice cone): 8 typegen golden failures
  (formatter/semicolon + vendor-prefix drift) fail on this tree but
  touch no slice file — canon's data surface changed only
  additively, and no typegen file is in the diff.
- S2-1 (landed): D1 splits done — `collect.rs` (838 lines) →
  `scope/collect/` (6 files), `object.rs` (842) → `expressions/object/`
  (8 files), `walk.rs` (710) → `expressions/walk/` (6 files); new
  `scope/call_init.rs` (§5 post-attach fold); `BagSemantics` plumbed
  via `jsx/mod.rs` (`JsxAttributes` on spread bags) + `extract/mod.rs`
  (`StyleObject` default). Stations `ATM-SITE-80/81/83` registered in
  `SPEC.md`, READMEs follow the claim/symbols/siblings/search-terms
  convention. Oracle: atomic 328/328, stations 216/216.
- S2-2 (repins, both §5 folds not coincidences): SITE-31 39-F3 now
  folds (color wants 22→23, wants 51→52, diagnostics 14→13);
  SITE-46 shadowed arrow folds as pure (`animationName: local`,
  wants 13→14, plans 12→13, diagnostics 7→6).
- S2-3 (pre-existing, out of slice cone): clippy warnings remaining
  in atomic live in `resolver/walk.rs`, `constants/collect.rs`,
  `fold/*`, `scope/init.rs`, `scope/types.rs` — none in a Slice 2
  file; no new lints introduced.
- S3-7 (DEFECT D1, blocking — B8 zero-drift violated): NEO-SYNC-15
  red on this tree, caused by the styletrace ladder adoption. The
  shared ladder runs the tsconfig arm before `node_modules`;
  `packages/reference-neo/tsconfig.json` maps `@reference-ui/react`
  to a repo-level authoring alias, so a world bare import resolves
  to `packages/reference-neo/src/primitives/generate/react-surface.d.ts`
  instead of the world's `node_modules` symlink
  (`.../world/src/../node_modules/@reference-ui/react/react.d.mts`,
  what tasty returned — tasty has no tsconfig arm). The tracer then
  traces against the wrong surface and `local`/`merged` come back
  empty. Probed live (ladder vs `tasty::resolve_external_import_path`
  on the SYNC-15 world; scratch test created, run, and removed same
  session). Fix shape (in-cone, small): give the ladder a tsconfig
  policy knob and have styletrace skip (or scope) tsconfig — worlds
  are self-contained via symlinked `node_modules` — then re-gauge B8
  on SYNC-15 plus the lib tree. Atomic keeps tsconfig (SITE-54).
- S3-8 (DEFECT D2 — fail-closed over-refusal, no station):
  `atomic/src/extract/resolver/mod.rs:186` caches every `value_of`
  outcome including `ValueCycle` Errs, so a later direct use of an
  inner origin replays a stale cycle refusal after its file refined.
  Reproduced live (`/tmp/forge-oracle-cycle-cache.mjs`: `z='red'`
  direct use warns `ATM-W-DYNAMIC-IDENTIFIER`; only `padding:1px`
  wants). Fix shape: do not cache cycle Errs (or cache only
  completed refinements); add a station arm (cycle + later direct
  use of the inner origin). SITE-78's cycle arm covers the cyclic
  edge only.
- S3-9 (DEFECT D3 — paperwork, fix at land):
  `overmatch-ledger.md:394-412` condenses the §8 sentence and omits
  the mission's cross-file clause verbatim ("a same-named write in
  another file never blocks an import that resolves to an unmutated
  export"; exact phrase absent from the ledger, verified by grep).
  Slice 3 owns signing the clause; behavior is delivered (SITE-84
  green, `lookup.rs:8` quotes it) but the ledger must quote it.
- S3-10 (synthesis: verified green, 2026-09-19): crate 98/98
  (`MemoryFs`-only, B1 clean — `std::fs` only in `fs.rs`);
  `ProjectGraph` retired (zero hits); `BindingOrigin` shipped;
  one parse for the value pipeline (`lib.rs:109-116`); imports never
  consult the bag (`lookup.rs` Import arms + origin-only `mutation`);
  SITE-31 `xwidth` fold preserved inside atomic vitest 266/266 (219
  cases incl. 78/79/84, all `SPEC.md`-registered with
  claim/symbols/siblings/search-terms READMEs); styletrace suites
  29 + 28/28 with the tasty call removed and the sync-root remap
  kept; NEO-SITE-29 PASS (paints red); S3-4 healed (old `bare.rs`
  gone with the resolver collapse); all new files under caps (max
  361 lines); `q` 0 errors, 21 warnings all pre-existing complexity
  in semantically-untouched functions (sampled: lifetime-churn-only,
  rustfmt-only, adjacent-hunk).
- S3-11 (synthesis: carried edges, verified): identity keeps its lazy
  on-demand parse (`identity.rs:45,148-164`, untouched subsystem) —
  one-parse covers the value pipeline; `exported_names` is crate-side
  only (crate + its tests) while styletrace keeps its own
  `export_all_sources` walk (ladder adopted, walk not — row 6
  enumeration stays where it was); type-only exports skipped
  (`record/collect.rs:104`); member spreads resolve table-locally
  only (`spreads.rs:291-292`, documented); main-file intermediate
  import spreads keep today behavior (suite-green, no dedicated
  probe). Neo reds triaged, all 7 reproduced: 4 Slice-1-fence
  (STATIC-01/SITE-20/24/26 — world tokens `gold`/`plum` vs CSS
  keywords; `resolve/` + neo src zero-diff, HQ decision) + 2
  resolve-side color-mix (GLOBAL-12/PARITY-02, out of cone) + D1.
- S3-12 (fix synthesis, LANDED 2026-09-19 — all verified from the
  tree in-session): D1 closed — ladder ships `TsconfigPolicy`
  (`module-graph/src/ladder/mod.rs:29-40`, default `Skip`);
  styletrace resolves bare imports via `node_modules` only
  (`styletrace/src/resolver/path.rs:19-28` explicit `Skip`,
  `analysis/module_resolution.rs:46` default-`Skip`), atomic keeps
  tsconfig (`atomic/.../resolver/mod.rs:161-163` `Follow`, SITE-54
  arm); `ladder_tsconfig.rs:143-196` pins the SYNC-15 shape (alias
  vs world-local `node_modules`) and the Skip default. D2 closed —
  `value_of` never memoizes `ValueCycle` Errs
  (`resolver/mod.rs:171-188`); Rust arm
  `resolver/tests.rs:89-113` (`inner_origin_refused_mid_cycle_…`)
  plus SITE-78's `zest`/`chartreuse` inner-use arm (`spec.ts:22-27`,
  8 wants, 1 diagnostic) pin cycle + later direct use. D3 closed —
  ledger `overmatch-ledger.md:400-412` quotes the §8 sentence
  verbatim against `operation-forge.md:647-655` (line-compared).
  In-session oracles: module_graph 100/100 (98 + 2 tsconfig-knob
  pins), atomic 315/315 (314 + D2 arm), styletrace 29/29 unit;
  `ProjectGraph` zero hits in code; B1 clean (`std::fs` only in
  `fs.rs`); new-file max 364 lines (`resolver/mod.rs`). Browser
  suites (atomic/styletrace vitest, neo incl. SYNC-15 re-gauge and
  NEO-SITE-29) per the fix oracle ref, not re-run here.
- S3-13 (neo disposition at land): SYNC-15 fixed by the Skip policy
  (world self-contained via symlinked `node_modules`; authoring
  alias in `reference-neo/tsconfig.json` no longer wins for
  styletrace); 4 Slice-1-fence reds repinned in-tree as intended
  §9/H1 CSS-over-token precedence (NEO-SITE-20/24/26,
  NEO-STATIC-01 READMEs + specs, "Repin (Forge Slice 3)");
  GLOBAL-12/PARITY-02 resolve-side color-mix stay red out of cone
  (unchanged from S3-11); NEO-SITE-29 PASS carried (paints red).
- S3-14 (captain triage, corrects S3-13): GLOBAL-12/PARITY-02 are NOT
  out of cone — both worlds author `color-mix(...)` containing
  `{colors.…}` token refs, and the Slice-1 §9 fence passes the whole
  value through with no dictionary lookup, so the braces emit raw
  (`{colors.ink}` in the sheet instead of `var(--colors-ink)`).
  A value containing token refs is not a complete CSS value, so the
  fence must not fire there. Slice-1 fixup follows Slice 3's commit;
  Slice 3's own scope (R-B, 78/79/84, NEO-SITE-29, B8) is green.
- S1-4 (Slice-1 §9 fixup for S3-14, in working tree 2026-09-19 —
  verified from the tree, parent commits): the fence no longer fires
  on values carrying `{…}` refs — `classify_css_value` refuses any
  brace (`canon/.../values/classify.rs:112-114`,
  `has_token_braces :163-165`) before all tables, so
  `resolve_token_value` falls through to brace interpolation
  (`atomic/.../resolve/tokens/mod.rs:91-102` → `var()`s) instead of
  raw passthrough (`:38-40`). Rhythm cannot bypass
  (`resolve/rhythm/mod.rs:43` needs an `r`-suffix numeric;
  `color-mix(…)` ends `)`). Unit pins cover the exact triaged
  strings (`classify.rs:283-297`, incl. GLOBAL-12 `theme.ts:12` /
  `:15-16` and PARITY-02 `theme.ts:105` verbatim);
  `ATM-TOKEN-14` gains a two-ref `color-mix` arm (`App.tsx:12`)
  asserting `var(--colors-gray-800)` / `var(--colors-red-500)`
  expansion (`spec.ts:23-25`) with complete-CSS silence intact
  (single `ui.missing.path` diagnostic pin, `:26-32`) and goldens
  repinned (`styles.css` accent-color, `css.json`,
  `baseSystem.json` red.500). The `globalCss` path shares the
  fence (`stylesheet/global/value.rs:161`), so the GLOBAL-12 /
  PARITY-02 mixes fix identically. In-session oracles: canon
  53/53 (classify 5/5), atomic `resolve::tokens` 29/29, atomic
  vitest stations 219/219. Neo GLOBAL-12/PARITY-02 browser
  re-gauge (sheet `var()`s per `colormix.spec.ts:33-35` /
  `:43-45` + paint twins) per the fix oracle ref, not re-run
  here. Captain closed the gap firsthand 2026-09-19: GLOBAL-12 PASS,
  PARITY-02 PASS (F22 prints; `red/abc` UNKNOWN-COLOR stands — the
  world names it `slashInvalid`, deliberate invalid input, §11-true).
