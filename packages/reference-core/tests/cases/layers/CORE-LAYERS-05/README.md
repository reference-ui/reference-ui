# CORE-LAYERS-05 — invalid `layers` config fails loudly at config load with the documented message

A malformed `layers` field stops `sync()` before anything is written. `sync()` loads the
config first (the sync entry), ahead of the session lock and the generated folder.
`validateConfig` checks each base-system field in full (`validateBaseFields`,
config validation): per entry, the shape and synced data, then streams for layers. Each
failing check throws one shape: the header `Config field 'layers' is invalid.` followed by one
reason line (the base-system link check).

The runner syncs this world fresh, with `layers: []`, and the spec first proves the sheet
lands with the brand token. Then it writes each bad config into a fresh tmpdir and asserts
that `sync(dir)` rejects with the exact message and leaves no `.reference-ui/` behind. The bad
shapes are: a non-array, a null entry, a missing name, a whitespace-only name, an entry with no
synced data, an entry with an empty fragment and empty streams, a second entry with no synced
data (its message names index 1), and a fragment-only entry, which carries synced data but no
streams.

Precedence: `extends: [null]` with `layers: {}` rejects with both headers, `extends` first,
because each field is checked on its own and the two messages join with a blank line. A single
bad field keeps its own two-line message. Accepted: `layers` omitted and `layers: []` each sync
and land the folder. CLI: spawning `ref sync` on a bad world prints
`[ref] sync failed: Config field 'layers' is invalid.` and the reason line on stdout
(the CLI sync command), and exits 1.

The relations between entries (a self-named entry, a cycle, a repeat within one field) are
proven by CORE-LAYERS-14 through a real `ref sync`.

Evidence: the base-system link check, config validation, the sync entry,
the CLI sync command; unit edges in the base-validation coverage and
the config-validation coverage. Template: CORE-SYNC-08, the same loud-config pattern for
`include`, `name`, `jsxElements` and `extends`.

> Search terms: layers validation, invalid layers, config load, fail loud, field message, BaseSystem entries, synced data, streams, extends first, both fields, precedence, CLI sync failed, CORE-SYNC-08, CORE-LAYERS-01, CORE-LAYERS-14
