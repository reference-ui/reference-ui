# REPORT: swarm-visitrec — extract visit-dispatch audit (repro2 T7)

## Verdict

**CUT (exact per-site dispatch census × criterion units: fantasy SUM 2.10 ms
< 8 ms bar at 3.8× margin and < 5 ms per-phase floor at 2.4× margin; even
vaporizing every dispatch probe, origin/binding String, and scope push/pop
— walks-side and fenced ground untouched — cannot approach either bar.
The visit_call ≈46–48 wt frame is ~96% walks; the dispatch slice was always
~2 ms, confirming the extract crew's survey with exact counts)**

One line: 11,875 visit_call dispatches (8,875 ident + 3,000 member, ×3
byte-identical runs) carry 31,437 dispatch-slice allocs and ~70k probes —
priced at measured units to 1.29 + 0.63 + 0.18 (bounded) = 2.10 ms fantasy;
the only revival (visit-less traversal) needs a skip predicate that costs ≥
the walk it skips or needs shot2-barred pre-scan signals — CUT twice over,
no build.

## Base / binaries

- Base commit: `ddce131e7ab9a627500b5caa3d24bce81204dfe4` (verified `git rev-parse
  HEAD` first act and after revert; post cloneplasma-LAND tip).
- Census `.node` sha256: `307d2d3238fb8f13ddbfcc9554161e2d4a4d564d8a7ca3b7fb97704995fca3d9`
  (counts only, never timed; release build, 18 pre-existing warnings, zero new —
  warning list audited: private-interfaces + unused imports/fns, none from census).
- Census instrumentation: env-gated (`SWARM_VISITREC_OUT`) atomic counters
  (7 files: new `extract/visitrec.rs` with 60 counters + hooks in
  `extract/mod.rs`, `extract/bindings.rs`, `extract/css/mod.rs`,
  `extract/recipes/selection.rs`, `extract/scope/lookup.rs`, dump at `compile`
  end in `lib.rs`) — **fully reverted** (`git checkout` + new files removed;
  tree == HEAD, verified below).
- Raw dumps: `/tmp/swarm-visitrec-count{1,2,3}.json` (`diff` clean ×2) + run
  envelopes `/tmp/swarm-visitrec-run{1,2,3}.json`; census binary saved aside at
  `/tmp/swarm-visitrec-census.node` (sha above); count script
  `/tmp/swarm-visitrec-count.sh`; unit bench (temp, reverted) + estimates under
  `dist/cargo/criterion/` (gitignored build output, not in tree).
- Bench lock: one held block (install + census build + 3 count runs + 15-unit
  criterion bench), two-step release (`rm -f owner && rmdir`, dir gone);
  no foreign PIDs touched.

## Dispatch slice (what is in, what is out)

Per `visit_call_expression`, the dispatch slice is the triple
`css_origin` + `recipe_origin` + `selection::resolve_target` (probes and
hit-allocs), plus per-declarator binding/shadow strings, per-tagged-template
dispatch, and scope push/pop. Everything beneath — `handle_css_arg` arg walks,
`walk_style_object`, `push_want`/`line_col`, `observe_call`, recipe walks —
is walks-side and EXCLUDED (T1 lineindex / T2 pushstring / realloc ground).

Boundary proof (static, this base):
- `css_origin` callers: `css::extract` (per call), `extract_tagged_template`
  (per tagged) — both counted. `recipe_origin` callers: `recipes::extract`
  (per call), `resolve_iife` (per IIFE callee) — both counted.
- `ScopeChain::resolve` dispatch callers: `resolve_ident`, `resolve_member`
  (counted with an exact depth twin); the 9 walks-side `Scoped::*` callers in
  `scope/lookup.rs` are uncounted — dispatch separated from walk work.
- `is_shadowed` dispatch callers (4: `live_css_name`, `live_recipe_name`,
  `css_member_origin`, `recipe_member_origin`) use exact counted twins (depth +
  contains); walks-side callers (`allows_jsx_tag`, selection leaves) and all
  `diagnostics/analysis/*` callers (analysisb LIVE ground) are uncounted.
- `diagnostics/analysis/css.rs` has its own `visit_call_expression`
  (analysisb ground) — untouched and uncounted here.

## Exact dispatch census (enterprise, seed 7, 3/3 byte-identical)

`dumps: 1` (single compile per sync confirmed). Count-run bundle bytes
pin-exact ×3 (css 2,867,925 / data 214,466, cssCalls 7527) → counters
behavior-neutral. (Count-run syncMs 1350.5/966.5/976.8 untimed, for the record.)

| site | count | bytes | note |
| --- | --- | --- | --- |
| `v_call` (visit_call_expression) | 11,875 | — | 8,875 ident + 3,000 member + 0 other |
| `v_jsx` / `v_tagged` | 0 / 0 | — | JSX + tagged dispatch vacuous on this load |
| `v_declarator` / ident | 8,873 / 8,873 | 48,632 | all-ident; 5.48 B mean |
| `v_enter_scope` | 6,122 | — | push+pop each |
| shadow inserts (param/decl) | 3,000 / 8,873 | 15,000 / 48,632 | 5.00 / 5.48 B mean |
| css ident: hit / miss | 7,527 / 1,348 | 22,581 | 3.00 B = `css`; internal 0, shadowed 0 |
| css member: noobj / hits | 3,000 / 0 | 0 | ALL member callees have non-identifier objects |
| recipe ident: hit / miss | 440 / 8,435 | 2,640 | 6.00 B = `recipe`; internal 0, shadowed 0 |
| recipe member: noobj / hits | 3,000 / 0 | 0 | same 3,000 member calls, zero allocs |
| shadow probes: depth / contains | 17,308 / 17,308 | — | per side (css+recipe); mean depth 1.95; zero short-circuits |
| selection: ident/member/computed/iife/other | 8,875/3,000/0/0/0 | — | sums to v_call exactly |
| `chain.resolve` (selection): calls/depth | 8,875 / 17,308 | — | mean 1.95 levels; member arm never reaches resolve |
| resolve outcomes: local/import/unbound | 0 / 8,875 / 0 | — | all-Import; local scan NEVER runs (scanned 0) |
| selection import hits (ident/member) | 908 / 0 | 24,374 | 2 allocs/hit, 26.8 B; iife/class/binding 0 |
| selection tentative pushes | 908 | 78,536 | file 86.5 B (bench-tmpdir prefix artifact) |
| css sites: calls / args | 7,527 / 7,527 | — | exactly 1 arg per css call |

Internal cross-checks (all exact): v_call = 8875+3000+0;
css_ident = 7527+1348; r_ident = 440+8435; sel arms sum to v_call;
sel_resolve = sel_ident (member returns pre-resolve); import outcomes 8875 =
7527 css + 440 recipe + 908 selection (Reference-package filter split);
css_site_calls = css_ident_hit; shadow contains = depth (0 shadowed).

## Unit microbench (criterion, censused shapes, 100 samples each)

Temporary `benches/visitrec.rs` (reverted). Release, this box:

| unit | mean | prices |
| --- | --- | --- |
| `alloc_drop_3/6/27/86` | 22.88 / 23.59 / 22.67 / 22.73 ns | String alloc+drop, memcpy inside |
| `fx_shadow_miss_empty/2` | 0.43 / 2.03 ns | shadow-set contains |
| `fx_css_hit_1/miss_1` | 3.65 / 1.84 ns | css/recipe-set contains |
| `btree_hit_8/miss_8/miss_2` | 18.89 / 2.39 / 3.49 ns | scope-table level probes |
| `internal_cmp_miss` | 0.37 ns | `__reference_ui_*` compares |
| `refpkg_check_miss` | 0.43 ns | `is_reference_package` |
| `scope_push_pop` | 50.35 ns | UPPER (fresh-vec-loaded; real ≈ 5 ns amortized) |
| `shadow_insert_5` | 70.53 ns | UPPER (fresh-set-loaded; real ≈ 31 ns amortized) |

## Fantasy math + bar ruling (the losing math)

100% capture: every dispatch term → zero (impossible — any diet keeps the
hit-allocs' payload bytes and the probe structure; the two UPPER units alone
overstate by ~0.75 ms, disclosed, verdict-safe direction).

| term | math | ms |
| --- | --- | --- |
| css origins | 7,527 × 22.88 | 0.172 |
| recipe origins | 440 × 23.59 | 0.010 |
| selection import targets | 1,816 × 22.67 (27B upper) | 0.041 |
| selection push file | 908 × 22.73 | 0.021 |
| declarator bindings | 8,873 × 23.59 (6B upper) | 0.209 |
| shadow inserts | 11,873 × 70.53 (fresh-set UPPER) | 0.837 |
| shadow contains | 34,616 × 2.03 (2-elem UPPER) | 0.070 |
| css/recipe-set contains | 7,527×3.65 + 1,348×1.84 + 440×3.65 + 8,435×1.84 | 0.047 |
| internal compares | 17,750 × 0.37 | 0.007 |
| BTree levels | 8,875×18.89 (hit-8 UPPER) + 8,433×3.49 | 0.197 |
| refpkg checks | 8,875 × 0.43 | 0.004 |
| scope push/pop | 6,122 × 50.35 (fresh-vec UPPER) | 0.308 |
| visitor_context (bound) | 11,875 × ≤10 | 0.119 |
| member matches (bound) | 9,000 × ≤2 | 0.018 |
| css arg match+unwrap (bound) | 7,527 × ≤5 | 0.038 |
| recipe post-origin (bound) | 440 × ≤10 | 0.004 |
| **SUM** | alloc 1.291 + probe 0.633 + bounded 0.179 | **2.103** |

**Ruling: fantasy 2.10 ms < 8 ms bar (3.8× margin) and < 5 ms floor
(2.4× margin) → CUT.** No shape clears a bar the ceiling itself misses;
per brief, no visit-less build, no 8-pair (a ~1.3 ms-realistic mechanism
cannot resolve against ±20–70 ms machine noise — btreeset/keys precedents).
Realistic capture ≈ 1.35 ms (amortized inserts/pushes) — illustrative only.

Flame cross-check: repro2's `visit_call` incl ≈ 46–48 wt vs my 2.1 fantasy —
the dispatch slice is ~4% of the frame; the other ~44–46 wt is walks-side
(`walk_style_object` 38–49, `handle_css`, `push_want`, `line_col` — sibling
ground). T7's "visit_call 48 (dispatch slice only)" resolves: the 48 belongs
to the walks; the dispatch slice was always ~2.

## Reconciliation with the extract crew's ≈2 ms survey

report-swarm-extract §census: "origin/binding Strings ~16k allocs ≈ ~2ms
heroic". My exact census CONFIRMS it with counts: comparable ground
(origin 7,967 + selection 2,724 + declarator bindings 8,873 = 19,564 allocs)
is their ~16k order (a pre-count estimate), and my full-slice fantasy
(adding shadow inserts 11,873 + all ~70k probes + scope machinery, which they
did not split out) lands the same ≈2 ms. Their number stands — now exact.
The 3,000 member calls (their "~3000 join" order) price at zero allocs and
~3 enum matches each: pure probe vapor, 0.02 ms bounded.

## Visit-less traversal (the only revival — designed, then fenced)

A visit-less shape skips expression subtrees provably free of extract work.
Soundness needs TWO signals per skipped subtree, and both fail:

(a) **Call-presence**: skip requires ZERO `CallExpression`s (any callee
shape — selection callees are name-unbounded: any local binding or import
resolves via the scope table, so no callee-name gate is sound), zero
tagged templates on live `css`, zero JSX openings. Only call-absence —
not name-absence — is a sound predicate.
(b) **Binding-absence**: skipping must not lose shadow state —
`add_declarator_shadow`/`add_param_shadows` write to the ENCLOSING scope's
set, which outlives the skipped region (a skipped `const css = 1` corrupts
all later dispatch in that scope). Worse, `ExtractVisitor::next_scope`
numbers scopes "one id per enter_scope in walk order, mirroring the
collector" (`mod.rs:397`) — skipping scopes misaligns `ctx.scope` against
the scope table and `resolve()` reads wrong scopes. A sound skip must also
advance the counter by the skipped scope count — which requires knowing
the count, i.e. walking.
(c) The signals in (a)+(b) need a pre-walk (cost ≈ the walk itself — no
win), per-node metadata oxc does not carry (computing it is a walk), or a
byte pre-scan — which is shot2-barred avoidance logic per brief ("if that
proof needs pre-scan signals, it's shot2 territory and you CUT").

**Revival impossible on mechanism and moot on the bar. CUT stands twice.**

## Fences honored (all hard)

- Extract's LANDED `JsxHosts` union + diet lines: cited, untouched
  (v_jsx 0 re-confirms their zero-query census).
- Cloneplasma's landed E1 lines: cited, untouched.
- Scoperec's CUT scope-collect ground: cited, not relitigated
  (`scope::collect` uninstrumented; only the query-side `resolve_depth`
  twin was added, reverted).
- Recordaudit's CUT record tables: cited, untouched.
- Shot2 KILL: no skip/avoidance logic staged or built (§Visit-less above
  is a design-to-fence, not a shape).
- Sortshape bar: zero order changes (census only, fully reverted).
- T1 (`site.rs`) / T2 (literal path) / realloc `w:stage`/`w:want` /
  wantctx S1 / valgraph T4 / stageaudit T6 / analysisb / tokenphase:
  no contact — disjoint files/functions, verified by caller enumeration.

## Filler (honest: the room is dry)

- Borrowed origins: every `css_origin`/`recipe_origin` arm could borrow
  (ident arm from AST `&str`, member arms are `&'static` literals) —
  kills 7,967 small allocs ≈ 0.18 ms fantasy. Sound but sub-noise; no shape.
- Declarator bindings (8,873 ≈ 0.21 ms): only recipe-wrapping declarators
  need the name — but selecting them needs the §(a) skip predicate → fenced.
- resolve memo (8,875 × ~22 ns ≈ 0.2 ms fantasy): memo key allocs exceed
  the prize; depths are 1.95 levels of tiny BTrees. Nothing.
- Shadow fast flag: all 34,616 contains already miss at 0.4–2 ns. Nothing.
- `visitor_context` slimming (0.12 ms bounded): register moves, no allocs.
  Nothing.
- Member-callee fast path (0.02 ms): three enum matches. Nothing.
- Stacking every filler at impossible 100%: still ≈ 2.1 ms « both bars.
- Recommendation: close T7 as DRY. Revisit only if a future census shows a
  call-dense load (current: 3.8 calls/file, 75% sites).

## Tree state

- `git status`: REPORT.md untracked only; `git diff` empty (census patch +
  temp bench + bench-report byproducts all reverted).
- `git rev-parse HEAD` = `ddce131e7ab9a627500b5caa3d24bce81204dfe4` (pin).
- Tree = REPORT.md only. No commits, no pushes. No suites run (nothing to
  verify — tree == tested base HEAD). No `pnpm agentrs q` (no diet files).
- Re-census recipe: the TEMP-CENSUS patch shape is 60 counters + `resolve_depth`
  twin + `SWARM_VISITREC_OUT` dump at `compile` end; expected output is the
  §Census table on any seed-7 enterprise run.
