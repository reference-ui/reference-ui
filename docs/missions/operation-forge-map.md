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
| 0 | Paperwork + census by code (sign §2/§8, strike S13, close §7, doom-protocol §8 → Slice 3, neo printer surfaces `ATM-W-*`) | ledger, `doom-agent-protocol.md`, neo sync printer | — | agent-neo (printer), docs | pending |
| 1 | Resolver quick wins + alphabet tables (canon `css/values/`, §9 fence, §10 longhands, §11 no cross-category + `UNKNOWN-COLOR`, §4 null arm) | `canon/src/css/values/` (`named_colors.rs`, `functions.rs`, `lengths.rs`, `classify.rs`), atomic resolver fence + null arm | `ATM-TOKEN-14/15/16`, `ATM-SITE-82` | agent-rs | pending |
| 2 | Scope collect (split over-cap files first per D1; §13 member-path inits + member spreads; §5 post-attach init fold; §12 `BagSemantics`) | `scope/collect.rs`, `expressions/object.rs`, `expressions/walk.rs` (split, behavior-neutral) | `ATM-SITE-80/81/83` | agent-rs | pending, after 1 |
| 3 | Module graph (new crate; atomic `ValueGraph` adoption; styletrace ladder adoption; §1 fold; §3 precision; §8 cross-file clause) | `modules/module-graph/` (`fs.rs`, `key.rs`, `ladder/`, `record.rs`, `graph.rs`, `walk.rs`, `tests/`); atomic `extract/resolver/` → thin `ValueGraph`; styletrace `resolver/path.rs` | crate tests; `ATM-SITE-78/79/84`; `NEO-SITE-29` | agent-rs (crate + atomic), styletrace | pending, after 2 |
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
