# NEO-LAYERS-05 — invalid `layers` config fails loudly at config load with the documented message

A malformed `layers` field stops `sync()` before anything is written. `sync()` loads the
config first (`src/sync/index.ts:286`), ahead of the session lock and the generated folder.
`validateConfig` checks `extends`, then `layers` (`src/config/validate.ts:104-107`), and each
entry check in `src/system/base/validate.ts:13-118` throws one shape: the header
`Config field 'layers' is invalid.` followed by one reason line.

The runner syncs this world fresh, with `layers: []`, and the spec first proves the sheet
lands with the brand token. Then it writes each bad config into a fresh tmpdir and asserts
that `sync(dir)` rejects with the exact two-line message and leaves no `.reference-ui/`
behind. The bad shapes are: a non-array, a null entry, a missing name, a whitespace-only
name, an entry with no synced data, an entry with an empty fragment and empty streams, and
a second entry with no synced data (its message names index 1).

Precedence: `extends: [null]` with `layers: {}` rejects with the `extends` header, so
`extends` is validated first. Accepted: `layers` omitted and `layers: []` each sync and land
the folder. CLI: spawning `bin/ref.ts sync` on a bad world prints
`[ref] sync failed: Config field 'layers' is invalid.` and the reason line on stdout
(`src/cli/sync.ts:70`), and exits 1.

Evidence: `src/system/base/validate.ts`, `src/config/validate.ts`, `src/sync/index.ts`,
`src/cli/sync.ts`; unit edges in `src/system/base/validate.test.ts`. Template: NEO-SYNC-08,
the same loud-config pattern for `include`, `name`, `jsxElements` and `extends`.

> Search terms: layers validation, invalid layers, config load, fail loud, field message, BaseSystem entries, synced data, extends first, precedence, CLI sync failed, NEO-SYNC-08, NEO-LAYERS-01
