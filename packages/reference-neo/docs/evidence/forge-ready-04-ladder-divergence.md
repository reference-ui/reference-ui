# Forge READY-04: the three specifier ladders disagree on 6 of 8 probes; only the alias row threatens a pinned station today.

World + harness (read-only, `/tmp` only): `/tmp/forge-ready-04/world/` (8 fixtures), `/tmp/forge-ready-04/ladder.mjs` (faithful ladder re-implementation, line-cited below). Importer in all rows: `src/app.ts`.

## Divergence table

| # | Probe (specifier → world) | atomic `extract/resolver/*` | tasty `scanner/*` | styletrace `resolver/path.rs` | Agree? |
|---|---|---|---|---|---|
| 1 | relative `./tokens` → `src/tokens.ts` | HIT | HIT | HIT | yes |
| 2 | alias `@/aliased` → `src/aliased.ts` (tsconfig `paths`) | HIT | MISS | MISS | **no (A)** |
| 3 | index `./dir` → `src/dir/index.ts` | HIT | HIT | HIT | yes |
| 4 | `.js`→`.ts` `./real.js` → `src/real.ts` | MISS | MISS | HIT | **no (S)** |
| 4b | `.js`→`.d.ts` `./decl.js` → `src/decl.d.ts` | MISS | HIT | HIT | **no (A)** |
| 5 | exports conditions `pkg-cond` → `dist/c.d.ts` (types/import/default) | HIT | HIT | HIT | yes |
| 6 | exports star `pkg-star/features/button` → `lib/button.js` | HIT | MISS | MISS | **no (A)** |
| 7 | `@types` fallback `only-types` → `@types/only-types/index.d.ts` | MISS | HIT | HIT | **no (A)** |
| 8 | symlink+types `linked-pkg` → `index.d.ts` via symlinked dir | MISS | HIT | HIT | **no (A)** |
| 9 | `export *` VALUE walk (`export * from`, then import the name) | MISS | HIT | HIT | **no (A)** |

(A) = atomic is the outlier, (S) = styletrace is the outlier. Row 9 is an extra beyond the 8 mandated probes; it is the walk half of the ladder and ATM-SITE-78 will pin it.

## Why each row lands there (mechanism, line-cited)

