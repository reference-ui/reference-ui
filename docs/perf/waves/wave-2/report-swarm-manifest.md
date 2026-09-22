# REPORT: swarm-manifest — `root_targets` manifest triple-parse dedup

## Verdict

**CUT (mechanism unreachable on the measured load: `root_targets` calls = 0, manifest parses = 0 on the seed-7 enterprise sync — ceiling 0.00 ms on both prongs)**

One line: the 3× parse exists in code but no manifest can ever reach it on the bench — staged paths are absolute under `$TMPDIR`, the generator writes no `node_modules`, and no ancestor dir up to `/` holds one, so `package_hit`'s `is_dir` gate fails on every level for every bare specifier.

## Base / binaries

- Base commit: `5844b24a81a528ace14fab63e908793a6829a874` (verified `git rev-parse HEAD` before any work; docs-only filing over wave-1 landing `0a7330c76`, `packages/` tree identical)
- Base `.node` sha256: N/A — never built (no `dist/` in fresh worktree; CUT before any build)
- Candidate `.node` sha256: N/A — CUT before implementation, no candidate built
- `git diff --stat`: empty (only this REPORT.md is untracked; zero source edits)
- Bench lock: never held by this crew (counted, never built, no lock hold)

## The 3× is real in code (reseed observation confirmed)

`packages/reference-rs/modules/module-graph/src/ladder/package.rs:59-64`:

```rust
pub(crate) fn root_targets(manifest: &str) -> Vec<String> {
    let mut targets = field_entries(manifest, &ROOT_FIELDS[..2]);   // parse #1
    targets.extend(export_targets(manifest, "."));                  // parse #2
    targets.extend(field_entries(manifest, &ROOT_FIELDS[2..]));     // parse #3
    targets
}
```

Each of `field_entries` / `export_targets` opens with `serde_json::from_str::<serde_json::Value>(manifest)`. Per root resolve: 3 full parses of identical bytes; dedup would keep 1. Redundant fraction 2/3 — IF any root resolve ever ran.

## Mechanism counts (seed-7 enterprise load — structural zero, every link verified)

| mechanism quantity | base | cand | delta |
| --- | --- | --- | --- |
| `root_targets` calls per sync | **0** | 0 | 0 |
| `export_targets` calls per sync | **0** | 0 | 0 |
| manifest parses per sync | **0** | 0 | 0 |
| distinct manifests parsed | **0** | 0 | 0 |
| bytes re-parsed | **0** | 0 | 0 |

Proof chain (each link read in source, filesystem links probed live):

1. **Sole entry.** Exhaustive grep: `root_targets` / `export_targets` are called only from `manifest_hit` (`ladder/mod.rs:193,195`), which requires `manifest: Some` — and `package_hit` (`ladder/mod.rs:174-182`) returns `None` before any read unless `is_dir(<ancestor>/node_modules/<pkg>)`.
2. **Gate is pure disk.** `AtomicFs::is_dir` (`atomic/src/extract/resolver/source.rs:77-78`) probes only `DiskFs` (memoized); staged sources cannot fake a package dir. `DiskFs::is_dir` (`module-graph/src/fs.rs:39-40`) is `std::fs::metadata` (symlink-following).
3. **Staged paths are absolute under `$TMPDIR`.** Live path is the fragment scan, not legacy `compile-files.ts`: `scanFragmentSources` uses `fg.sync(include, { cwd, absolute: true })` and stages `candidates[index]` verbatim (`reference-neo/src/fragments/lib/scanner.ts:166-171,202`) → `scannedSources` → native `files` → `resolve_file_imports(path)` as-is (`atomic/src/lib.rs:423`) → `ModuleKey::new` (lexical normalize only, `module-graph/src/key.rs:17-19,71-83`). Bench repos are `mkdtempSync(join(tmpdir(), 'neo-bench-'))` (`benchmark/cli.ts:146`); `$TMPDIR=/var/folders/r_/j2qpyfhj4kv9tnqc2kfhyhwh0000gn/T/`.
4. **No `node_modules` anywhere on the chain.** Generator writes none (`app.ts`, `churn.ts`, `measure/` — zero matches for `package.json|node_modules|tsconfig`). Live probe of every `ancestors()` level (`key.rs:47-62`, string-walk to `/`): `/`, `/var`, `/var/folders`, `/var/folders/r_`, `…/j2q…/`, `…/T/`, plus `/tmp`, `/private/tmp` — all miss (`[ -d …/node_modules ]`, symlink-following like `DiskFs`). The workspace's own `node_modules` is NOT an ancestor of `/var/folders/…`, and `ancestors()` never consults process cwd (paths are absolute).
5. **Therefore the gate fails at every level for every bare specifier** (`@reference-ui/react`, `@reference-ui/neo` in every style file; dead files import nothing — `dead.ts`), `manifest` is never `Some`, `manifest_hit` exits at `manifest?`, and the triple-parse never executes. Same generator/scanner serves all 4 scales → zero on all of them.

