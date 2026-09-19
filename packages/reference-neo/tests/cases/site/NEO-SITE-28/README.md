# NEO-SITE-28 — `css()` identity flows through a consumer re-export

The world keeps `export { css } from '@reference-ui/react'` in
`src/ui.ts` and a two-hop `export { css } from './ui.js'` in
`src/chain.ts`, while `src/shadow.ts` exports a same-named imposter.
The entry styles one node through each. The spec asserts the wrapper
and chain nodes paint cherry and ocean while the miss paints nothing
with zero recompile diagnostics — so site identity follows bindings
through re-exports with zero config, replacing Panda's `importMap`.

Evidence: `[atm]` ATM-SITE-55 (re-export identity); `[overmatch]`
SPEC-V2-76 rider S12; `[panda-v2]` `crates/pandacss_extractor/tests/import_map.rs`
(13 tests, replaced not copied).

> Search terms: re-export identity, wrapper module, importMap replacement, binding walk, site identity, zero config, NEO-SITE-04, ATM-SITE-55

## Sync rider (Ph4 exit filing): dependent invalidation — design note

Status: design filed by crew D (om-ph4d) 2026-09-19; not built.
Review: self-reviewed against §8 below; oracle review pending.

### 1. Problem

Sync compiles single-shot today: collect files, extract, print. Once the
Ph4 binding walk lands, files depend on each other — an edit to
`tokens.ts` changes what `App.tsx` extracts, and an edit to a wrapper
(`ui.ts`) flips which of its importers' calls are sites at all. Without
dependent invalidation the next sync either recompiles the world (slow)
or serves a stale sheet (wrong). This note files the invalidation
design the Ph4 exit requires.

### 2. Edges the resolver knows

Two edge kinds, both discovered during project collection:

- Value edges: `(importer, local)` → `(origin file, declared name)` plus
  the trail of declared names along the hops. Crew B's `Resolved`
  already carries origin + trail (for mutation poison); the reverse
  index reuses it.
- Identity edges: `(importer, local)` → Reference export plus the
  wrapper chain walked. A star hop fans out to every name imported
  through it; a default hop is one ordinary named edge (`default`).

Both walks are cycle-guarded with a visited set; both answer `None`
fail-closed (unresolvable, missing, cyclic).

### 3. Algorithm

- Reverse index: origin file → dependent files, built alongside the
  forward walk. Identity edges are recorded per import so a wrapper
  edit re-gates site discovery for exactly its importers.
- Change detector: content hash per file. Targets already parse once
  per content hash; the same hash decides "changed" — no mtime races.
- On change set C: dirty = C plus transitive reverse dependents
  (visited set, cycle-safe). Re-collect export surfaces for dirty
  files, recompile the dirty set against the warm cache, rebuild the
  sheet from all wants.

### 4. Identity vs value invalidation

- Value change (a const edit in `tokens.ts`): importers' leaves change;
  their site sets do not. Re-resolve values, keep bindings.
- Wrapper change (an edit in `ui.ts`): importers' BINDINGS may change.
  Re-run binding collection and site discovery for every importer: a
  removed `export { css }` turns live calls into silent non-sites, and
  their utilities must LEAVE the sheet — which is why the sheet
  rebuilds rather than patches.
- Star conservatism: a change to a star's source invalidates ALL
  importers of the starring file — any name may be affected.

### 5. Cache keys

- Export surface: `(path, content-hash)` — the per-hash parse cache.
- Resolved value: `(path, export)` valid while the origin file's hash
  is unchanged (mission §7.3 `cache.rs` shape).
- Traced identity: `(importer, local)` valid while every file on its
  wrapper chain keeps its hash; any chain edit re-walks that import.

### 6. Open questions

- Watcher plumbing: sync daemon vs bundler plugin — who owns the watch
  loop and the reverse index lifetime?
- Granularity: file-level (conservative start) vs `(path, export)`
  level (needs the reverse map at export granularity).
- Ladder moves: `tsconfig.json` / `package.json` edits invalidate
  everything — the specifier ladder itself moved.
- Deletion/rename: dependents' specifiers dangle (resolve to `None`).
  They must still recompile — silence is a behavior change.
- `node_modules` wrappers: content-hash or mtime for files outside the
  include globs?

### 7. Non-goals

- Incremental sheet patching: recompile dirty, rebuild the sheet. The
  sheet build is cheap next to parsing.
- Parallel invalidation: singleflight per file; the existing queue
  already serializes heavy work.
- Value-level diffing: hash equality is the only comparator. A changed
  file recompiles even if its exports are identical.

### 8. Review checklist (self-review, crew D)

- [x] No new top-level class: lives in the sync layer plus the resolver
  cache (`cache.rs`), no engine reshape.
- [x] Fail-closed: an unknown edge invalidates, never serves stale; a
  dangling specifier still recompiles its dependents.
- [x] Cycle-safe: visited sets on the forward walks (landed) and on
  reverse invalidation (this note).
- [x] Identity/value split named: wrapper edits re-gate sites, value
  edits re-resolve leaves, stars stay conservative.
- [x] Star and default edges covered (stars fan out, defaults are
  ordinary named edges).
- [ ] Oracle review pending.
