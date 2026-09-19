# StyleTrace Slice #2 — Witness Baseline (W)

Date: 2026-09-18. Mission: `docs/missions/completed/styletrace.md` § "Slice #2", step 1.
Method: `pnpm --filter @reference-ui/lib sync` with the current binary and
config (Book watcher on :5000 running; sync only rewrites the gitignored
folder it watches), then copy the five frozen files here. No source edits.

## Files

| File | Source | sha256 |
|---|---|---|
| `styles.css` | `.reference-ui/styled/styles.css` (the sheet) | `873db031…3d61a` |
| `jsx-elements.json` | `.reference-ui/system/jsx-elements.json` (`local` = the same 53) | `949d49bc…a0a1b` |
| `baseSystem.mjs` | `.reference-ui/system/baseSystem.mjs` (portable system) | `eae76162…70b2c9` |
| `react.d.mts` | `.reference-ui/react/react.d.mts` (type surface) | `1182de65…8857ef` |
| `compile-request.json` | `.reference-ui/system/compile-request.json` (6 keys, `jsxHosts` = 154) | `23750608…87f06f` |

(Full hashes: `shasum -a 256` over this folder; pre-sync hashes in
`/tmp/st-slice2-pre-sync.sha`, post-sync in `/tmp/st-slice2-post-sync.sha` —
since `/tmp` is ephemeral, the authoritative record is this folder.)

`jsx-elements.json`: `{ primitives: [], upstream: [], local: 53, merged: 53 }`.
`compile-request.json` keys: exactly
`schemaVersion, spec, jsxHosts, sourceRoot, declarationRoot, include`;
`jsxHosts` = 53 configured + 101 Neo primitives = 154.

## Sync report

- Command exit 0, `[neo] sync 614ms`, no styletrace warnings.
- Post-sync bytes are **identical** to the pre-sync (16:40) state for all five
  files: the re-sync is a pure re-materialization, so this baseline also
  describes the tree as the slice #3/#4 crews found it.

## Working-tree context (read-only observation, not endorsement)

The baseline was cut on HEAD `793ba6d6d` with uncommitted working-tree changes
present (a slice #4–shaped traced leg: `sync/index.ts` +
`sync/jsx-elements.ts` + untracked `sync/styletrace.ts` + `NEO-SYNC-15` case +
`contracts/types.ts` `tracedJsxHosts`). The re-sync exercised that leg: it ran
before the wipe against the previous sync's declarations, contributed zero new
names (`local` still exactly the 53), and printed no warnings. Corroboration
(`/tmp/st-slice2-quick.mjs`, single-root strategy from slice #1):
`trace(<lib>/src, <lib>)` → 53 names, 0 missing, 0 extra, 0.5 s.
A per-root parallel replica of the in-flight root scan
(`/tmp/st-slice2-traced.mjs`) hung and was abandoned; the in-process leg inside
`sync` itself completed normally, so the hang is a property of the throwaway
probe, not the product path.

Post-cut note (same day, ~19:40): a parallel crew reshaped the working tree
after this baseline was frozen — `sync/index.ts` reverted to HEAD, untracked
`sync/styletrace.ts` and `NEO-SYNC-15/` removed, `TESTS.md` reverted;
`sync/jsx-elements.ts` (union with defaulted `traced`) and
`contracts/types.ts` (`tracedJsxHosts?`) remain modified. This section above
still describes the true sync-time conditions. Live `.reference-ui/` output
re-verified byte-identical to this folder after the reshape, and the reshaped
tree reproduces these bytes (union over an empty traced set), so the baseline
stands as cut.

## Binary provenance

- Runtime: `node` reports `darwin x64`, so the NAPI loader resolves the
  `darwin-x64` triple to `dist/native/virtual-native.darwin-x64.node`.
- `virtual-native.darwin-x64.node`: 2026-09-18 15:39:56 — **newer than every
  `.rs` under `modules/`** (newest: `styletrace/src/resolver/tracer/context.rs`
  @ 15:39:34, 22 s older). Binary is current; no rebuild between plan time
  and this baseline.
- `virtual-native.darwin-arm64.node`: 2026-09-17 23:10:16 (stale, not loaded on
  this host). `virtual-native.linux-x64-gnu.node`: 2026-09-16 (not loaded).

## What this baseline is for

Slice #5 acceptance diffs every W artifact against this folder: the four files
above must be byte-identical, and `compile-request.json` may differ only in
`jsxHosts` (the 53 gone — discovered, not requested). Anything else that moves
is drift: stop, attribute, decide. Component snapshots (lib CT) and Book
spot-checks are witnessed separately, not frozen here.