- 1/3 agree: atomic probes `{.ts,.tsx,.js,.jsx}` + `index.{ts,tsx,js}` (`modules/atomic/src/extract/resolver/specifier.rs:34-39`); tasty probes `{d.ts,d.mts,d.cts,ts,tsx}` + 5 index names (`modules/tasty/src/constants/scanner.rs:24-33`, `modules/tasty/src/scanner/packages/relative.rs:34-41`); styletrace stats `"",.ts,.tsx,.d.ts,.mts,.d.mts` then 5 index names (`modules/styletrace/src/resolver/path.rs:26-36,38-51,72-87`). All three orders contain the fixture hit.
- 2 alias: atomic reads nearest `tsconfig.json` (`paths`, first `*`, `baseUrl`, no `extends`) (`modules/atomic/src/extract/resolver/bare.rs:26-38`, `modules/atomic/src/extract/resolver/tsconfig.rs:27-39,47-62`). Tasty has no tsconfig branch (`modules/tasty/src/scanner/packages.rs:17-39` dispatches relative-vs-external only; zero `tsconfig` hits in tasty+styletrace sources). Styletrace delegates bare imports to tasty (`modules/styletrace/src/resolver/tracer/context.rs:200-206`).
- 4 remap: only styletrace maps `.js→{.mjs,.d.ts,.ts,.tsx,.mts,.d.mts}` (plus `.mjs`/`.cjs` maps) (`modules/styletrace/src/resolver/path.rs:53-70`). Atomic appends extensions to the literal `./real.js` (`real.js.ts`…) so it never strips (`modules/atomic/src/extract/resolver/specifier.rs:27-41`). Tasty maps runtime exts to `.d.ts` only (`modules/tasty/src/scanner/packages/relative.rs:43-52`).
- 4b: `.d.ts` is absent from atomic's probe lists entirely (`specifier.rs:34-39`, `bare.rs:120-130`); present in tasty (`T_EXTS`/`T_INDEX`) and styletrace (`path.rs:39,74`).
- 5 agrees on the pinned shape: atomic unwraps conditions `types,import,default` (`modules/atomic/src/extract/resolver/package.rs:93-108`); tasty unwraps `types,import,default,require` (`modules/tasty/src/scanner/packages/package_json.rs:32-41`); both pick `types` here. Sub-divergence (no row): tasty reads `require`, atomic does not; and neither falls through to the next condition when the first target is missing from disk/graph (atomic tries types-mapped then direct subpath, `bare.rs:46-60`; tasty tries next root candidate / direct subpath, `modules/tasty/src/scanner/packages/package_entry.rs:108-126`).
- 6 star: atomic substitutes `*` once after exact match (`modules/atomic/src/extract/resolver/package.rs:60-80,83-91`); tasty's exports reader has no pattern arm — exact key, then root-only conditions (`modules/tasty/src/scanner/packages/package_json.rs:15-41`); styletrace inherits tasty's miss via delegation.
- 7 `@types`: tasty-only, via installed-provider scan + `@types/x`→`x` / `a__b`→`@a/b` mapping (`modules/tasty/src/scanner/packages/package_entry.rs:17-35`, `modules/tasty/src/scanner/paths/package.rs:41-56`). No `@types` logic in atomic (`bare.rs:41-61` walks `node_modules/<pkg>` only) or styletrace proper.
- 8 symlink: all three tolerate the link (atomic reads through it lexically, `bare.rs:64-68` + `mod.rs:81-96`; tasty/styletrace `is_dir`/`is_file` follow it), but the miss is atomic's missing `types/typings/module/main` fallback: atomic tries exports-mapped then direct subpath only (`bare.rs:46-60`), while tasty tries `types,typings,exports("."),module,main`, then `index` (`modules/tasty/src/scanner/packages/package_entry.rs:108-140`). Any types-only or `main`-in-subdir package misses in atomic even without a symlink. Tasty pins symlink traversal (`modules/tasty/src/scanner/packages/tests.rs:250-267`).
- 9 star walk: atomic records no `export *` shape (`modules/atomic/src/extract/resolver/exports.rs:6-7`; walk follows `Local`/`Hop` only, `modules/atomic/src/extract/resolver/walk.rs:79-89`). Tasty fans out `export_all_targets` first-wins, cycle-guarded (`modules/tasty/src/ast/resolve/index.rs:159-207`). Styletrace follows `export_all_sources` (`modules/styletrace/src/resolver/parser.rs:91`, `modules/styletrace/src/resolver/tracer/context.rs:252-259`). Note atomic's *identity* walk DOES track stars (`modules/atomic/src/extract/identity_map.rs:47-62,202-211`) — the gap is values-only.

Agreement details worth pinning: dangling links miss silently in all three (atomic `.ok()?`, tasty/styletrace `is_file=false`); absolute specifiers miss in all three (atomic `specifier.rs:28-30` + `package.rs:11`, tasty treats as external and finds no package); `require`-only conditions and `.cts` spellings differ at the margins (tasty has `d.cts`, styletrace `.mts`, atomic neither).

## Runner evidence (this session, repo runners only)

- Tasty `scanner` (live build): 21 passed, incl. `external_import_uses_types_exports_for_root_and_subpath`, `external_import_falls_back_to_installed_types_provider`, `relative_import_prefers_declaration_candidates_for_runtime_entries`, `external_import_resolves_scoped_package_via_symlinked_node_modules_path` (`pnpm agentrs cargo --crate tasty -t scanner`).
- Styletrace `resolver` (live build): 3 passed (`path::prefers_sync_root_source_files_over_dist_outputs` + 2 `sync_root`); no unit test covers `.js→.ts` mapping in `path.rs:53-70` — test-plan gap (`pnpm agentrs cargo --crate styletrace -t resolver`).
- Atomic `extract::resolver`: 27 passed (`pnpm agentrs cargo --crate atomic -t extract::resolver`), BUT see blocker: the binary predates a same-session rename; its test-name set was verified identical to the on-disk `#[test]` fns (bare 3, exports 4, package 4, specifier 4, tsconfig 4, walk 8), so outcomes stand for the ladder logic.

