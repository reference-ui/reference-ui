---
date: 2026-09-24
cycle: night-g1-sync
module: neo/sync/watch
theories_spent: 1
verdict: break-found
---

# Watch freezes its trigger scope at boot: include-glob changes never take effect for triggering

## Hypothesis

Gap pursued: `watchSync` builds its trigger scope once — `isMatch:
picomatch(loaded.config.include)`, `dependencyFiles`, `roots`, and the
parcel subscriptions (`packages/reference-neo/src/lib/watch/index.ts:322-355`)
— and the resync path (`:335-344`) calls `sync()`, which reloads the config
fresh for the *compile*, but never rebuilds the matcher, roots, or
subscriptions. So a config `include` change under a live watch half-takes
effect: the config edit itself resyncs (the config file is a dependency
file, matched exactly) and that resync compiles with the NEW include — but
every file added later under the newly-added glob is silently missed,
because `toWatchChange` (`:170-175`) still tests the OLD matcher. Narrowing
has the inverse symptom (removed globs keep waking the watcher) by the same
mechanism.

Fresh ground: tonight's filed breaks are all diagnostics/resolve ground
(r1-neo codeless throws, r1-trio atlas package silence, r1-atomic bare-attr
spans, r1-tasty two-hop drops, r1-audit orphan code, r2-stardefault phantom
default, r2-tasty2 cross-file typeof, r3-defaultas default-hop drops;
r3-sttthrow clean), confirmed via the doom CLI search. Pipeline behavior is
covered by SYNC-06 (byte-identical re-sync), SYNC-15 (discovery + second
sync), CLI-01 (lifecycle/clean-restore), CLI-02 (watch boot/resync/debug),
SYNC-14 + WATCH-01 (the self-declared "one coverage home for the watch
behavior") — but SYNC-14's spec performs zero config edits
(verified: no `config`/`include` line in `watch.spec.ts`; its
"config-dependency resync" leg exists only in prose), so post-boot
trigger-scope refresh is unpinned anywhere.

Red test (`/tmp/doom-g1-sync-watch-include.mjs`, blind-runnable via repo
tsx, exits 1, world in /tmp, tree untouched): baseline sync with
`include: ['theme/**']`, start `watchSync`, widen the config to add
`extra/**` (setup proof: the config-widen resync IS observed,
`events=[add:ui.config.ts]`), then add `extra/new.ts` carrying an ink
utility. Result: 12s window, `onChange=false resync=false`, sheet lacks
the ink fill. Control: one-shot `sync()` on the identical tree compiles
the ink fill in — watch and one-shot diverge on the same tree state.
Parcel delivers the event (the world root is subscribed via the config-dep
dir); the stale matcher drops it before any schedule.

Carried but unspent (free research, needs its own red test): when the
process cwd differs from the world dir for the whole run (e.g. `ref sync
--watch <foreign-dir>`, which the CLI accepts as `[dir]`), esbuild
metafile inputs relativize against the process cwd and
`normalizeConfigDependencyPaths` (`src/config/bundle.ts:21-34`) resolves
them against the config dir, yielding phantom dependency paths; watch
roots derived from them point at nonexistent dirs and `subscribe` dies
with bare `No such file or directory`. Observed empirically in-harness
(print of phantom deps/roots); the real-bin crash itself is unrun.

## Verdict

`break-found`. Repro: `/tmp/doom-g1-sync-watch-include.mjs` (run:
`packages/reference-neo/node_modules/.bin/tsx
/tmp/doom-g1-sync-watch-include.mjs` from the repo root; exits 1 on the
red assertion, removes its /tmp world, writes nothing to the tree —
`git status` shows only pre-existing campaign modifications plus fellow
hunters' concurrent logs).

Violated contract:

- `watchSync` promises to "resync on every matched add/change/unlink
  until stop()" (`src/lib/watch/index.ts:294-303`) with "scope is the
  config include globs plus the config file's own dependencies" (module
  header, `:1-9`) — after an include-widen, adds under the config's
  globs are matched-by-config yet never resync; the scope is the
  boot-time include, not the config's.
- NEO-SYNC-14 README: "Every resync re-scans the include globs from
  disk, so all three nouns ride the same serial sync" — the compile
  side re-scans, the trigger side never does, so watch output diverges
  from one-shot output on the same tree.

Severity: user-facing. Widening `include` under `ref sync --watch`
silently stops delivering new files with no signal — the served sheet
goes stale while one-shot reports the truth. Only a watcher restart
recovers, and nothing tells the user one is owed.
