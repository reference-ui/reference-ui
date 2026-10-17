# NEO-LAYERS-14 — invalid layer and extend relations fail a real ref sync with their named message, and an unsynced upstream gives the sync hint

A layers entry is only as good as its streams, and an upstream is only as good as its names.
The spec drives the spawned `ref sync` over six bad relations in the world's `ui.config.ts` and
asserts each one: exit 1, the named header and reason on stdout, and the world's published base
system left byte-identical. It then runs one more leg over an upstream that was never synced. The
world config is rewritten per leg and restored in a `finally`, as in NEO-LAYERS-03.

Three upstreams are real sync output, synced in-process before the legs:

- `twin` is named `neo-layers14`, the consumer's own name, so its published streams carry that name.
- `b` is a plain upstream named `neo-layers14-b`. It is listed twice in the repeat legs, and once in
  each field in the both-fields leg.
- `cycle` extends the world's own published system before it is synced, so its streams carry
  `neo-layers14` back into the consumer: an A to B cycle.

The legs, with the check that owns each (`src/system/base/validate.ts`):

1. `layers: [{ name, fragment }]`, a fragment-only entry with no streams. `assertRequiredStreams`:
   only streams carry a layer's CSS, so a streamless entry would become a sync qualifier and add
   nothing to the sheet.
2. `layers: [twin]`, a self-named entry. `validateBaseSystemLinks`: the entry's name is the own name.
3. `layers: [cycle]`, the A to B cycle. `validateBaseSystemLinks`: one of the entry's stream names
   is the own name, so the config would be its own upstream.
4. `layers: [b, b]`, a name repeated within layers. `validateBaseSystemLinks`.
5. `extends: [b, b]`, a name repeated within extends. The same check, on the other field.
6. `extends: [b], layers: [b]`, a system named in both fields. `validateSharedBaseSystems`:
   `extends` already includes everything `layers` gives, so the layers entry is rejected, not merged
   (the owner's ruling, in `layers/SPEC.md`). The message names the system.
7. `layers: [unsynced]`, an installed package whose published system was never generated. Its
   exports name a file that is not there, so the config load fails and `LoadConfigError` appends
   the sync hint (`src/config/errors.ts`). The package is created for this leg only and removed in
   the same leg.

Repeats reached only through another system are not rejected here: the statement and the blocks
print each system once (NEO-LAYERS-11 proves a diamond). Only a name listed twice in one field, or
in both fields, is rejected.

Evidence: `src/config/validate.ts` (`validateBaseField`, `validateBaseFields`),
`src/system/base/validate.ts` (`assertRequiredStreams`, `validateBaseSystemLinks`,
`validateSharedBaseSystems`), `src/config/errors.ts` (`LoadConfigError` and the upstream hint),
`bin/ref.ts`, `src/cli/sync.ts`. Siblings: NEO-LAYERS-05 (the shape table and precedence),
NEO-LAYERS-03 (the order), NEO-LAYERS-06 (re-sync), NEO-LAYERS-11 (the diamond).

> Search terms: layers streams, streamless layers entry, fragment only, self-named entry, own name,
> cycle, A to B cycle, repeated entry, duplicate, both fields, named in both, sync hint, unsynced
> upstream, LoadConfigError, ref sync, NEO-LAYERS-03, NEO-LAYERS-05, NEO-LAYERS-11