## Slice 3 notes (station impact, surveyed 2026-09-19)

- Row 2 KEEPS atomic semantics or ATM-SITE-54 changes: it pins `@/tokens` via input `tsconfig.json`, `./nested`→`index.ts`, `./ui`→`ui.tsx`, and `theme-pkg/tokens` via an exact-string `exports` map (`tests/cases/ATM-SITE-54/input/`, README "a target no direct subpath reaches"). Tasty semantics would drop `brand`. The shared crate must carry atomic's alias arm.
- Row 9 is additive for values but fenced by ATM-SITE-55: its only `export *` is `export * from '@reference-ui/react'` (`tests/cases/ATM-SITE-55/input/src/star.ts`), pinned through the *identity* walk (`Star.tsx` live, `MissDefaultStar.tsx` "stars never carry default"). Value fan-out must keep both outputs: no value origin for `css` in the external package → still miss. ATM-SITE-78 adds the value-star pin.
- Rows 4/4b/6/7/8 are additive: no station input contains a `.js` specifier (all `.js` hits are `spec.ts` harness imports e.g. `../../helpers.js`), a star-pattern or conditional `exports` map (sole input manifest is SITE-54's exact-string one), an `@types` dir, a live value-bearing symlink (SITE-58's `node_modules/@reference-ui/react` dangles by design — wipe-state discovery, README says so), or a `.js/.jsx` source file. Adopting tasty/styletrace wins on these rows changes no golden.
- Row 5's agreed shape (exact-string `exports`) is SITE-54-pinned; keep it. The `require`-condition and next-condition-fallthrough margins are unpinned — decide in the crate, add tests.
- BLOCKER (tree state, not a verdict): `modules/atomic/src/extract/resolver/bare.rs:48` calls `exports_mapped(&pkg_dir, &subpath)` but `:64` defines `exports_mapped(pkg_dir`; the last good test binary (`dist/cargo/debug/deps/atomic-3bd99277164b6d72`, built 10:41) contains symbol `bare::exports_mapped` (`nm`), i.e. the def was renamed after the build and the tree no longer recompiles (E0425 on next real rebuild; cargo reports "fresh" on mtime). A sibling edit in the shared tree; not fixed here (READY is read-only). Slice 3 cannot verify "answer identically" until this compiles.

## Shared-crate first test plan (from the table)

1. relative + extension order + index order (row 1/3, all three orders incl. `.jsx`/`index.jsx` gaps); 2. tsconfig `paths` star, exact, `baseUrl`-less, nearest-wins, `extends`-ignored (row 2); 3. `.js→.ts`, `.js→.d.ts`, `.mjs/.cjs` maps, extensionless→`.js` source question (rows 4/4b); 4. exports exact/conditions/star/`require`/missing-first-condition (rows 5/6); 5. `types/typings/module/main` + `index` fallback incl. types-only package (row 8 minus link); 6. `@types` incl. scoped `__` mapping (row 7); 7. live symlink package + dangling-link miss (rows 8, SITE-58 shape); 8. `export *` value fan-out first-wins + cycle + `default`-never (row 9, SITE-55 fence); 9. `export {x} from` chains + import-then-export edge (already pinned in `walk.rs` tests, carry over).

Slice 3 note: keep atomic's alias + exact-exports arms verbatim (SITE-54), adopt tasty's types/main/@types/star-walk wins (all additive), take styletrace's `.js` remap; unblock on the `bare.rs:48/64` rename first.