Filed-flame corroboration (read-only, `docs/evidence/flamegraph/enterprise-flame3/`): no `serde_json` parse frames on the resolve path (only 2 wt `deserialize_string` + 4 wt `drop_in_place<Value>` slices under generic alloc/memmove attribution); `package_hit` appears only in ≤8 wt probe/malloc slices — consistent with zero manifest parses.

## Why it can't land (ceiling math)

Ceiling = (parses per sync) × (cost per parse) × (redundant fraction 2/3) = 0 × ~µs × 2/3 = **0.00 ms / 0.00%**. LAND bar is ≥15 ms **and** ≥1.5% (≈17.5 ms on the ~1164 ms base). Both prongs miss by the full bar at any capture rate — the ceiling itself bars, so per protocol this CUTs rather than BANKs (nothing proven-identical to bank: there is no diet, only dead code on this load).

## A/B, output hashes, determinism

Not run — no candidate was built. An 8-pair A/B of a structural zero would burn the shared bench lock for a foregone CUT (swarm-keys precedent).

Determinism: the zero is structural, not sampled — same generator, same scanner, same `ancestors()` walk, same live filesystem on every run. Any future run on this box reproduces it unless a `node_modules` appears on the `/var/folders/… → /` chain (see revival condition).

## Correctness (rule 1)

- (a) Zero diff: no suites apply. Tree verified byte-clean (`git status` shows only this untracked REPORT.md); no build artifacts created (no `dist/`, no `.node`).
- (b)/(c) Vacuous — nothing changed.

## Collision / scope notes (for the captain)

- Untouched per brief: sibling reseed observations (`lower_when` memo, resolve-path `format!`s) — separate future topics, noted only. No interaction with this CUT: those mechanisms live on reached paths (modgraph counted 79,431 `lower_when` calls), this one lives on an unreached path.
- Revival condition (filed so no wave retries blind): this hypothesis revives ONLY if the bench load changes shape — generated repos gain `node_modules` with resolvable manifests, or staged paths go cwd-relative so `ancestors()` can reach the workspace's `node_modules`. On the current frozen load it is dead code, not diet.
- Real-repo caveat (not a bench claim): on user repos WITH `node_modules`, the 3× does execute per unmemoized bare-root resolve (`ProbeMemo` caches manifest *text*, never parsed `Value`s or resolve outcomes). A future crew could dedup it as a robustness win, but it would score 0.00 ms on the frozen seed-7 load — do not crew it for syncMs.

## Process note

Lock discipline: `/tmp/swarm-bench-lock` was held by swarm-cascade for the entire session; this crew ran zero builds, zero tests, zero bench commands — grep/read/`ls`/`[ -d ]` probes only. Grounding covered VOYAGE.md, LOG.md (rooms/backlog/dead-ends/process-lessons), the wave-2 modgraph report (absolute path, read-only), the wave-1 reserve report, the agent-rs skill, and `docs/evidence/README.md` + filed flame texts.
