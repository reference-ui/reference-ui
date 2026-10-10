# RovingFocus

Composite-widget keyboard kernel: roving `tabindex`, arrow movement,
Home/End/PageUp/PageDown endpoints, disabled skipping, optional looping,
optional typeahead, optional two-dimensional movement. Root and Item are
transparent — they slot behavior onto one authored child each and render no
wrapper nodes.

Contract: [RovingFocus.md](./RovingFocus.md). Cases: [TESTS.md](./TESTS.md).
Features: [FEATURES.md](./FEATURES.md).

## Architecture

The kernel is a pipeline from registration to focus. Items register live
entries into the root's collection; currentness keeps exactly one entry as
the sole tab stop and repairs it when the DOM shifts underneath; keyboard
dispatch resolves each key through the movement or typeahead submodules and
focuses the destination. Everything reads live nodes on every pass — no
cached order, no cached geometry — so keyed reorder, CSS reflow, and label
changes are observable without re-registration.

`parts/` owns the public surface: Root composes the hooks and provides
context, Item slots tabIndex and kernel handlers onto its child. `hooks/`
holds the four root behaviors — registry, currentness, typeahead session,
keyboard dispatch — returning data, handlers, and refs, never JSX. The
domain folders hold the isolated logic the hooks compose: `collection/`
orders entries by document position, judges availability, and repairs stale
current ids; `movement/` resolves one-dimensional arrows plus endpoints and
the visual-grid geometry; `typeahead/` owns the search buffer, its entry
guards, and label derivation; `slot/` owns the transparent-part merge and
the single-element anatomy gate. `shared/` carries what every layer
reaches for: event chaining, ref fan-out, node resolution, ids, and
inherited direction. `types.ts` and `context.ts` are the contracts between
the layers, and `RovingFocus.tsx` re-exports the public seams — movement,
typeahead, direction, context — so deep importers see no change.

Each isolated submodule proves itself in a colocated unit test with no
browser and no mount; the component suite keeps the SSR, anatomy, and merge
integration cases, and the browser suite proves the full matrix.
